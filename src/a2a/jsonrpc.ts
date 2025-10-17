export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: { code: number; message: string; data?: any };
};

export function ok(id: JsonRpcRequest["id"], result: any): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
export function err(id: JsonRpcRequest["id"], code: number, message: string, data?: any): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data } };
}
