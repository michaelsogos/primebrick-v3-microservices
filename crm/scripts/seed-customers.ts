// crm customers seed — moved from primebrick-be-v3 (customer ownership moved
// here: the demo dataset belongs to the module that owns `crm.customers`).
// Requirements: DATABASE_URL + DATABASE_SCHEMA in .env (dotenv); the
// `crm.customers` table must already exist (run `pnpm db:migrate` first).
import "dotenv/config";
import { Pool } from "pg";

import { assertDbEnv } from "@primebrick/sdk";

import { initDal, getDal } from "../src/db/dal.js";
import { CustomerEntity } from "../src/domain/entities/customer_entity.js";

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

  if (isCompany) {
    const company = companies[i % companies.length]!;
    const email = i % 3 === 0 ? `info${i}@example.com` : `contact${i}@example.com`;
    await dal.add(
      CustomerEntity,
      {
        code,
        company_name: company,
        email,
        phone: i % 5 === 0 ? `+39 02 00${String(i).padStart(4, "0")}` : undefined,
        status,
      },
      { actor: "system" },
    );
  } else {
    const first_name = firstNames[i % firstNames.length]!;
    const last_name = lastNames[i % lastNames.length]!;
    const email =
      i % 6 === 0
        ? undefined
        : `${first_name.toLowerCase()}.${last_name.toLowerCase().replace(/\s+/g, "")}${i}@example.com`;
    await dal.add(
      CustomerEntity,
      {
        code,
        first_name,
        last_name,
        email,
        phone:
          i % 4 === 0
            ? `+39 3${String(20 + (i % 80)).padStart(2, "0")} ${String(i).padStart(7, "0")}`
            : undefined,
        status,
      },
      { actor: "system" },
    );
  }
  seeded++;
}

console.log(`Customers seed completed: ${seeded} rows inserted.`);
process.exit(0);
