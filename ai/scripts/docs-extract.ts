// docs-extract.ts — deterministic AST extraction of SvelteKit pages.
// Input: +page.svelte files under the FE app routes dir. Output: pages.json facts.
// No LLM. Facts only: route, zod schema fields, apiFetch endpoints,
// navigation (goto/window.open), template CTAs (FormField/Checkbox/Button).
//
// Usage: bun scripts/docs-extract.ts > pages-all.json
// Env:   FE_DIR — frontend repo root (default: ../../../primebrick-fe-v3)
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WORKSPACE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const FE = process.env.FE_DIR ?? join(WORKSPACE, 'primebrick-fe-v3');
const req = createRequire(join(FE, 'package.json'));
const svelte = (await import(pathToFileURL(join(FE, 'node_modules/svelte/compiler/index.js')).href)).default;
const ts = req('typescript');

const ROUTES = `${FE}/src/routes/(app)`;

// ── helpers ─────────────────────────────────────────────────────────────
function humanize(key) {
  const last = key.split('.').pop();
  return last.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    // e.g. sendInvitation → "send Invitation"
}

function zodFieldInfo(initExpr, srcText) {
  // unwrap chains: z.string().min(1).default('x') → { type, required, constraints }
  const info = { type: 'unknown', required: true, constraints: [], default: undefined };
  let node = initExpr;
  while (node && ts.isCallExpression(node)) {
    const exprText = node.expression.getText(srcText);
    const zBase = exprText.match(/^z\.(\w+)$/) ?? exprText.match(/\)\.(\w+)$/);
    if (/^z\.\w+$/.test(exprText)) { info.type = exprText + '()'; break; }
    const m = exprText.match(/\.(\w+)$/);
    const method = m?.[1];
    if (method === 'optional' || method === 'or' || method === 'nullable') info.required = false;
    if (method === 'default') { info.required = false; info.default = node.arguments[0]?.getText(srcText); }
    if (['min','max','email','url','regex','refine','superRefine'].includes(method))
      info.constraints.push(method + '(' + node.arguments.map(a=>a.getText(srcText)).join(', ').slice(0,60) + ')');
    node = ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression)
      ? node.expression.expression : node.expression;
  }
  if (node && ts.isIdentifier(node)) info.type = node.getText(srcText); // helper wrapper e.g. idpNameSchema(...)
  return info;
}

