import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { s3Client } from '@/lib/s3';
import { getS3SignedUrl } from '@/lib/s3';
import { AnnotationProgress, Track } from '@/lib/types';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    // Get the current progress document
    const progressDoc = await db.collection('system').doc('annotation-progress').get();
    const progress = progressDoc.exists ? progressDoc.data() as AnnotationProgress : {
      currentFolder: '000',
      currentFileIndex: 0,
      completedFolders: [],
      totalAnnotated: 0,
      lastAnnotatedAt: new Date().toISOString()
    };
    
    // Get list of files in the current folder
    const folderPrefix = `fma_small/${progress.currentFolder}/`;
    const { Contents } = await s3Client.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME!,
      Prefix: folderPrefix,
      MaxKeys: 1000
    }));
    
    if (!Contents || Contents.length === 0) {
      // Current folder is empty or doesn't exist, try next folder
      return handleEmptyFolder(progress);
    }
    
    // Sort files by name to ensure consistent order
    const sortedFiles = Contents
      .filter(item => item.Key!.endsWith('.mp3'))
      .sort((a, b) => a.Key!.localeCompare(b.Key!));
    
    // Check if we've processed all files in this folder
    if (progress.currentFileIndex >= sortedFiles.length) {
      return handleEmptyFolder(progress);
    }
    
    // Get the next file to process
    const nextFile = sortedFiles[progress.currentFileIndex];
    const fileName = nextFile.Key!.split('/').pop()!;
    const trackId = fileName.replace('.mp3', '');
    
    // Check if this track is already annotated
    const trackDoc = await db.collection('tracks').doc(trackId).get();
    
    if (trackDoc.exists && trackDoc.data()?.annotated) {
      // This track is already annotated, move to next one
      await db.collection('system').doc('annotation-progress').update({
        currentFileIndex: progress.currentFileIndex + 1,
      });
      
      // Recursively call this function to get the next unannotated track
      return GET();
    }
    
    // Create or update track document
    const track: Track = trackDoc.exists ? trackDoc.data() as Track : {
      id: trackId,
      folderPath: `${progress.currentFolder}/${trackId}`,
      fileName: fileName,
      s3Key: nextFile.Key!,
      annotated: false
    };
    
    // If track doesn't exist in Firestore yet, create it
    if (!trackDoc.exists) {
      await db.collection('tracks').doc(trackId).set(track);
    }
    
    // Generate a signed URL for the track
    const signedUrl = await getS3SignedUrl(track.s3Key);
    
    // Return the track to annotate
    return NextResponse.json({
      ...track,
      originalUrl: signedUrl
    });
    
  } catch (error) {
    console.error('Error getting next track:', error);
    return NextResponse.json({ error: 'Failed to get next track' }, { status: 500 });
  }
}

async function handleEmptyFolder(progress: AnnotationProgress): Promise<NextResponse> {
  // Current folder is complete, move to next folder
  const currentFolderNum = parseInt(progress.currentFolder, 10);
  const nextFolderNum = currentFolderNum + 1;
  
  // Format with leading zeros (e.g., 001, 002)
  const nextFolder = nextFolderNum.toString().padStart(3, '0');
  
  // Check if we've reached the end (folder 156)
  if (nextFolderNum > 155) {
    return NextResponse.json({ 
      complete: true, 
      message: 'All tracks have been annotated' 
    });
  }
  
  // Update progress to the next folder
  await db.collection('system').doc('annotation-progress').update({
    currentFolder: nextFolder,
    currentFileIndex: 0,
    completedFolders: [...progress.completedFolders, progress.currentFolder]
  });
  
  // Recursively call GET to fetch from the new folder
  return GET();
} 