// render-page-docs.mjs v3 — pages.json + system.translations → MDX.
// Deterministic prose: facts from AST, labels/tooltips from i18n tables,
// domain notes from field/endpoint/composable signals.
// docs-render.ts — pages.json + system.translations → MDX user-manual pages.
// Usage: bun scripts/docs-render.ts <pages.json> <out_dir>
// Env:   DATABASE_URL (required), BE_DIR (default: ../../../primebrick-be-v3)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from "node:module";
import { logger } from "@primebrick/sdk";

const WORKSPACE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const BE = process.env.BE_DIR ?? join(WORKSPACE, 'primebrick-be-v3');
const req = createRequire(join(BE, 'package.json'));
const { Client } = req('pg');

const OUT_DIR = process.argv[3]; // if set, write files instead of stdout
const pages = JSON.parse(readFileSync(process.argv[2] ?? './pages.json', 'utf8'));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const pg = new Client({ connectionString: DATABASE_URL });
await pg.connect();
const tr = {};
for (const s of ['system', 'public', 'custom']) {
  try {
    const r = await pg.query(`SELECT key, value FROM ${s}.translations WHERE language='en-GB'`);
    for (const row of r.rows) tr[row.key] ??= row.value;
  } catch {}
}
await pg.end();
const T = (key) => tr[key];

const humanize = (s) => s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');

// identity provider display name — config-driven (casdoor today, but the
// platform is IdP-agnostic); used for "backed by" prose on idp_* entities
let IDP_NAME;
const pg2 = new Client({ connectionString: DATABASE_URL });
try {
  await pg2.connect();
  const { rows: [idp] } = await pg2.query(`SELECT value FROM public.config_entries WHERE key='idp_type' LIMIT 1`);
  IDP_NAME = idp?.value ? humanize(idp.value).replace(/\b\w/g, c => c.toUpperCase()) : undefined;
} catch {} finally {
  await pg2.end().catch(() => {});
}
// indefinite article — 'a' before consonant sounds ('a user', 'a unit')
const art = (w) => (/^(u[sn]|eu|uni|use|user|one)/i.test(w) ? 'a' : (/^[aeiou]/i.test(w) ? 'an' : 'a'));
const titleOf = (r) => humanize(r.split('/').filter(Boolean).pop() ?? r).replace(/\b\w/g, c => c.toUpperCase());
const stripIdp = (s) => s.replace(/^idp/i, '');

// docs layout: generated page-manuals live under generated/ (the pipeline
// owns them); hand-written docs live in manual/ or at user-guide root.
// entities-crud lives in the dev-guide (developer-tier) — generated pages
// still cross-link to it.
const HANDWRITTEN_SLUGS = new Set(['entities-crud']);
const linkFor = (slug) =>
  HANDWRITTEN_SLUGS.has(slug) ? `/docs/dev-guide/${slug}` : `/docs/user-guide/generated/${slug}`;

function bestKey(name, keys, suffixRe) {
  const norm = name.toLowerCase().replace(/_/g, '');
  const cands = keys.filter(k => !suffixRe.test(k)).filter(k => {
    const last = stripIdp(k.split('.').pop().toLowerCase());
    return last === norm || last === norm.replace(/^idp/, '') || norm === last.replace(/^idp/, '');
  });
  return cands[0];
}
const fieldLabel = (name, keys) => {
  const k = bestKey(name, keys, /placeholder|tooltip/i);
  return k ? (T(k) ?? humanize(k.split('.').pop()))
           : humanize(name).replace(/^idp /i, '');
};
const fieldTooltip = (name, keys) => {
  const norm = name.toLowerCase().replace(/_/g, '');
  const tip = keys.find(k => /tooltip$/i.test(k) && norm.includes(stripIdp(k.split('.').pop().toLowerCase().replace(/tooltip$/, ''))));
  return tip ? T(tip) : undefined;
};

// ── entity meta loading (BE *.meta.ts — pure literal objects) ─────────
import { readdirSync } from "node:fs";
const tsc = createRequire(join(BE, 'package.json'))('typescript');
const META_DIR = join(BE, 'src/modules');
function findMetaFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...findMetaFiles(p));
    else if (e.name.endsWith('.meta.ts')) out.push(p);
  }
  return out;
}
const metaByEntity = {};
// meta files may split data into sibling files (e.g. columns imported from
// ./list-config.ts) — resolve relative imports recursively instead of a stub
const loadTsModule = (file, seen = new Set()) => {
  if (seen.has(file)) return {};
  seen.add(file);
  const src = readFileSync(file, 'utf8');
  const js = tsc.transpileModule(src, { compilerOptions: { module: 'CommonJS' } }).outputText;
  const m = { exports: {} };
  const localRequire = (spec) => {
    if (!spec.startsWith('.')) return {};
    const base = resolve(dirname(file), spec).replace(/\.js$/, '.ts');
    try { return loadTsModule(base, seen); } catch { return {}; }
  };
  new Function('exports', 'require', 'module', js)(m.exports, localRequire, m);
  return m.exports;
};
for (const f of findMetaFiles(META_DIR)) {
  try {
    const m = { exports: loadTsModule(f) };
    const meta = Object.values(m.exports).find(v => v && v.entity);
    if (meta?.entity) metaByEntity[meta.entity] = meta;
  } catch {}
}

// canonical op vocabulary — mirrors be-v3/src/http/entity-actions.ts STANDARD_OPS
const STANDARD_OPS = [
  'list', 'meta', 'get', 'create.single', 'update.single', 'delete.single',
  'purge.single', 'restore.single', 'read.audit', 'export',
  'delete.bulk', 'restore.bulk', 'duplicate.bulk',
];
const OP_SCOPE = { list: 'page', meta: 'page', export: 'bulk' };
const opScope = (op) => OP_SCOPE[op] ?? (op.endsWith('.bulk') ? 'bulk' : 'row');
// config-permissions key -> standard op
const CFG_TO_OP = { list: 'list', meta: 'meta', get: 'get', create: 'create.single', update: 'update.single',
  delete: 'delete.single', purge: 'purge.single', restore: 'restore.single', audit: 'read.audit',
  export: 'export', bulkDelete: 'delete.bulk', bulkRestore: 'restore.bulk', duplicate: 'duplicate.bulk' };

