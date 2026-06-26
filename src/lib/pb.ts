import PocketBase from "pocketbase";

const url = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";

declare global {
  // eslint-disable-next-line no-var
  var _pb: PocketBase | undefined;
}

// Reuse instance across hot-reloads in dev
export const pb: PocketBase =
  global._pb ?? (global._pb = new PocketBase(url));
