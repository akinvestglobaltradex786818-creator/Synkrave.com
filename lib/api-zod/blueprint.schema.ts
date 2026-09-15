import { z } from "zod";

export const FieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
});

export const EntitySchema = z.object({
  name: z.string(),
  fields: z.array(FieldSchema),
});

export const RelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(["one-to-many", "many-to-many", "one-to-one"]),
});

export const ApiEndpointSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  route: z.string(),
  description: z.string(),
});

export const UserFlowSchema = z.object({
  name: z.string(),
  steps: z.array(z.string()),
});

export const BlueprintSchema = z.object({
  app_name: z.string(),
  description: z.string(),
  assumptions: z.array(z.string()),
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
  api_endpoints: z.array(ApiEndpointSchema),
  user_flows: z.array(UserFlowSchema),
});
