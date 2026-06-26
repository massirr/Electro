import { NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/pb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const project = await pb.collection("projects").getOne(id);
    const items = await pb.collection("takeoff_items").getFullList({
      filter: `project = "${id}"`,
    });
    return NextResponse.json({ project, items });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // takeoff_items have cascadeDelete on project relation — deleting project removes them
    await pb.collection("projects").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Not found or service unavailable" }, { status: 404 });
  }
}
