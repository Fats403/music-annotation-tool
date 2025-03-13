"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export default function ProgressPage() {
  const { data: progress, isLoading } = useQuery({
    queryKey: ["annotation-progress"],
    queryFn: async () => {
      const response = await fetch('/api/progress');
      if (!response.ok) throw new Error('Failed to fetch progress');
      return response.json();
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Calculate percentage (assuming 8000 total tracks)
  const percentage = Math.round((progress.totalAnnotated / 8000) * 100);
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Annotation Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Overall Progress</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium">Current Status</h3>
              <p>Folder: {progress.currentFolder}</p>
              <p>File Index: {progress.currentFileIndex}</p>
              <p>Total Annotated: {progress.totalAnnotated}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Last Activity</h3>
              <p>Last Annotated: {new Date(progress.lastAnnotatedAt).toLocaleString()}</p>
              <p>Completed Folders: {progress.completedFolders.length}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Completed Folders</h3>
            <div className="flex flex-wrap gap-2">
              {progress.completedFolders.map((folder: string) => (
                <span key={folder} className="px-2 py-1 bg-muted rounded-md text-sm">
                  {folder}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 