// ── Permission enum resolution (sdk permissions.d.ts: NAME: "value") ────
const permValues = {};
try {
  const dts = readFileSync(join(BE, 'node_modules/@primebrick/sdk/dist/auth/permissions.d.ts'), 'utf8');
  for (const m of dts.matchAll(/readonly\s+(\w+)\s*:\s*"([^"]+)"/g)) permValues[m[1]] = m[2];
} catch {}

// ── makeEntityRouter configs → per-entity capability map ───────────────
const ROUTER_DIR = join(BE, 'src/controllers/http');
function findRouterFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...findRouterFiles(p));
    else if (e.name.endsWith('.router.ts')) out.push(p);
  }
  return out;
}
const capsByEntity = {};
const extraRoutes = []; // {file, method, path, perms[], stepUp}
for (const f of findRouterFiles(ROUTER_DIR)) {
  const src = readFileSync(f, 'utf8');
  // registerRoutes(router, [ {method, path, permission, middlewares?}, ... ])
  for (const rm of src.matchAll(/\{\s*method:\s*"(\w+)",\s*path:\s*"([^"]+)",([\s\S]*?)\}/g)) {
    const perms = [...rm[3].matchAll(/Permission\.(\w+)/g)].map(x => permValues[x[1]] ?? x[1]);
    extraRoutes.push({ method: rm[1].toUpperCase(), path: rm[2], perms, stepUp: /requireMfaStepUp/.test(rm[3]) });
  }
  for (const m of src.matchAll(/entityName:\s*"(\w+)"/g)) {
    const entity = m[1];
    const caps = capsByEntity[entity] ??= { perms: {}, extraScans: [], duplicate: undefined, stepUp: {} };
    const permsM = src.slice(m.index).match(/permissions:\s*\{([\s\S]*?)\}/);
    if (permsM)
      for (const pm of permsM[1].matchAll(/(\w+):\s*\[([^\]]*)\]/g))
        caps.perms[pm[1]] = [...pm[2].matchAll(/Permission\.(\w+)/g)].map(x => permValues[x[1]] ?? x[1]);
    const dupM = src.slice(m.index).match(/duplicate:\s*(true|false)/);
    if (dupM) caps.duplicate = dupM[1] === 'true';
    // actionMiddlewares: { <op>: [... requireMfaStepUp ...] }
    const amM = src.slice(m.index).match(/actionMiddlewares:\s*\{([\s\S]*?)\}/);
    if (amM)
      for (const am of amM[1].matchAll(/(\w+):\s*\[([^\]]*)\]/g))
        caps.stepUp[am[1]] = /requireMfaStepUp/.test(am[2]);
    for (const sm of src.slice(m.index).matchAll(/prefix:\s*"([^"]+)"/g)) caps.extraScans.push(sm[1]);
  }
}
// map an extra-scanned route to a standard op / custom action name
const routeOp = (r) => {
  const p = r.path;
  if (/\/purge\b/.test(p)) return 'purge.single';
  if (/\/restore\b/.test(p)) return 'restore.single';
  if (/\/audit\b/.test(p)) return 'read.audit';
  if (/\/export\b/.test(p)) return 'export';
  if (/\/bulk-delete\b/.test(p)) return 'delete.bulk';
  if (/\/bulk-restore\b/.test(p)) return 'restore.bulk';
  if (/\/duplicate\b/.test(p)) return 'duplicate.bulk';
  const last = p.split('/').pop();
  if (r.method === 'POST' && last !== ':uuid' && !/^:/.test(last)) return `custom:${last}`; // e.g. change-password
  if (r.method === 'POST') return 'create.single';
  if (r.method === 'PUT' || r.method === 'PATCH') return 'update.single';
  if (r.method === 'DELETE') return 'delete.single';
  return null;
};
const scanRoutes = (caps, capsPrefixEntity) =>
  (caps?.extraScans ?? []).flatMap(pre => extraRoutes.filter(r => r.path.startsWith(pre)));

// singular/plural entity names for composed sentences
const SINGULAR = { users: 'user', organizations: 'organization', roles: 'role' };
const entPlural = (e) => humanize(e) + (humanize(e).endsWith('s') ? '' : 's');
const entSingular = (e, routeLeaf) =>
  SINGULAR[routeLeaf] ?? humanize(e ?? routeLeaf).replace(/s$/, '');
// ACTION_DESC removed: labels come from i18n translations only

// domain notes derived from page signals — the "semantic glue" templates
function fieldNotes(name, f, pg, isCreate) {
  const notes = [];
  const paths = pg.endpoints.map(e => e.path);
  switch (name) {
    case 'idpUsername': case 'username':
      if (paths.some(p => p.includes('check-username')))
        notes.push('checked for availability in the selected organization while you type');
      break;
    case 'password':
      if (pg.composables.includes('usePasswordPolicy'))
        notes.push('validated against the active password policy (live checklist)');
      if (pg.fields.send_invitation)
        notes.push('required unless *Send invitation* is enabled');
      break;
    case 'idp_org': case 'organization':
      if (paths.some(p => p.includes('/organizations/active')))
        notes.push('only organizations backed by a real identity-provider organization are listed');
      break;
    case 'roles':
      if (f.constraints.some(c => /^min\(1\)/.test(c)))
        notes.push('at least one role is required');
      if (pg.composables.includes('useActiveRoles'))
        notes.push('administrator roles show a System Administrator badge');
      break;
    case 'avatar_color':
      notes.push('shown when no avatar image is set');
      break;
    case 'email':
      if (pg.fields.send_invitation) notes.push('also used for the invitation email');
      break;
  }
  return [...new Set(notes)].join('; ');
}

