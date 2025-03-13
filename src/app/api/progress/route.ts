import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const progressDoc = await db.collection('system').doc('annotation-progress').get();
    
    if (!progressDoc.exists) {
      // Initialize progress if it doesn't exist
      const initialProgress = {
        currentFolder: '000',
        currentFileIndex: 0,
        completedFolders: [],
        totalAnnotated: 0,
        lastAnnotatedAt: new Date().toISOString()
      };
      
      await db.collection('system').doc('annotation-progress').set(initialProgress);
      return NextResponse.json(initialProgress);
    }
    
    return NextResponse.json(progressDoc.data());
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
} 