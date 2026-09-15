export type Blueprint = {
  app_name: string;
  description: string;
  assumptions: string[];
  entities: any[];
  relationships: any[];
  api_endpoints: any[];
  user_flows: any[];
};

function createEntity(name: string, fields: any[]) {
  return {
    name,
    fields,
  };
}

function createField(name: string, type: string, required = true) {
  return { name, type, required };
}

export function generateBlueprint(prompt: string): Blueprint {
  const lower = prompt.toLowerCase();

  let entities: any[] = [];
  let relationships: any[] = [];
  let api_endpoints: any[] = [];

  // 🔴 ECOMMERCE
  if (lower.includes("ecommerce")) {
    entities = [
      createEntity("users", [
        createField("id", "uuid"),
        createField("email", "string"),
        createField("password", "string"),
      ]),
      createEntity("products", [
        createField("id", "uuid"),
        createField("name", "string"),
        createField("price", "decimal"),
      ]),
      createEntity("orders", [
        createField("id", "uuid"),
        createField("user_id", "uuid"),
        createField("total", "decimal"),
      ]),
    ];
  }

  // 🔴 BLOG
  else if (lower.includes("blog")) {
    entities = [
      createEntity("users", [
        createField("id", "uuid"),
        createField("name", "string"),
      ]),
      createEntity("posts", [
        createField("id", "uuid"),
        createField("title", "string"),
        createField("content", "string"),
      ]),
    ];
  }

  // 🔴 DEFAULT
  else {
    entities = [
      createEntity("items", [
        createField("id", "uuid"),
        createField("name", "string"),
      ]),
    ];
  }

  // 🔴 AUTO API GENERATION
  entities.forEach((entity) => {
    const name = entity.name;

    api_endpoints.push(
      {
        method: "GET",
        route: `/${name}`,
        description: `Get all ${name}`,
      },
      {
        method: "POST",
        route: `/${name}`,
        description: `Create ${name}`,
      },
      {
        method: "PUT",
        route: `/${name}/:id`,
        description: `Update ${name}`,
      },
      {
        method: "DELETE",
        route: `/${name}/:id`,
        description: `Delete ${name}`,
      }
    );
  });

  // 🔴 SIMPLE RELATIONSHIPS (basic logic)
  if (entities.find((e) => e.name === "orders")) {
    relationships.push({
      from: "users",
      to: "orders",
      type: "one-to-many",
    });
  }

  if (entities.find((e) => e.name === "products")) {
    relationships.push({
      from: "orders",
      to: "products",
      type: "many-to-many",
    });
  }

  return {
    app_name: prompt,
    description: `Generated blueprint for: ${prompt}`,
    assumptions: ["Auto-generated system"],
    entities,
    relationships,
    api_endpoints,
    user_flows: [],
  };
}
