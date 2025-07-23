import { serializeBigInt } from "./formatters";

export function success(data: any) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(serializeBigInt(data), null, 2),
      },
    ],
  };
}

export function successMsg(text: string) {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

export function error(err: any, fallback: string) {
  return {
    content: [
      {
        type: "text",
        text: `Error: ${err.message || fallback}`,
      },
    ],
    isError: true,
  };
}
