import PocketBase from "pocketbase";

// Auto-derive URL from current page host so mobile (same-WiFi) testing works
function getUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8090`;
  }
  return process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
}

let _client: PocketBase | undefined;

export function getPbClient(): PocketBase {
  if (!_client) _client = new PocketBase(getUrl());
  return _client;
}
