"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function CompletePage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Annotation Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg">
            You have successfully annotated all tracks in the FMA Small dataset.
          </p>
          <p className="mt-4">
            The processed audio files and annotations are ready for training with MusicLM.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button onClick={() => router.push('/annotate/progress')}>
            View Progress Summary
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 