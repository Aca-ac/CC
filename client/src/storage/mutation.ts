import { v4 as uuidv4 } from "uuid";

export interface Mutation {
  mutationId: string;
  timestamp: number;
  operation: "CREATE" | "UPDATE" | "DELETE";
  entityType: "PROJECT" | "TASK" | "LOG" | "FOCUS";
  entityId: string;
  payload: unknown;
}

export function generateMutationId(): string {
  return uuidv4();
}

export function createMutation(
  operation: Mutation["operation"],
  entityType: Mutation["entityType"],
  entityId: string,
  payload: unknown
): Mutation {
  return {
    mutationId: generateMutationId(),
    timestamp: Date.now(),
    operation,
    entityType,
    entityId,
    payload,
  };
}
