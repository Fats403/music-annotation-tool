import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getS3SignedUrl } from "@/lib/s3";
import { Track } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;

    // Get track from Firestore
    const trackDoc = await db.collection("tracks").doc(trackId).get();

    if (!trackDoc.exists) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const track = trackDoc.data() as Track;

    // Generate a signed URL for the track
    const signedUrl = await getS3SignedUrl(track.s3Key);

    // Return track with signed URL
    return NextResponse.json({
      ...track,
      originalUrl: signedUrl,
    });
  } catch (error) {
    console.error("Error fetching track:", error);
    return NextResponse.json(
      { error: "Failed to fetch track" },
      { status: 500 }
    );
  }
}
