type State = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
type Artifact = { kind: "data"; parts: Array<{ type: string; data: any }> };

export interface Task {
  id: string;
  state: State;
  message?: string;
  artifacts: Artifact[];
  createdAt: number;
  updatedAt: number;
  cancelRequested?: boolean;
}

const store = new Map<string, Task>();

export function createTask(): Task {
  const id = `task_${Math.random().toString(36).slice(2, 10)}`;
  const now = Date.now();
  const t: Task = { id, state: "PENDING", artifacts: [], createdAt: now, updatedAt: now };
  store.set(id, t);
  return t;
}

export function getTask(id: string) { return store.get(id); }
export function saveTask(t: Task) { t.updatedAt = Date.now(); store.set(t.id, t); }
export function cancelTask(id: string) { const t = store.get(id); if (t) { t.cancelRequested = true; saveTask(t); } return t; }
