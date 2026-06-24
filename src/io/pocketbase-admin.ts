import PocketBase from "pocketbase";

const PB_URL = process.env.PB_URL ?? "http://localhost:8090";

export const pb = new PocketBase(PB_URL);

export async function authenticateAdmin(
  email = process.env.PB_ADMIN_EMAIL ?? "admin@electro.local",
  password = process.env.PB_ADMIN_PASSWORD ?? "electro-dev-2026"
): Promise<void> {
  // PocketBase v0.22+ uses _superusers collection instead of pb.admins
  await pb.collection("_superusers").authWithPassword(email, password);
}
