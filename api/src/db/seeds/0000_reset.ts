import type { Knex } from "knex";

const TABLES_IN_DELETE_ORDER = [
  "lp_media",
  "lp_content",
  "teia_requests",
  "teia_contacts",
  "feedbacks",
  "comments",
  "post_likes",
  "posts",
  "video_progress",
  "video_tags",
  "videos",
  "companies",
  "tags",
  "transactions",
  "subscriptions",
  "plans",
  "refresh_tokens",
  "password_resets",
  "staff_permissions",
  "users",
];

export async function seed(knex: Knex): Promise<void> {
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of TABLES_IN_DELETE_ORDER) {
    await knex(table).del();
  }
  await knex.raw("SET FOREIGN_KEY_CHECKS = 1");
}
