import { NextResponse } from "next/server";
import { updateTaxonomyOptions } from "@/lib/firebase";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (request: Request) => {
  try {
    const { category, values } = await request.json();

    // Validate input
    if (!category || !values || !Array.isArray(values)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Ensure category is valid
    if (!["instruments", "aspects", "genres"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Update taxonomy in Firestore
    await updateTaxonomyOptions(
      category as "instruments" | "aspects" | "genres",
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating taxonomy:", error);
    return NextResponse.json(
      { error: "Failed to update taxonomy options" },
      { status: 500 }
    );
  }
});