function constraintText(c) {
  const parts = [];
  for (const x of c) {
    const m = x.match(/^(\w+)\(([^)]*)/); if (!m) continue;
    const [, fn, arg] = m;
    if (fn === 'min') parts.push(`min ${arg.match(/\d+/)?.[0]}`);
    else if (fn === 'max') parts.push(`max ${arg.match(/\d+/)?.[0]}`);
    else if (fn === 'email') parts.push('must be a valid email');
    else if (fn === 'url') parts.push('must be a valid URL');
    else if (fn === 'regex') parts.push(arg.includes('0-9A-Fa-f') ? 'hex color' : 'custom format');
  }
  return parts.join('; ');
}
// same constraints rendered as a prose clause for the field digest:
// "allows up to 320 characters and must be a valid email"
function constraintClause(c, wt) {
  const parts = [];
  const pick = /select|checkbox|button/i.test(wt ?? '');
  for (const x of c) {
    const m = x.match(/^(\w+)\(([^)]*)/); if (!m) continue;
    const [, fn, arg] = m;
    const n = arg.match(/\d+/)?.[0];
    if (fn === 'min') parts.push(pick
      ? `requires at least ${n} ${n === '1' ? 'selection' : 'selections'}`
      : `requires at least ${n} ${n === '1' ? 'character' : 'characters'}`);
    else if (fn === 'max') parts.push(`allows up to ${n} characters`);
    else if (fn === 'email') parts.push('must be a valid email');
    else if (fn === 'url') parts.push('must be a valid URL');
    else if (fn === 'regex') parts.push(arg.includes('0-9A-Fa-f') ? 'must be a hex color' : 'must match a custom format');
  }
  return parts.join(' and ');
}
const widgetType = (pg, field) => {
  const map = { TextInput: 'text input', ComboSelect: 'select', AsyncValidatedInput: 'validated input', Checkbox: 'checkbox', PasswordInput: 'password input', Select: 'select' };
  const pretty = (t) => map[t] ?? (t?.includes('Password') ? 'password input' : t?.replace(/([A-Z])/g, ' $1').toLowerCase().trim());
  // direct binding match first (id= / bind:value= / bind:checked=)
  const direct = pg.widgets.find(w =>
    w.attrs.id === field || w.attrs['bind:value'] === field || w.attrs['bind:checked'] === field);
  if (direct) return pretty(direct.tag);
  const i = pg.widgets.findIndex(w => w.tag === 'FormField' && w.attrs.name === field);
  const next = pg.widgets.slice(i + 1).find(w => !['FormField'].includes(w.tag));
  return pretty(next?.tag);
};
// link a field to its manual page when a related entity exists
const RELATED = { idp_org: 'organizations', organization: 'organizations', roles: 'roles', selected_permissions: 'roles', permissions: 'roles' };

// sibling pages of the same entity, with their purpose lines
const siblingsOf = (leaf) => Object.keys(pages)
  .filter(r => r.split('/').slice(0, -1).join('/') === leaf.split('/').slice(0, -1).join('') ||
               r.startsWith(leaf + '/') || leaf.startsWith(r + '/'));
const sibPages = (parentList) => Object.keys(pages)
  .filter(r => r === parentList || r.startsWith(parentList + '/'));

const kindOf = (route) => /\/(create|new)$/.test(route) ? 'create'
                        : /\{[^}]+\}$/.test(route) ? 'edit' : 'list';

// ── cross-entity field links: every form field that relates to another
// entity's pages (via RELATED). Used to emit deterministic cross-entity
// procedures — e.g. user.roles → role_mapping.is_admin ⇒ "how to make a
// user an application administrator".
const FIELD_LINKS = [];
for (const [r, p] of Object.entries(pages)) {
  for (const fname of Object.keys(p.fields)) {
    const relSlug = RELATED[fname];
    if (!relSlug) continue;
    const relListRoute = Object.keys(pages).find(x => x === `/${relSlug}` || x.endsWith(`/${relSlug}`));
    const relPg = relListRoute && pages[relListRoute];
    const relEntity = relPg?.endpoints.find(e => e.path.includes('/entities/'))?.path.match(/entities\/(\w+)/)?.[1];
    FIELD_LINKS.push({ fromRoute: r, fname, relSlug, relListRoute, relEntity });
  }
}
// a boolean/badge column on the related entity whose key/label says "admin"
// ⇒ the flag that makes the related record an administrator record
const adminFlagOf = (relEntity) =>
  metaByEntity[relEntity]?.columns?.find(c =>
    ['boolean', 'badge'].includes(c.type) && /admin/i.test(`${c.key} ${T(c.label_key) ?? ''}`));

