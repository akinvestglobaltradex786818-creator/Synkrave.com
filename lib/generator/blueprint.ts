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

  // 🔥 simple dynamic logic
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
  } else if (lower.includes("blog")) {
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
  } else {
    // default generic
    entities = [
      createEntity("items", [
        createField("id", "uuid"),
        createField("name", "string"),
      ]),
    ];
  }

  return {
    app_name: prompt,
    description: `Generated app for: ${prompt}`,
    assumptions: ["Auto-generated schema"],
    entities,
    relationships: [],
    api_endpoints: [],
    user_flows: [],
  };
}
