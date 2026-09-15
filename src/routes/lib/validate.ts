export function validateBlueprint(data: any) {
  return {
    app_name: data.app_name || "Untitled App",
    entities: Array.isArray(data.entities) ? data.entities : [],
    apis: Array.isArray(data.apis) ? data.apis : [],
    pages: Array.isArray(data.pages) ? data.pages : [],
    user_flows: Array.isArray(data.user_flows) ? data.user_flows : []
  };
}