function extractScriptFacts(scriptText) {
  const sf = ts.createSourceFile('page.ts', scriptText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const facts = { fields: {}, endpoints: [], navigations: [], composables: [], schemaVar: null, superRefines: 0, customActions: [], constUrls: {} };
  const visit = (n) => {
    // const url = '/route/...' — resolve window.open/goto variable targets
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer &&
        (ts.isStringLiteral(n.initializer) || ts.isNoSubstitutionTemplateLiteral(n.initializer) || ts.isTemplateExpression(n.initializer))) {
      const v = n.initializer.getText(sf).replace(/[`'"]/g, '');
      if (v.startsWith('/')) facts.constUrls[n.name.text] = v;
    }
    // apiFetch('/path', {method})
    if (ts.isCallExpression(n)) {
      const callee = n.expression.getText(sf);
      if (callee === 'apiFetch' || callee === 'apiFetchWithTimeout') {
        const url = n.arguments[0]?.getText(sf)?.replace(/['"`]/g,'');
        const opts = n.arguments[1]?.getText(sf) || '';
        const method = opts.match(/method:\s*['"](\w+)/)?.[1] || 'GET';
        if (url?.startsWith('/')) facts.endpoints.push({ method, path: url.split('?')[0] });
      }
      // persistence via composable methods: roleMappings.create(...) / .update(...)
      const cm = callee.match(/^(\w+)\.(create|update|save|remove|delete|purge)$/);
      if (cm && !['next','prev','this','selected_permissions','errors'].includes(cm[1])) {
        facts.endpoints.push({ method: cm[2].toUpperCase(), path: `(via ${callee})` });
      }
      if (callee === 'goto' || callee === 'window.open') {
        let arg = n.arguments[0];
        // typed-routes idiom: goto(resolve('/path')) — the literal lives
        // inside the resolve() call
        if (arg && ts.isCallExpression(arg) && arg.expression.getText(sf) === 'resolve')
          arg = arg.arguments[0];
        let target = arg?.getText(sf)?.slice(0,120);
        const idm = target?.match(/^['"`]?(\w+)['"`]?$/);
        if (idm && facts.constUrls[idm[1]]) target = facts.constUrls[idm[1]];
        if (target?.includes('${') || /^['"`]/.test(target ?? '')) target = target.replace(/[`'"]/g, '');
        facts.navigations.push({ kind: callee === 'goto' ? 'same-tab' : 'new-tab', target });
      }
      if (callee.match(/^use[A-Z]/)) facts.composables.push(callee);
      if (callee.endsWith('superRefine')) facts.superRefines++;
      // plain-state form fields: let idp_role = $state('') / is_admin = $state(false)
      if (callee === '$state' && n.parent && ts.isVariableDeclaration(n.parent) && ts.isIdentifier(n.parent.name)) {
        const fname = n.parent.name.getText(sf);
        if (!['errors','saving','orgs','orgsLoading','meta','rows','loading','error','search','appliedSearch','page','pageSize','total','visibleKeys','selectedKeys','filtersOpen','viewMode'].includes(fname) && !facts.fields[fname]) {
          const init = n.arguments[0];
          const t = init ? (ts.isStringLiteral(init) ? 'string' : init.kind === ts.SyntaxKind.TrueKeyword || init.kind === ts.SyntaxKind.FalseKeyword ? 'boolean' : ts.isNumericLiteral(init) ? 'number' : 'unknown') : 'unknown';
          facts.fields[fname] = { type: t, required: !t.match(/boolean|number/), constraints: [], default: init?.getText(sf), fromState: true };
        }
      }
      if (callee === 'z.object') {
        const arg = n.arguments[0];
        if (ts.isObjectLiteralExpression(arg)) {
          for (const p of arg.properties) {
            if (ts.isPropertyAssignment(p)) {
              const name = p.name.getText(sf);
              facts.fields[name] = zodFieldInfo(p.initializer, sf);
            }
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return facts;
}

function walkTemplate(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const c of node) walkTemplate(c, out); return; }
  if (node.type === 'Component' || node.type === 'RegularElement' || node.type === 'InlineComponent') {
    const tag = node.name;
    if (['FormField','Checkbox','Button','ComboSelect','AsyncValidatedInput','TextInput','PasswordInput','DeleteDialog','EntityListTable','EntityTablePage','EntityFormPage','RemotePageMount'].includes(tag)) {
      const attrs = {};
      for (const a of node.attributes ?? []) {
        if (a.type === 'Attribute') {
          const v = a.value;
          attrs[a.name] = Array.isArray(v) ? (v[0]?.data ?? v[0]?.expression?.name ?? v[0]?.expression?.value ?? true) : (v?.name ?? true);
        } else if (a.type === 'BindDirective') attrs['bind:'+a.name] = a.expression?.name;
      }
      out.widgets.push({ tag, attrs });
    }
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === 'object') walkTemplate(v, out);
  }
}

function extractTemplateFacts(ast, raw) {
  const out = { widgets: [], i18nKeys: [] };
  // cheap regex pass for $t('...') keys — reliable and readable
  for (const m of raw.matchAll(/\$t\('([^']+)'/g)) out.i18nKeys.push(m[1]);
  const root = ast.fragment ?? ast.html;
  walkTemplate(root, out);
  return out;
}

// ── run ────────────────────────────────────────────────────────────────
function walkPages(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkPages(p));
    else if (e.name === '+page.svelte') out.push(p);
  }
  return out;
}
const files = process.argv.slice(2);
if (!files.length) files.push(...walkPages(ROUTES));
const pages = {};
for (const file of files) {
  const raw = readFileSync(file, 'utf-8');
  const rel = file.replace(/\\/g,'/').split('/routes/(app)/')[1].replace(/\/?\+page\.svelte$/, '');
  const route = ('/' + rel).replace(/\[(\w+)\]/g, '{$1}');
  const ast = svelte.parse(raw, { modern: true });
  const scriptText = ast.instance ? raw.slice(ast.instance.content.start, ast.instance.content.end) : '';
  const sfacts = extractScriptFacts(scriptText);
  const tfacts = extractTemplateFacts(ast, raw);
  // customActionHandlers lives in template markup: {{ change_password: fn, ... }}
  for (const m of raw.matchAll(/customActionHandlers=\{\{([\s\S]*?)\}\}/g))
    for (const k of m[1].matchAll(/^\s*(\w+)\s*:/gm)) sfacts.customActions.push(k[1]);
  // link-style CTAs: <Button href="/route"> / <a href="/route"> are
  // navigations too (extractor only saw goto/window.open before)
  for (const w of tfacts.widgets)
    if (typeof w.attrs.href === 'string' && w.attrs.href.startsWith('/'))
      sfacts.navigations.push({ kind: 'same-tab', target: w.attrs.href });
  // dedupe navigations
  const seen = new Set();
  sfacts.navigations = sfacts.navigations.filter(n => seen.has(n.target) ? false : (seen.add(n.target), true));
  // $state-derived fields are kept only if bound in the template
  // (id / bind:value / bind:checked / data-testid referencing the name)
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const boundIds = new Set();
  for (const w of tfacts.widgets)
    for (const [k, v] of Object.entries(w.attrs))
      if (/^(id|bind:value|bind:checked|name|data-testid)$/.test(k)) {
        boundIds.add(norm(v));
        for (const piece of String(v).split(/[^a-zA-Z0-9_]/)) if (piece.length > 2) boundIds.add(norm(piece));
      }
  // when a zod schema exists it is the source of truth — drop $state guesses;
  // otherwise keep only names referenced in the markup
  const hasZod = Object.values(sfacts.fields).some(f => !f.fromState);
  const markup = raw.slice(ast.instance ? ast.instance.content.end : 0);
  for (const [fname, f] of Object.entries(sfacts.fields)) {
    if (!f.fromState) continue;
    // entity-holder / generic state names are never form fields
    const STOP = new Set(['role','user','org','item','entity','record','data','form','formdata','state','value','loading','saving','deleting','error','message','result','response','open','mode']);
    if (STOP.has(norm(fname))) { delete sfacts.fields[fname]; continue; }
    const bound = boundIds.has(norm(fname)) ||
      [...boundIds].some(b => b.endsWith(norm(fname)) || (norm(fname).length > 3 && norm(fname).endsWith(b)));
    const boundInMarkup = new RegExp(`bind:(value|checked)=\\{?${fname}\\b`).test(markup)
      || new RegExp(`\\b${fname}\\.(has|add|delete|size|toggle|values)\\b`).test(markup)
      || new RegExp(`\\bid=['"]${fname}['"]`).test(markup);
    if (hasZod || !(bound || boundInMarkup)) delete sfacts.fields[fname];
  }
  // ── shell-page contract — EntityTablePage/EntityFormPage declare their
  // entity via `entity` or `basePath` props, never via apiFetch calls.
  // `basePath` accepts a literal ('/api/v1/entities/<e>') or an
  // entityApiBase('<e>') expression — both resolve to the entity name
  // (mirroring the component's own $derived: entity ?? last basePath segment).
  const shell = tfacts.widgets.find(w => w.tag === 'EntityTablePage' || w.tag === 'EntityFormPage');
  if (shell) {
    const bp = shell.attrs.basePath;
    let entity = shell.attrs.entity;
    if (!entity && typeof bp === 'string') {
      const m = bp.match(/entities\/(\w+)/) ?? bp.match(/^\/([\w-]+)$/);
      if (m) entity = m[1];
    }
    if (!entity) {
      const m = raw.match(/entityApiBase\(['"](\w+)['"]\)/);
      if (m) entity = m[1];
    }
    sfacts.entityDecl = { component: shell.tag, entity, basePath: typeof bp === 'string' ? bp : undefined,
      createAction: 'onCreateAction' in shell.attrs || 'createPath' in shell.attrs,
      editAction: 'onEditAction' in shell.attrs || 'editPath' in shell.attrs,
      navStrategy: typeof shell.attrs.navStrategy === 'string' ? shell.attrs.navStrategy : undefined };
  }
  // remote-mounted pages (RemotePageMount) — the component is an ESM blob
  // served by the owning microservice; FE extraction sees only the mount.
  if (tfacts.widgets.some(w => w.tag === 'RemotePageMount')) sfacts.remoteMount = true;
  pages[route] = { route, ...sfacts, widgets: tfacts.widgets, i18nKeys: [...new Set(tfacts.i18nKeys)] };
}
process.stdout.write(JSON.stringify(pages, null, 1) + "\n");
