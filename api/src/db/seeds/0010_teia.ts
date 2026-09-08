import { v4 as uuid } from "uuid";
import type { Knex } from "knex";
import { clienteIds } from "../seedIds.js";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const fields = [
  "Contabilidade",
  "Marketing Digital",
  "Recursos Humanos",
  "Logística",
  "Tecnologia",
  "Jurídico",
  "Arquitetura",
  "Varejo",
];
const cities = [
  "São Paulo",
  "Curitiba",
  "Belo Horizonte",
  "Florianópolis",
  "Porto Alegre",
  "Recife",
  "Salvador",
];
const firstNames = [
  "Rafael",
  "Camila",
  "Thiago",
  "Larissa",
  "Marcelo",
  "Juliana",
  "André",
  "Patrícia",
  "Rodrigo",
  "Vanessa",
];
const lastNames = [
  "Souza",
  "Martins",
  "Ribeiro",
  "Teixeira",
  "Correia",
  "Vieira",
  "Rocha",
  "Farias",
];

export async function seed(knex: Knex): Promise<void> {
  const r = rng(112233);
  const contacts: Array<Record<string, unknown>> = [];
  const requests: Array<Record<string, unknown>> = [];

  clienteIds.forEach((ownerId, i) => {
    const externalCount = 2 + Math.floor(r() * 2);
    for (let j = 0; j < externalCount; j++) {
      const name = `${firstNames[Math.floor(r() * firstNames.length)]} ${lastNames[Math.floor(r() * lastNames.length)]}`;
      contacts.push({
        id: uuid(),
        registered_by_id: ownerId,
        linked_user_id: null,
        name,
        company_name: `${name.split(" ")[1]} Negócios`,
        field: fields[Math.floor(r() * fields.length)],
        city: cities[Math.floor(r() * cities.length)],
        phone: `(11) 9${String(Math.floor(r() * 90000000) + 10000000)}`,
        email: `${name.toLowerCase().replace(" ", ".")}${i}${j}@contato.com.br`,
      });
    }

    const nextUserId = clienteIds[(i + 1) % clienteIds.length]!;
    const nextUser = { name: `Cliente ${((i + 1) % clienteIds.length) + 1}` };
    contacts.push({
      id: uuid(),
      registered_by_id: ownerId,
      linked_user_id: nextUserId,
      name: nextUser.name,
      company_name: "Negócio do próprio cliente",
      field: fields[(i + 2) % fields.length],
      city: cities[(i + 1) % cities.length],
      phone: `(11) 9${String(90000000 + i)}`,
      email: `cliente${((i + 1) % clienteIds.length) + 1}@wecod.com.br`,
    });
  });

  await knex("teia_contacts").insert(contacts);

  const pendingCandidates = contacts.filter((c) => c.linked_user_id === null);
  const usedPairs = new Set<string>();
  clienteIds.forEach((requesterId, i) => {
    const eligible = pendingCandidates.filter((c) => c.registered_by_id !== requesterId);
    const requestCount = 2 + Math.floor(r() * 2);
    for (let k = 0; k < requestCount; k++) {
      const candidate = eligible[(i * 5 + k * 7) % eligible.length];
      if (!candidate) continue;
      const pairKey = `${candidate.id}:${requesterId}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      const roll = r();
      requests.push({
        id: uuid(),
        contact_id: candidate.id,
        requested_by_id: requesterId,
        status: roll < 0.4 ? "pendente" : roll < 0.75 ? "aprovado" : "recusado",
        message: "Gostaria de uma apresentação, temos sinergia de negócio.",
        responded_at: roll < 0.4 ? null : new Date(),
      });
    }
  });

  await knex("teia_requests").insert(requests);
}