for (const [route, pg] of Object.entries(pages)) {
  // $state-derived fields are real form state on create/edit pages but
  // UI-state noise on list-kind pages (selectedX, editingY, isCreating…)
  const kindNow = /\/create$/.test(route) ? 'create' : /\{[^}]+\}$/.test(route) ? 'edit' : 'list';
  const fields = Object.entries(pg.fields).filter(([, f]) => !f.fromState || kindNow !== 'list');
  const hasListEarly = pg.widgets.some(w => w.tag === 'EntityListTable');
  const noFacts = !fields.length && !pg.endpoints.length && !pg.navigations.length && !hasListEarly;
  // a list-kind page with no entity table, no form fields and no links is a
  // custom/toolbar page — bare endpoints alone don't make it documentable
  const thinCustom = kindNow === 'list' && !hasListEarly && !fields.length && !pg.navigations.length;
  if (noFacts || thinCustom) {
    logger.debug(`skip ${route} (${noFacts ? "no extractable facts" : "custom page, no entity surface"})`, { tags: ["docs-render"] });
    continue;
  }
  const out = [];
  const parentList = route.replace(/\/(create|\{uuid\}|\{[^}]+\})$/, '');
  const entity = pg.endpoints.find(e => e.path.includes('/entities/'))?.path.match(/entities\/(\w+)/)?.[1]
              ?? pg.endpoints.find(e => e.method === 'POST')?.path.match(/auth\/(\w+)/)?.[1];
  const meta = (entity && metaByEntity[entity])
    ?? Object.values(metaByEntity).find(m => m.translation_key?.startsWith(entSingular(undefined, parentList.split('/').pop())));
  const isCreate = /\/create$/.test(route);
  const hasList = pg.widgets.some(w => w.tag === 'EntityListTable');
  const post = pg.endpoints.find(e => e.method === 'POST' && !/restore/.test(e.path));
  const patch = pg.endpoints.find(e => ['PUT', 'PATCH', 'UPDATE'].includes(e.method));

  const isEdit = /\{[^}]+\}$/.test(route);
  const routeLeaf = parentList.split('/').pop();
  const singular = entSingular(entity, routeLeaf);
  const plural = entity ? entPlural(entity) : titleOf(parentList).toLowerCase();
  // page title: real translations first, composed template as fallback
  const tkey = meta?.translation_key ?? entity;
  const leaf = parentList.split('/').pop();
  const pick = (...keys) => keys.map(k => T(k)).find(Boolean);
  const entPluralT = pick(`system.entities.${tkey}.plural`, `system.entities.${tkey}.title`) ?? plural;
  const entSingularT = pick(`system.entities.${tkey}.singular`) ?? singular;
  // canonical page titles: system.entities.page_title.{list,create,edit} are
  // interpolable templates (same mechanism as FE interpolateTemplate)
  const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;
  const interp = (tpl) => tpl
    .replaceAll('{entity_plural}', cap(entPluralT))
    .replaceAll('{entity_singular}', cap(entSingularT));
  const pageTitleTpl = (kind) => T(`system.entities.page_title.${kind}`) ??
    (kind === 'list' ? `{entity_plural} List` : kind === 'create' ? `Create {entity_singular}` : `Edit {entity_singular}`);
  const kind = isCreate ? 'create' : isEdit ? 'edit' : 'list';
  const pageName = interp(pageTitleTpl(kind));
  const purpose = isCreate
      ? pick(`system.settings.${leaf}.createSubtitle`, `system.settings.${leaf}.create.subtitle`, `system.entities.${tkey}.create.description`) ?? `Create a new ${entSingularT.toLowerCase()}.`
    : isEdit
      ? pick(`system.settings.${leaf}.editSubtitle`, `system.settings.${leaf}.update.subtitle`, `system.entities.${tkey}.update.description`) ?? `View and edit an existing ${entSingularT.toLowerCase()}.`
      : pick(`system.settings.${leaf}.subtitle`, `system.entities.${tkey}.list.description`) ?? `List, search and manage all ${entPluralT.toLowerCase()}.`;
  out.push('---');
  out.push(`title: ${pageName}`);
  out.push(`description: ${purpose}`);
  // Canonical entity identity comes from the BE meta — endpoint-derived
  // names are inconsistent ("/auth/users" POST gives "users", the entity
  // router gives "user_profile"); the census routes carry the same values.
  const docEntity = meta?.entity ?? entity;
  if (docEntity) out.push(`entity: ${docEntity}`);
  out.push('---\n');
  out.push(`${purpose}\n`);

  // discursive intro on list pages: what a row shows + status flags +
  // whether the entity is backed by the identity provider — all derived
  // from meta columns (default_visible / type:boolean / idp_*), no new input
  if (hasList && meta?.columns?.length) {
    const joinAnd = (xs) => xs.length > 1 ? xs.slice(0, -1).join(', ') + ', and ' + xs.at(-1) : (xs[0] ?? '');
    const visCols = meta.columns.filter(c => c.default_visible && c.type !== 'boolean');
    const flagCols = meta.columns.filter(c => c.default_visible && c.type === 'boolean');
    const named = visCols.map(c => `the ${T(c.label_key) ?? humanize(c.key)}`);
    const flags = flagCols.map(c => T(c.label_key) ?? humanize(c.key));
    if (named.length || flags.length)
      out.push(
        `Each row shows ${named.join(', ')}` +
        (flags.length ? `, plus the status flags ${joinAnd(flags)}` : '') + '.\n'
      );
    if (meta.columns.some(c => /^idp_/.test(c.key)))
      out.push(
        `This ${entSingularT.toLowerCase()} is backed by ` +
        `the identity provider${IDP_NAME ? ` (${IDP_NAME})` : ''} — its identity fields are managed there.\n`
      );
  }

  // ── Pages Routes (sibling pages of this entity) ──
  const sibs = sibPages(parentList);
  if (sibs.length > 1) {
    out.push('## Pages routes\n');
    for (const r of sibs) {
      const k = kindOf(r);
      const d = k === 'create' ? `Create a new ${singular}.`
              : k === 'edit' ? `View and edit an existing ${singular}.`
              : `List, search and manage all ${entPluralT.toLowerCase()}.`;
      out.push(`- \`${r}\` — ${d}${r === route ? ' *(this page)*' : ''}`);
    }
    out.push('');
  }

  // canonical position for "## What you can do here": right after Pages
  // routes on EVERY page kind — list pages splice their section in later
  // (their procedures need the action census computed below)
  const wydAt = out.length;

  // ── shared procedure helpers — steps describe real UI actions (toolbar
  // button, row actions menu, form fields, Save), not routes/tab mechanics
  const capEntity2 = entity ?? meta?.entity;
  const s3 = entSingularT.toLowerCase();
  const newBtn = T('system.entities.list.new') ?? 'New';
  const reqOf = (p) => Object.entries(p?.fields ?? {}).filter(([, f]) => f.required)
    .map(([n]) => `**${fieldLabel(n, p.i18nKeys ?? [])}**`);
  const endpointOf = (p, re) => p?.endpoints?.find(e => re.test(e.method));
  const grantProc = (l, flag, srcRoute) => {
    const flagLabel = T(flag.label_key) ?? humanize(flag.key);
    const fLabel = fieldLabel(l.fname, pages[srcRoute]?.i18nKeys ?? []);
    const relSing = titleOf(l.relSlug).replace(/s$/, '');
    const badge = pages[srcRoute]?.composables?.includes('useActiveRoles')
      ? '; administrator roles are marked with a **System Administrator** badge' : '';
    return {
      head: `### How to grant ${flagLabel.toLowerCase()} rights to ${art(s3)} ${s3}`,
      roleStep: `In **${fLabel}**, select a ${relSing.toLowerCase()} whose **${flagLabel}** flag is enabled${badge} — the flag is configured on the ${relSing.toLowerCase()} via **Edit ${relSing}**.`,
      saveStep: `Click **Save** — the ${s3} now has the permissions granted by the assigned ${titleOf(l.relSlug).toLowerCase()}.`,
    };
  };
  const pushGrant = (srcRoute, firstStep) => {
    for (const l of FIELD_LINKS.filter(x => x.fromRoute === srcRoute && x.relEntity !== capEntity2)) {
      const flag = adminFlagOf(l.relEntity);
      if (!flag) continue;
      const g = grantProc(l, flag, srcRoute);
      out.push(g.head);
      let n = 1;
      if (firstStep) out.push(`${n++}. ${firstStep}`);
      out.push(`${n++}. ${g.roleStep}`, `${n}. ${g.saveStep}`, '');
    }
  };

  // ── "What you can do here" on form pages: the page's own procedures
  if (isCreate && fields.length) {
    const reqs = reqOf(pg);
    out.push('## What you can do here\n');
    out.push(`### How to create a new ${s3}`);
    out.push(`1. On the **${titleOf(parentList)}** list page, click **${newBtn}** in the toolbar.`);
    out.push(`2. Fill in the fields below${reqs.length ? ` — required: ${reqs.join(', ')}` : ''}.`);
    out.push(`3. Click **Save** — the new ${s3} is created.`);
    out.push('');
    pushGrant(route, null);
  }

  if (isEdit) {
    const reqs = reqOf(pg);
    out.push('## What you can do here\n');
    out.push(`### How to edit ${art(s3)} ${s3}`);
    out.push(`1. On the **${titleOf(parentList)}** list page, open the row actions menu on the ${s3} you want to edit and click **Edit**.`);
    out.push(`2. Update the fields below${reqs.length ? ` — required: ${reqs.join(', ')}` : ''}.`);
    out.push(`3. Click **Save** — the changes to the ${s3} are saved.`);
    out.push('');
    pushGrant(route, null);
    // back-reference: an admin flag on THIS entity is assigned through a
    // field on another entity's form → say where it gets used
    for (const [fname] of fields.filter(([n]) => /admin/i.test(n))) {
      const seen = new Set();
      for (const b of FIELD_LINKS.filter(x => x.relEntity === capEntity2)) {
        const bLeaf = b.fromRoute.replace(/\/(create|\{[^}]+\})$/, '').split('/').pop();
        if (bLeaf === leaf || seen.has(bLeaf)) continue;
        seen.add(bLeaf);
        const bSing = titleOf(bLeaf).replace(/s$/, '');
        const bFieldLabel = fieldLabel(b.fname, pages[b.fromRoute]?.i18nKeys ?? []);
        const ownLabel = fieldLabel(fname, pg.i18nKeys);
        out.push(`- The **${ownLabel}** flag on this ${s3} marks it as an administrator ${s3} — assign the ${s3} to ${art(bSing)} ${bSing.toLowerCase()} via **Edit ${bSing}** → **${bFieldLabel}**.`);
      }
    }
    out.push('');
  }

  // ── columns table for list pages (from entity meta) ──
  if (hasList && meta?.columns?.length) {
    const visible = meta.columns.filter(c => !c.audited);
    out.push('## Columns\n');
    out.push('| Column | Visible | Sortable | Filterable | Notes |');
    out.push('|--------|---------|----------|------------|-------|');
    // Identity-provider link fields have no tooltip translation — they carry
    // the same semantic on every entity (profile↔IDP correlation), so the
    // note is emitted here instead of being left blank.
    const inIdp = IDP_NAME ? `in ${IDP_NAME}` : 'in the identity provider';
    const IDP_FIELD_NOTES = {
      idp_code: `the record's identifier code ${inIdp} — the link between this row and the IDP record`,
      idp_org: `the ${IDP_NAME ?? 'identity-provider'} organization this row belongs to`,
      idp_username: `the login name ${inIdp}`,
      issuer: `the identity-provider issuer that owns this identity`,
    };
    const colRows = visible.map(c => {
      const label = T(c.label_key) ?? humanize(c.key);
      const tip = (c.tooltip ? (T(c.tooltip) ?? '') : '') || (IDP_FIELD_NOTES[c.key] ?? '');
      return { c, label, tip };
    });
    for (const { c, label, tip } of colRows)
      out.push(`| **${label}** | ${c.default_visible ? 'yes' : 'no'} | ${c.sortable ? 'yes' : 'no'} | ${c.filterable ? 'yes' : 'no'} | ${tip} |`);
    out.push('');
    // semantic digest: restate each row as a sentence so embeddings keep
    // the column↔flag association that the table layout loses
    for (const { c, label, tip } of colRows) {
      const flags = c.sortable && c.filterable ? 'can be sorted and filtered'
        : c.sortable ? 'can be sorted but not filtered'
        : c.filterable ? 'can be filtered but not sorted'
        : 'cannot be sorted or filtered';
      out.push(`- The ${label} column is ${c.default_visible ? 'shown' : 'hidden'} by default and ${flags}${tip ? ` — ${tip.replace(/\.$/, '').replace(/^./, x => x.toLowerCase())}` : ''}.`);
    }
    out.push('');
  }

  // ── fields table for form pages ──
  const fieldRows = [];
  if (fields.length && !hasList) {
    out.push('## Fields\n');
    out.push('| Field | Required | Notes |');
    out.push('|-------|----------|-------|');
    for (const [name, f] of fields) {
      const snake = name.replace(/([A-Z])/g, m => '_' + m.toLowerCase());
      const col = meta?.columns?.find(c => c.key === snake || c.key === name || snake.endsWith(c.key));
      const metaTooltip = col?.tooltip ? T(col.tooltip) : undefined;
      const metaLabel = col?.label_key ? T(col.label_key) : undefined;
      const f2 = { ...f, tooltip: fieldTooltip(name, pg.i18nKeys) ?? metaTooltip };
      const notes = [f2.tooltip, fieldNotes(name, f2, pg, isCreate), constraintText(f.constraints)].filter(Boolean).join('; ');
      const wt = widgetType(pg, name);
      const cell = [wt, notes].filter(Boolean).join(' — ') || '—';
      const label = fieldLabel(name, pg.i18nKeys) !== humanize(name).replace(/^idp /i, '') ? fieldLabel(name, pg.i18nKeys) : (metaLabel ?? fieldLabel(name, pg.i18nKeys));
      out.push(`| **${label}** | ${f.required ? 'required' : 'optional'} | ${cell} |`);
      fieldRows.push({ name, f, label, wt, notes: [f2.tooltip, fieldNotes(name, f2, pg, isCreate)].filter(Boolean).join('; ').replace(/\.$/, '').replace(/^./, c => c.toLowerCase()), cons: constraintClause(f.constraints, wt) });
    }
    out.push('');
    // semantic digest: restate each field as a discursive sentence — same
    // style as the Columns digest; the chunker embeds bullets as atomic facts
    for (const { label, f, wt, notes, cons } of fieldRows) {
      const w = wt ?? 'field';
      const reqAdj = f.required ? 'required' : 'optional';
      out.push(`- The **${label}** field is ${art(reqAdj)} ${reqAdj} ${w}` +
        `${cons ? ` that ${cons}` : ''}${notes ? ` — ${notes}` : ''}.`);
    }
    out.push('');
  }

  // ── related entities — cross-entity links derived from meta columns
  // whose key maps to a related entity's manual pages (RELATED map) ──
  const knownSlugExists = (slug) =>
    Object.keys(pages).some(r => r.split('/').filter(Boolean).pop() === slug);
  {
    const rels = [];
    for (const c of meta?.columns ?? []) {
      const slug = RELATED[c.key];
      if (slug && knownSlugExists(slug)) {
        const label = T(c.label_key) ?? humanize(c.key);
        if (!rels.some(r => r.slug === slug))
          rels.push({ slug, label });
      }
    }
    for (const [fname] of fields) {
      const slug = RELATED[fname];
      if (slug && knownSlugExists(slug) && !rels.some(r => r.slug === slug))
        rels.push({ slug, label: fieldLabel(fname, pg.i18nKeys) });
    }
    if (rels.length) {
      out.push('## Related entities\n');
      for (const r of rels)
        out.push(`- A **${cap(entSingularT)}** is linked to **${titleOf(r.slug)}** through the **${r.label[0].toUpperCase() + r.label.slice(1)}** field — see [${titleOf(r.slug)}](${linkFor(r.slug)}).`);
      out.push('');
    }
  }

  // ── actions ──
  // capability machinery — hoisted out of the list-page branch so form
  // pages (create/edit) emit the same census standard: table + per-action
  // digest + permission + step-up, scoped to the ops the form offers.
  const caps = (entity ?? meta?.entity) ? capsByEntity[entity ?? meta?.entity] : undefined;
  const capEntity = entity ?? meta?.entity;
  const overrides = meta?.actions_overrides ?? {};
  const eps = pg.endpoints.map(e => `${e.method} ${e.path}`);
  const has = (re) => eps.some(e => re.test(e));
  const createNav = pg.navigations.find(n => /\/(create|new)$/.test(n.target ?? ''));
  const editNav = pg.navigations.find(n => /uuid/i.test(n.target ?? ''));
  const scanHit = (re) => caps?.extraScans?.some(p => eps.some(e => e.includes(p) && re.test(e)));
  // op registered if a config permission key exists OR an extra-scan endpoint matches
  const registered = {
    'create.single': 'create' in (caps?.perms ?? {}) || scanHit(/POST/) || has(/POST/) || !!createNav,
    'update.single': 'update' in (caps?.perms ?? {}) || scanHit(/PUT|PATCH|UPDATE/) || has(/PUT|PATCH|UPDATE/) || !!editNav,
    'delete.single': 'delete' in (caps?.perms ?? {}) || scanHit(/DELETE|REMOVE/) || has(/DELETE(?!.*purge)|REMOVE/),
    'purge.single': 'purge' in (caps?.perms ?? {}) || scanHit(/purge/) || has(/purge/),
    'restore.single': 'restore' in (caps?.perms ?? {}) || scanHit(/restore/) || has(/restore/),
    'read.audit': 'audit' in (caps?.perms ?? {}) || scanHit(/audit/) || has(/audit/),
    export: 'export' in (caps?.perms ?? {}) || has(/export/),
    'delete.bulk': 'bulkDelete' in (caps?.perms ?? {}) || has(/bulk-delete/),
    'restore.bulk': 'bulkRestore' in (caps?.perms ?? {}) || has(/bulk-restore/),
    'duplicate.bulk': caps?.duplicate === false ? false : ('duplicate' in (caps?.perms ?? {}) || has(/duplicate/)),
  };
  // permissions: config map first, then extra-scanned routers (registerRoutes),
  // then the naming convention <entity>.<op> checked against the Permission enum
  const permValueSet = new Set(Object.values(permValues));
  const cfgKey = (op) => Object.keys(CFG_TO_OP).find(k => CFG_TO_OP[k] === op);
  const scanned = scanRoutes(caps);
  const scanRoute = (op) => scanned.find(r => routeOp(r) === op);
  const permList = (op) => {
    const v = caps?.perms?.[cfgKey(op)];
    if (v?.length) return v;
    const r = scanRoute(op);
    if (r?.perms?.length) return r.perms;
    const guess = `${capEntity}.${op}`;
    return permValueSet.has(guess) ? [guess] : [];
  };
  const permsOf = (op) => { const v = permList(op); return v.length ? v.map(p => `\`${p}\``).join(' or ') : '—'; };
  const stepUpOf = (op) => {
    const v = caps?.stepUp?.[cfgKey(op)];
    if (v !== undefined) return v;
    return scanRoute(op)?.stepUp ?? false;
  };
  // EntityListTable renders and executes row/bulk ops itself from
  // meta.actions (delete/restore/audit/duplicate live in its composables,
  // not in +page.svelte) — a registered op IS offered. Only create/update
  // navigation and custom actions depend on page wiring (uiEvidence).
  const status = (op, uiEvidence) => {
      if (overrides[op]?.enabled === false) return 'DISABLED';
      if (!registered[op]) return 'DISABLED';
      return uiEvidence === false ? 'DISABLED' : 'ENABLED';
    };
  if (hasList) {
    const cta = (n) => n ? (n.kind === 'new-tab' ? 'opens in a new browser tab' : 'opens in the same tab') : null;
    const s = entSingularT.toLowerCase();
    const pl = entPluralT.toLowerCase();
    // gerund subjects for the digest (controlled vocabulary, op → subject)
    const a = art(s);
    const GERUND = {
      'create.single': `Creating a new ${s}`,
      'update.single': `Editing ${a} ${s}`,
      'delete.single': `Soft-deleting ${a} ${s}`,
      'restore.single': `Restoring a soft-deleted ${s}`,
      'purge.single': `Permanently deleting ${a} ${s}`,
      'read.audit': `Viewing the change history of ${a} ${s}`,
      'delete.bulk': `Soft-deleting the selected ${pl}`,
      'restore.bulk': `Restoring the selected ${pl}`,
      'duplicate.bulk': `Duplicating the selected ${pl}`,
      'export': `Exporting the list`,
    };
    const rows = [
      { name: 'create', op: 'create.single', scope: 'row', st: status('create.single', !!createNav),
        desc: `creates a new ${s}`, digest: `the create action opens the create form${createNav ? ` ${cta(createNav).replace(/^opens /, '')}` : ''}` },
      { name: 'update', op: 'update.single', scope: 'row', st: status('update.single', !!editNav || has(/PUT|PATCH/)),
        desc: `opens the ${s} for editing`, digest: `the row action opens the record${editNav ? ` ${cta(editNav).replace(/^opens /, '')}` : ''}` },
      { name: 'delete', op: 'delete.single', scope: 'row', st: status('delete.single'),
        desc: `marks the ${s} as deleted but keeps it so it can be restored` },
      { name: 'restore', op: 'restore.single', scope: 'row', st: status('restore.single'),
        desc: `brings a soft-deleted ${s} back` },
      { name: 'purge', op: 'purge.single', scope: 'row', st: status('purge.single'),
        desc: `removes the ${s} forever` },
      { name: 'audit history', op: 'read.audit', scope: 'row', st: status('read.audit'),
        desc: `shows the change history of the ${s}`, digest: `every ${s} keeps a full version history` },
      { name: 'delete', op: 'delete.bulk', scope: 'bulk', st: status('delete.bulk'),
        desc: `marks the selected ${pl} as deleted` },
      { name: 'restore', op: 'restore.bulk', scope: 'bulk', st: status('restore.bulk'),
        desc: `restores the selected ${pl}` },
      { name: 'duplicate', op: 'duplicate.bulk', scope: 'bulk', st: status('duplicate.bulk'),
        desc: `duplicates the selected ${pl}` },
      { name: 'export', op: 'export', scope: 'bulk', st: status('export'),
        desc: `exports the list` },
    ];
    for (const ca of meta?.table?.row_custom_actions ?? []) {
      const bound = pg.customActions.includes(ca.action_name);
      const label = ca.translation_key ? (T(ca.translation_key) ?? humanize(ca.action_name)) : humanize(ca.action_name);
      const caDesc = ca.translation_key ? (T(ca.translation_key + 'Description') ?? '') : '';
      const caRoute = scanRoutes(caps).find(r => routeOp(r) === `custom:${ca.action_name.replace(/_/g, '-')}`);
      const caOp = `custom:${ca.action_name.replace(/_/g, '-')}`;
      const caPerms = ca.required_permission ? [ca.required_permission] : (caRoute?.perms ?? []);
      rows.splice(6, 0, {
        name: label, op: caOp, scope: 'row', st: bound ? 'ENABLED' : 'DISABLED',
        perms: caPerms, stepUp: caRoute?.stepUp ?? false, desc: caDesc,
        subject: `The ${label} action`,
        extra: ca.disabled_when_deleted ? 'it is unavailable on deleted rows' : null,
      });
    }
    // deterministic digest sentence per action row
    // fold a (possibly multi-sentence) description into a mid-sentence clause
    const clause = (d) => (d ?? '').replace(/\.\s+(\w)/g, (m, c) => `; ${c.toLowerCase()}`).replace(/\.$/, '').replace(/^./, c => c.toLowerCase());
    const digestOf = (r) => {
      const subj = r.subject ?? GERUND[r.op] ?? `The ${r.name} action`;
      const perms = r.perms ?? permList(r.op);
      const stepUp = r.stepUp ?? stepUpOf(r.op);
      const permTxt = perms.length ? perms.map(p => `\`${p}\``).join(' or ') : null;
      const body = clause(r.digest ?? r.desc);
      if (r.st === 'ENABLED')
        return `- ${subj} is available on this page${body ? ` — ${body}` : ''}${r.extra ? ` — ${r.extra}` : ''}${permTxt ? ` and it requires the ${permTxt} permission` : ''}${stepUp ? ', and step-up authentication is required' : ''}.`;
      const permClause = permTxt ? `if enabled, it would require the ${permTxt} permission` : `no permission is declared for it on ${pl}`;
      return `- ${subj} is not available on this page — ${permClause}.`;
    };
    const renderTable = (scope) => {
      out.push(`| Action | Status | Permission | What it does | Require Step-Up Auth |`);
      out.push('|--------|--------|------------|--------------|----------------------|');
      for (const r of rows.filter(r => r.scope === scope))
        out.push(`| **${r.name}** | ${r.st} | ${r.perms?.length || permList(r.op).length ? (r.perms ?? permList(r.op)).map(p => `\`${p}\``).join(' or ') : '—'} | ${r.desc ? r.desc[0].toUpperCase() + r.desc.slice(1) : '—'} | ${(r.stepUp ?? stepUpOf(r.op)) ? 'yes' : 'no'} |`);
      out.push('');
      for (const r of rows.filter(r => r.scope === scope)) out.push(digestOf(r));
      out.push('');
    };
    out.push('## Actions\n');
    out.push('### Row actions\n');
    renderTable('row');
    out.push('### Bulk actions\n');
    renderTable('bulk');

    // ── "What you can do here" — deterministic procedures as How-to
    // subsections: real UI steps derivable from sibling form pages and
    // cross-entity field links, not action descriptions
    const wyd = [];
    const createRoute = sibs.find(r => kindOf(r) === 'create');
    const editRoute = sibs.find(r => kindOf(r) === 'edit');
    if (createNav && createRoute) {
      const reqs = reqOf(pages[createRoute]);
      wyd.push(`### How to create a new ${s}`);
      wyd.push(`1. Click **${newBtn}** in the toolbar.`);
      wyd.push(`2. Fill in the form${reqs.length ? ` — required: ${reqs.join(', ')}` : ' — required fields are marked'}.`);
      wyd.push(`3. Click **Save** — the new ${s} is created.`, '');
    }
    if (editNav && editRoute) {
      const reqs = reqOf(pages[editRoute]);
      wyd.push(`### How to edit ${art(s)} ${s}`);
      wyd.push(`1. Open the row actions menu on the ${s} and click **Edit**.`);
      wyd.push(`2. Update the fields${reqs.length ? ` — required: ${reqs.join(', ')}` : ''}.`);
      wyd.push(`3. Click **Save** — the changes to the ${s} are saved.`, '');
    }
    // one how-to per ENABLED row op beyond create/edit — delete (step-up
    // when required), restore via the deleted-records filter, audit
    // history, custom row actions. DISABLED ops get no procedure.
    for (const r of rows.filter(x => x.scope === 'row' && x.st === 'ENABLED')) {
      if (r.name === 'create' || r.name === 'update') continue;
      const stepUp = (r.stepUp ?? stepUpOf(r.op)) ? ' (step-up authentication is required)' : '';
      if (r.name === 'delete') {
        wyd.push(`### How to delete ${art(s)} ${s}`);
        wyd.push(`1. Open the row actions menu on the ${s} and click **Delete**${stepUp}.`);
        wyd.push(`2. Confirm the deletion in the dialog — the ${s} is soft-deleted and can be restored.`, '');
      } else if (r.name === 'restore') {
        wyd.push(`### How to restore a deleted ${s}`);
        wyd.push('1. Set the deleted-records filter to **Deleted only** or **All records** to show recoverable records.');
        wyd.push(`2. Open the row actions menu on the ${s} and click **Restore**${stepUp}.`);
        wyd.push(`3. Confirm in the dialog — the ${s} is active again.`, '');
      } else if (/audit/i.test(r.name)) {
        wyd.push(`### How to view the change history of ${art(s)} ${s}`);
        wyd.push(`1. Open the row actions menu on the ${s} and click **Audit history**${stepUp}.`);
        wyd.push(`2. The version history of the ${s} will appear on the right sheet panel.`, '');
      } else if (r.op?.startsWith('custom:')) {
        const an = r.op.slice(7).replace(/-/g, '_');
        const m = an.match(/^(change|set|reset)_(.+)$/);
        const head = m ? `How to ${m[1]} the ${s}'s ${humanize(m[2]).toLowerCase()}` : r.name;
        wyd.push(`### ${head}`);
        wyd.push(`1. Open the row actions menu on the ${s} and click **${r.name}**${stepUp}.`);
        if (r.desc) wyd.push(`2. ${r.desc[0].toUpperCase() + clause(r.desc).slice(1)}.`, '');
      }
    }
    // grant-admin procs: the roles selector lives on the sibling form
    // pages — dedupe across create/edit since the step is identical
    const gSeen = new Set();
    for (const src of [editRoute, createRoute].filter(Boolean)) {
      for (const l of FIELD_LINKS.filter(x => x.fromRoute === src && x.relEntity !== capEntity)) {
        const flag = adminFlagOf(l.relEntity);
        const key = `${l.relEntity}:${l.fname}`;
        if (!flag || gSeen.has(key)) continue;
        gSeen.add(key);
        const g = grantProc(l, flag, src);
        wyd.push(g.head);
        wyd.push(`1. Open the ${s} in its form (see *How to create a new ${s}* / *How to edit ${art(s)} ${s}* above).`);
        wyd.push(`2. ${g.roleStep}`, `3. ${g.saveStep}`, '');
      }
    }
    if (wyd.length)
      out.splice(wydAt, 0, '## What you can do here\n', ...wyd);
  } else {
    // Same census standard as list pages, scoped to the ops this form
    // offers: Save (create.single / update.single) + Cancel + row customs.
    const saveOp = isCreate ? 'create.single' : 'update.single';
    const ep = post ?? patch;
    const s2 = entSingularT.toLowerCase();
    const verb = isCreate ? `creates the ${s2}` : `saves changes to the ${s2}`;
    const hasSubmit = pg.widgets.find(w => /submit/i.test(w.attrs['data-testid'] ?? '') || w.attrs.type === 'submit');
    const formRows = [];
    if (hasSubmit || ep)
      formRows.push({ name: 'Save', op: saveOp, st: 'ENABLED',
        desc: `validates the form and ${verb}` });
    if (pg.i18nKeys.includes('app.common.cancel'))
      formRows.push({ name: 'Cancel', op: null, st: 'ENABLED', desc: 'discards changes and returns to the previous page' });
    for (const ca of pg.customActions)
      formRows.push({ name: humanize(ca), op: `custom:${ca.replace(/_/g, '-')}`, st: 'ENABLED', desc: 'row action' });
    if (formRows.length) {
      out.push('## Actions\n');
      out.push('| Action | Status | Permission | What it does | Require Step-Up Auth |');
      out.push('|--------|--------|------------|--------------|----------------------|');
      for (const r of formRows)
        out.push(`| **${r.name}** | ${r.st} | ${r.op ? permsOf(r.op) : '—'} | ${r.desc[0].toUpperCase() + r.desc.slice(1)} | ${r.op ? (stepUpOf(r.op) ? 'yes' : 'no') : 'no'} |`);
      out.push('');
      for (const r of formRows) {
        const permTxt = r.op && permList(r.op).length ? permList(r.op).map(p => `\`${p}\``).join(' or ') : null;
        out.push(`- The **${r.name}** action ${r.st === 'ENABLED' ? 'is available' : 'is not available'} on this page — ${r.desc}${permTxt ? ` and it requires the ${permTxt} permission` : ''}.`);
      }
      out.push('');
    }
  }


  // ── doc references ──
  // only link slugs that actually exist in this pages set — no phantom
  // refs to *-create/*-edit pages that were never generated
  const knownSlugs = new Set(Object.keys(pages).map(r => {
    const pl = r.replace(/\/(create|\{[^}]+\})$/, '');
    const lf = pl.split('/').pop();
    return /\/create$/.test(r) ? lf + '-create' : /\{[^}]+\}$/.test(r) ? lf + '-edit' : r.split('/').filter(Boolean).pop();
  }));
  const related = new Set([leaf, `${leaf}-create`, `${leaf}-edit`].filter(s => knownSlugs.has(s)));
  const self = isCreate ? leaf + '-create' : isEdit ? leaf + '-edit' : leaf;
  for (const [fname] of fields) if (RELATED[fname]) related.add(RELATED[fname]);
  for (const c of meta?.columns ?? []) if (RELATED[c.key]) related.add(RELATED[c.key]);
  related.add('entities-crud');
  related.delete(self);
  out.push('## Doc references\n');
  for (const r of related) out.push(`- [${titleOf(r)}](${linkFor(r)})`);
  out.push('');

  const slug = isCreate ? leaf + '-create'
             : isEdit ? leaf + '-edit'
             : route.split('/').filter(Boolean).pop();
  if (OUT_DIR) {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, slug + '.mdx'), out.join('\n') + '\n');
    logger.debug(`wrote ${slug}.mdx`, { tags: ["docs-render"] });
  } else {
    logger.debug(`\nFILE: manual/${slug}.mdx\n${out.join('\n')}`, { tags: ["docs-render"] });
  }
}
