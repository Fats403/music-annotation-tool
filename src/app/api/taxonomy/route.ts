import { NextResponse } from "next/server";
import { fetchTaxonomyOptions } from "@/lib/firebase";

export const GET = async () => {
  try {
    const taxonomy = await fetchTaxonomyOptions();
    return NextResponse.json(taxonomy);
  } catch (error) {
    console.error("Error fetching taxonomy:", error);
    return NextResponse.json(
      { error: "Failed to fetch taxonomy options" },
      { status: 500 }
    );
  }
};
