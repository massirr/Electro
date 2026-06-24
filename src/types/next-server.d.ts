// Bun installs next without next/server.d.ts — declare both module paths.
declare module "next/server" {
  export { NextRequest, NextResponse } from "next/dist/server/web/exports/index";
}

declare module "next/server.js" {
  export { NextRequest, NextResponse } from "next/dist/server/web/exports/index";
}
