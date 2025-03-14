"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AnnotatePage() {
  const router = useRouter();

  useEffect(() => {
    // Fetch the next track to annotate
    const fetchNextTrack = async () => {
      try {
        const response = await fetch('/api/tracks/next');
        if (!response.ok) throw new Error('Failed to fetch next track');
        
        const nextTrack = await response.json();
        
        // Check if all tracks have been annotated
        if (nextTrack.complete) {
          router.push('/annotate/complete');
        } else {
          // Redirect to the specific track annotation page
          router.replace(`/annotate/${nextTrack.id}`);
        }
      } catch (error) {
        console.error('Error fetching next track:', error);
      }
    };

    fetchNextTrack();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading next track to annotate...</p>
      </div>
    </div>
  );
}
