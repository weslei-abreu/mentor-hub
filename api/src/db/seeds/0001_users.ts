import type { Knex } from "knex";
import { hashPassword } from "../../utils/password.js";
import { userIds } from "../seedIds.js";

const businesses = [
  "Padaria artesanal",
  "Clínica odontológica",
  "Loja de materiais de construção",
  "Estúdio de design",
  "Escritório de arquitetura",
  "Academia de bairro",
  "Distribuidora de bebidas",
  "Pet shop",
];

const clienteNames = [
  "Ana Almeida",
  "Bruno Cardoso",
  "Carla Dias",
  "Diego Ferreira",
  "Eduarda Gomes",
  "Felipe Hoffmann",
  "Gabriela Justino",
  "Henrique Klein",
];

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

export async function seed(knex: Knex): Promise<void> {
  const passwordHash = await hashPassword("123456");

  await knex("users").insert({
    id: userIds.admin,
    name: "Administrador Locus",
    email: "admin@wecod.com.br",
    password_hash: passwordHash,
    role: "admin",
    status: "ativo",
    last_access: new Date(),
  });

  const clienteIdList = [
    userIds.cliente1,
    userIds.cliente2,
    userIds.cliente3,
    userIds.cliente4,
    userIds.cliente5,
    userIds.cliente6,
    userIds.cliente7,
    userIds.cliente8,
  ];

  const lastAccessDays = [0, 1, 3, 6, 9, 12, 20, 40];

  await knex("users").insert(
    clienteIdList.map((id, i) => ({
      id,
      name: clienteNames[i],
      email: `cliente${i + 1}@wecod.com.br`,
      password_hash: passwordHash,
      role: "aluno" as const,
      business: businesses[i],
      status: "ativo" as const,
      created_at: daysAgo(60 + i * 20),
      last_access: daysAgo(lastAccessDays[i]!),
    })),
  );
}
