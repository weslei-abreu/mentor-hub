// Reset seletivo do banco: apaga dado de uso/teste acumulado (alunos, vídeos,
// comunidade, teia, financeiro) e preserva o que é configuração do sistema
// (admin, staff + staff_permissions, plans, lp_content/lp_media, tags,
// companies). Roda direto, sem prompt de confirmação — quem chama já decidiu.
//
// Uso: npm run reset (dentro de /api)
import "dotenv/config";
import Knex from "knex";
import knexConfig from "../../knexfile.js";

const db = Knex(knexConfig);

// Ordem de filhos para pais — importa para clareza mesmo com FK_CHECKS
// desligado durante o bloco.
const TEST_DATA_TABLES = [
  "video_progress",
  "video_tags",
  "videos",
  "comments",
  "post_likes",
  "posts",
  "feedbacks",
  "teia_requests",
  "teia_contacts",
  "transactions",
  "subscriptions",
];

async function run() {
  const summary: Record<string, number> = {};

  await db.transaction(async (trx) => {
    await trx.raw("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of TEST_DATA_TABLES) {
      summary[table] = await trx(table).del();
    }

    const alunoIds = (await trx("users").where({ role: "aluno" }).select("id")).map((u) => u.id);

    if (alunoIds.length > 0) {
      summary.refresh_tokens = await trx("refresh_tokens").whereIn("user_id", alunoIds).del();
      summary.password_resets = await trx("password_resets").whereIn("user_id", alunoIds).del();
    } else {
      summary.refresh_tokens = 0;
      summary.password_resets = 0;
    }

    summary.users_aluno = await trx("users").where({ role: "aluno" }).del();

    await trx.raw("SET FOREIGN_KEY_CHECKS = 1");
  });

  const [{ count: adminCount }] = await db("users")
    .where({ role: "admin" })
    .count<{ count: string }[]>("id as count");
  const [{ count: staffCount }] = await db("users")
    .where({ role: "staff" })
    .count<{ count: string }[]>("id as count");
  const [{ count: staffPermCount }] =
    await db("staff_permissions").count<{ count: string }[]>("id as count");
  const [{ count: plansCount }] = await db("plans").count<{ count: string }[]>("id as count");
  const [{ count: lpContentCount }] =
    await db("lp_content").count<{ count: string }[]>("id as count");
  const [{ count: lpMediaCount }] = await db("lp_media").count<{ count: string }[]>("id as count");
  const [{ count: tagsCount }] = await db("tags").count<{ count: string }[]>("id as count");
  const [{ count: companiesCount }] =
    await db("companies").count<{ count: string }[]>("id as count");

  console.log("Reset concluído. Registros removidos:");
  console.log(`  - videos:            ${summary.videos}`);
  console.log(`  - video_tags:        ${summary.video_tags}`);
  console.log(`  - video_progress:    ${summary.video_progress}`);
  console.log(`  - posts:             ${summary.posts}`);
  console.log(`  - post_likes:        ${summary.post_likes}`);
  console.log(`  - comments:          ${summary.comments}`);
  console.log(`  - feedbacks:         ${summary.feedbacks}`);
  console.log(`  - teia_contacts:     ${summary.teia_contacts}`);
  console.log(`  - teia_requests:     ${summary.teia_requests}`);
  console.log(`  - subscriptions:     ${summary.subscriptions}`);
  console.log(`  - transactions:      ${summary.transactions}`);
  console.log(`  - refresh_tokens:    ${summary.refresh_tokens} (só de alunos removidos)`);
  console.log(`  - password_resets:   ${summary.password_resets} (só de alunos removidos)`);
  console.log(`  - users (role aluno): ${summary.users_aluno}`);
  console.log("");
  console.log("Preservado (configuração do sistema):");
  console.log(`  - users (role admin):  ${adminCount}`);
  console.log(`  - users (role staff):  ${staffCount}`);
  console.log(`  - staff_permissions:   ${staffPermCount}`);
  console.log(`  - plans:               ${plansCount}`);
  console.log(`  - lp_content:          ${lpContentCount}`);
  console.log(`  - lp_media:            ${lpMediaCount}`);
  console.log(`  - tags:                ${tagsCount}`);
  console.log(`  - companies:           ${companiesCount}`);

  await db.destroy();
}

run().catch(async (error) => {
  console.error(error);
  await db.destroy();
  process.exit(1);
});
