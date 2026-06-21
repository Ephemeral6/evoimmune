export type Family = { id: string; name: string; emoji: string };
export type Status = {
  ready: boolean;
  families: Family[];
  node: string | null;
  model: string;
  solver: string;
  hub: string;
  clients?: number;
};
export type WsMsg = { type: string; [k: string]: any };
export type TaskState = { family: string; phase: string; via?: string; similarity?: number };
