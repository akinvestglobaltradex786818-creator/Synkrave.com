import { z } from "zod";
import { safeParseAIResponse } from "./safeParse";

const entitySchema = z.object({
  name: z.string().min(1),
  fields: z.array(z.unknown()).default([]),
}).passthrough();

const apiSchema = z.object({
  method: z.string().min(1),
  route: z.string().min(1),
}).passthrough();

export const blueprintSchema = z.object({
  app_name: z.string().min(1),
  entities: z.array(entitySchema),
  apis: z.array(apiSchema),
  pages: z.array(z.unknown()),
  user_flows: z.array(z.unknown()),
}).strict();

export type Blueprint = z.infer<typeof blueprintSchema>;

export function validateBlueprint(value: unknown): Blueprint {
  return blueprintSchema.parse(value);
}

export function parseBlueprintResponse(raw: string): Blueprint {
  const parsed = safeParseAIResponse(raw);
  return validateBlueprint(parsed);
}
