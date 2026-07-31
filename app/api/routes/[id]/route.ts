import { NextResponse } from "next/server";
import { deleteWatchedRoute } from "@/lib/priceHistory";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid route id" }, { status: 400 });
  }
  deleteWatchedRoute(id);
  return NextResponse.json({ ok: true });
}
