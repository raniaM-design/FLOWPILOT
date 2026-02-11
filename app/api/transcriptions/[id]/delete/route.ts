import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { deleteTranscription } from "@/app/app/meetings/[id]/transcription-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/transcriptions/[id]/delete
 * Supprime une transcription (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const { id } = await params;

    await deleteTranscription(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/transcriptions/delete] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

