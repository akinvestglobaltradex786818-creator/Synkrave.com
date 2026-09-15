export type Blueprint = {
  app_name: string;
  description: string;
  assumptions: string[];
  entities: any[];
  relationships: any[];
  api_endpoints: any[];
  user_flows: any[];
};

export function generateBlueprint(prompt: string): Blueprint {
  if (prompt.toLowerCase().includes("ecommerce")) {
    return {
      app_name: "Ecommerce App",
      description: "Basic ecommerce system",
      assumptions: ["User can browse products"],
      entities: [
        {
          name: "products",
          fields: [
            { name: "id", type: "uuid", required: true }
          ]
        }
      ],
      relationships: [],
      api_endpoints: [],
      user_flows: []
    };
  }

  return {
    app_name: "Generic App",
    description: "Default blueprint",
    assumptions: [],
    entities: [],
    relationships: [],
    api_endpoints: [],
    user_flows: []
  };
}
