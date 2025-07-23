export function formatCCD(microCCD: bigint): string {
  return `${Number(microCCD) / 1_000_000} CCD`;
}

export function formatDuration(milliseconds: number | string): string {
  const ms =
    typeof milliseconds === "string" ? parseInt(milliseconds) : milliseconds;
  if (isNaN(ms) || ms < 0) return "0s";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (typeof obj === "number") {
    return obj.toString();
  }

  if (typeof obj === "string" && /^\d+\.?\d*$/.test(obj)) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj && typeof obj === "object" && obj.bulletproofGenerators) {
    return {
      onChainCommitmentKey: obj.onChainCommitmentKey,
      bulletproofGenerators: {
        length: obj.bulletproofGenerators.length,
        preview: obj.bulletproofGenerators.substring(0, 64) + "...",
        note: "Cryptographic data truncated",
      },
      ...Object.keys(obj).reduce((acc, key) => {
        if (key !== "onChainCommitmentKey" && key !== "bulletproofGenerators") {
          acc[key] = serializeBigInt(obj[key]);
        }
        return acc;
      }, {} as any),
    };
  }

  if (obj instanceof Buffer || obj instanceof Uint8Array) {
    const hex = Buffer.from(obj).toString("hex");
    if (hex.length > 128) {
      return {
        type: "Buffer",
        length: hex.length,
        preview: hex.substring(0, 64) + "...",
        note: "Large buffer data truncated for readability",
      };
    }
    return hex;
  }

  if (
    obj &&
    typeof obj === "object" &&
    typeof obj.toString === "function" &&
    obj.__type
  ) {
    return obj.toString();
  }

  if (obj && obj.__type === "ccd_duration" && obj.value) {
    return obj.value.toString();
  }

  if (obj && obj.buffer && typeof obj.buffer === "object") {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (key.startsWith("__") || key === "typedJsonType") continue;

      let value = obj[key];

      if (key === "localTime") {
        const timestamp =
          typeof value === "string" ? parseInt(value) : Number(value);
        if (!isNaN(timestamp) && timestamp > 0 && timestamp < 253402300800000) {
          const readable = new Date(timestamp).toISOString();
          value = `${value} (${readable})`;
        }
      } else if (key === "peerUptime") {
        const ms = typeof value === "string" ? parseInt(value) : Number(value);
        if (!isNaN(ms) && ms > 0) {
          value = `${value} (${formatDuration(ms)})`;
        }
      }

      result[key] = serializeBigInt(value);
    }
    return result;
  }

  return obj;
}
