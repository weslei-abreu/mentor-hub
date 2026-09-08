import { db } from "../db/knex.js";

export interface GraphNode {
  id: string;
  name: string;
  field: string | null;
  city: string | null;
  type: "user" | "contact";
}

export interface GraphLink {
  source: string;
  target: string;
}

export async function buildGraph(rootUserId: string, maxDepth = 4) {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const visitedUsers = new Set<string>();

  const rootUser = await db("users").where({ id: rootUserId }).first();
  if (!rootUser) return { nodes: [], links: [] };
  nodes.set(rootUser.id, {
    id: rootUser.id,
    name: rootUser.name,
    field: null,
    city: null,
    type: "user",
  });

  async function expand(userId: string, depth: number) {
    if (depth > maxDepth || visitedUsers.has(userId)) return;
    visitedUsers.add(userId);

    const contacts = await db("teia_contacts").where({ registered_by_id: userId });
    for (const contact of contacts) {
      nodes.set(contact.id, {
        id: contact.id,
        name: contact.name,
        field: contact.field,
        city: contact.city,
        type: "contact",
      });
      links.push({ source: userId, target: contact.id });

      if (contact.linked_user_id) {
        const linkedUser = await db("users").where({ id: contact.linked_user_id }).first();
        if (linkedUser) {
          links.push({ source: contact.id, target: linkedUser.id });
          nodes.set(linkedUser.id, {
            id: linkedUser.id,
            name: linkedUser.name,
            field: null,
            city: null,
            type: "user",
          });
          await expand(linkedUser.id, depth + 1);
        }
      }
    }
  }

  await expand(rootUserId, 0);
  return { nodes: [...nodes.values()], links };
}

export async function buildFullGraph() {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const linkKeys = new Set<string>();

  function addLink(source: string, target: string) {
    const key = `${source}>${target}`;
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push({ source, target });
  }

  const users = await db("users").select("id", "name");
  for (const user of users) {
    nodes.set(user.id, { id: user.id, name: user.name, field: null, city: null, type: "user" });
  }

  const contacts = await db("teia_contacts");
  for (const contact of contacts) {
    nodes.set(contact.id, {
      id: contact.id,
      name: contact.name,
      field: contact.field,
      city: contact.city,
      type: "contact",
    });
    addLink(contact.registered_by_id, contact.id);
    if (contact.linked_user_id && nodes.has(contact.linked_user_id)) {
      addLink(contact.id, contact.linked_user_id);
    }
  }

  const connectedIds = new Set<string>();
  for (const link of links) {
    connectedIds.add(link.source);
    connectedIds.add(link.target);
  }

  return {
    nodes: [...nodes.values()].filter((n) => n.type === "contact" || connectedIds.has(n.id)),
    links,
  };
}
