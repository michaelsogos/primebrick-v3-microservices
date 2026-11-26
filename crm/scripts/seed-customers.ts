// crm customers seed — moved from primebrick-be-v3 (customer ownership moved
// here: the demo dataset belongs to the module that owns `crm.customers`).
// Requirements: DATABASE_URL in .env (dotenv); the
// `crm.customers` table must already exist (run `pnpm db:migrate` first).
import "dotenv/config";
import { Pool } from "pg";

import { assertDbEnv } from "@primebrick/sdk";

import { initDal, getDal } from "../src/db/dal.js";
import { CustomerEntity } from "../src/domain/entities/customer_entity.js";
import { CustomerAccountEntity } from "../src/domain/entities/customer_account_entity.js";
import { CustomerContactEntity } from "../src/domain/entities/customer_contact_entity.js";

const { url } = assertDbEnv();

const firstNames = [
  "Mario",
  "Giulia",
  "Luca",
  "Sara",
  "Marco",
  "Francesca",
  "Paolo",
  "Elena",
  "Andrea",
  "Chiara",
  "Matteo",
  "Valentina",
  "Davide",
  "Martina",
  "Stefano",
  "Laura",
];
const lastNames = [
  "Rossi",
  "Bianchi",
  "Ferrari",
  "Esposito",
  "Romano",
  "Colombo",
  "Ricci",
  "Marino",
  "Greco",
  "Bruno",
  "Gallo",
  "Conti",
  "De Luca",
  "Mancini",
  "Costa",
  "Giordano",
];
const companies = [
  "Acme Srl",
  "Prime Logistics",
  "BlueWave Consulting",
  "Northwind Italia",
  "Contoso Retail",
  "Futura Energia",
  "Alfa Tech",
  "Omega Services",
  "Delta Foods",
  "Aurora Design",
  "Zenith Group",
  "Nova Manufacturing",
  "Terra Verde",
  "Pixel Studio",
  "Orion Systems",
  "Vento & Co",
];

const probe = new Pool({ connectionString: url, max: 1 });
try {
  const reg = await probe.query<{ oid: string | null }>(
    `SELECT to_regclass('crm.customers')::text AS oid`,
  );
  if (!reg.rows[0]?.oid) {
    console.error("Table crm.customers does not exist. Run db:migrate first.");
    process.exit(1);
  }
} finally {
  await probe.end();
}

initDal();
const dal = getDal();

// Dictionary row uuids resolved once — the flat customer fields are gone:
// channels live in `customer_contacts`, the fiscal name in
// `customer_accounts` (kind=legal).
const dictProbe = new Pool({ connectionString: url, max: 1 });
let EMAIL_TYPE_UUID: string;
let VOICE_TYPE_UUID: string;
let LEGAL_KIND_UUID: string;
try {
  const [ct, ak] = await Promise.all([
    dictProbe.query<{ code: string; uuid: string }>(
      `SELECT code, uuid::text FROM crm.contact_types WHERE code IN ('email','voice')`,
    ),
    dictProbe.query<{ code: string; uuid: string }>(
      `SELECT code, uuid::text FROM crm.account_kinds WHERE code = 'legal'`,
    ),
  ]);
  EMAIL_TYPE_UUID = ct.rows.find((r) => r.code === "email")!.uuid;
  VOICE_TYPE_UUID = ct.rows.find((r) => r.code === "voice")!.uuid;
  LEGAL_KIND_UUID = ak.rows[0]!.uuid;
} finally {
  await dictProbe.end();
}

const existing = await dal.count(CustomerEntity);
if (existing > 0n) {
  console.log("Customers seed skipped: crm.customers is not empty.");
  process.exit(0);
}

let seeded = 0;
for (let i = 1; i <= 137; i++) {
  const status = i % 7 === 0 ? "INACTIVE" : "ACTIVE";
  const isCompany = i % 4 === 0;
  const code = `CUST-${String(i).padStart(5, "0")}`;

  const customer = isCompany
    ? await dal.add(
        CustomerEntity,
        { code, display_name: companies[i % companies.length]!, status },
        { actor: "system" },
      )
    : await dal.add(
        CustomerEntity,
        {
          code,
          display_name: `${firstNames[i % firstNames.length]!} ${lastNames[i % lastNames.length]!}`,
          status,
        },
        { actor: "system" },
      );

  // Contacts — canonical channels (EMAIL default, VOICE default).
  const email = isCompany
    ? i % 3 === 0
      ? `info${i}@example.com`
      : `contact${i}@example.com`
    : i % 6 === 0
      ? undefined
      : `${customer.display_name!.toLowerCase().replace(/\s+/g, ".")}${i}@example.com`;
  const phone = isCompany
    ? i % 5 === 0
      ? `+39 02 00${String(i).padStart(4, "0")}`
      : undefined
    : i % 4 === 0
      ? `+39 3${String(20 + (i % 80)).padStart(2, "0")} ${String(i).padStart(7, "0")}`
      : undefined;
  if (email)
    await dal.add(
      CustomerContactEntity,
      { customer_id: customer.id, type_uuid: EMAIL_TYPE_UUID, value: email, is_default: true },
      { actor: "system" },
    );
  if (phone)
    await dal.add(
      CustomerContactEntity,
      { customer_id: customer.id, type_uuid: VOICE_TYPE_UUID, value: phone, is_default: true },
      { actor: "system" },
    );

  // Companies get the legal fiscal datasheet — the migrated
  // `company_name` lives here now.
  if (isCompany)
    await dal.add(
      CustomerAccountEntity,
      {
        customer_id: customer.id,
        kind_uuid: LEGAL_KIND_UUID,
        company_name: customer.display_name!,
        country: "IT",
        is_default: true,
      },
      { actor: "system" },
    );
  seeded++;
}

console.log(`Customers seed completed: ${seeded} rows inserted.`);
process.exit(0);
