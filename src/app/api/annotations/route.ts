import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { s3Client } from '@/lib/s3';
import { getS3SignedUrl } from '@/lib/s3';
import { processAudio } from '@/lib/audio-processing';
import { AnnotationProgress, Track } from '@/lib/types';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request: Request) {
  try {
    const {
      trackId, 
      startTime,  
      description,
      instruments,
      aspect_list,
      tempo,
      genres
    } = await request.json();
    
    // Round start and end times to 1 decimal place
    const roundedStartTime = Math.round(startTime * 10) / 10;
    
    // Ensure segment is exactly 10 seconds
    const adjustedEndTime = roundedStartTime + 10.0;
    
    // 1. Get track info from Firestore
    const trackDoc = await db.collection('tracks').doc(trackId).get();
    if (!trackDoc.exists) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }
    
    const track = trackDoc.data() as Track;
    
    // 2. Process audio (trim, convert to mono, set sample rate)
    const originalUrl = await getS3SignedUrl(track.s3Key);
    const processedAudio = await processAudio(originalUrl, roundedStartTime, adjustedEndTime);
    
    // 3. Upload processed audio to S3
    const processedKey = `processed/${trackId}_${roundedStartTime}_${adjustedEndTime}.wav`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: processedKey,
      Body: processedAudio,
      ContentType: 'audio/wav',
    }));
    
    // 4. Update Firestore with annotation
    await db.collection('tracks').doc(trackId).update({
      annotated: true,
      description: description,
      instruments: instruments || [],
      aspect_list: aspect_list || [],
      tempo: tempo || "",
      genres: genres || [],
      processedS3Key: processedKey,
      annotatedAt: new Date().toISOString(),
      segment: { start: roundedStartTime, end: adjustedEndTime }
    });
    
    // 5. Update progress counter
    const progressRef = db.collection('system').doc('annotation-progress');
    await db.runTransaction(async (transaction) => {
      const progressDoc = await transaction.get(progressRef);
      const progress = progressDoc.data() as AnnotationProgress;
      
      transaction.update(progressRef, {
        currentFileIndex: progress.currentFileIndex + 1,
        totalAnnotated: progress.totalAnnotated + 1,
        lastAnnotatedAt: new Date().toISOString()
      });
    });
    
    return NextResponse.json({ 
      success: true, 
    });
  } catch (error) {
    console.error('Error saving annotation:', error);
    return NextResponse.json({ error: 'Failed to save annotation' }, { status: 500 });
  }
} 