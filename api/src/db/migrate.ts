import "dotenv/config";
import Knex from "knex";
import knexConfig from "../../knexfile.js";

const db = Knex(knexConfig);

async function run() {
  const [, log] = await db.migrate.latest();
  if (log.length === 0) {
    console.log("Nenhuma migration pendente.");
  } else {
    console.log("Migrations executadas:");
    log.forEach((name: string) => console.log(`  - ${name}`));
  }
  await db.destroy();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
