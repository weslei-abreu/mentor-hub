import "dotenv/config";
import Knex from "knex";
import knexConfig from "../../knexfile.js";

const db = Knex(knexConfig);

async function run() {
  const log = await db.seed.run();
  console.log("Seeds executadas:", log);
  await db.destroy();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
