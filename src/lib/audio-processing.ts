import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Process audio file: trim to specified segment, convert to mono, set sample rate to 32kHz
 * @param sourceUrl URL of the source audio file
 * @param startTime Start time in seconds
 * @param endTime End time in seconds
 * @returns Buffer containing the processed audio file
 */
export async function processAudio(
  sourceUrl: string, 
  startTime: number, 
  endTime: number
): Promise<Buffer> {
  // Create temp files
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input-${Date.now()}.mp3`);
  const outputPath = path.join(tempDir, `output-${Date.now()}.wav`);
  
  try {
    // Download file
    const response = await fetch(sourceUrl);
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));
    
    // Use ffmpeg to process audio
    await execAsync(
      `ffmpeg -i ${inputPath} -ss ${startTime} -to ${endTime} -ac 1 -ar 32000 ${outputPath}`
    );
    
    // Read processed file
    const processedBuffer = fs.readFileSync(outputPath);
    
    // Clean up temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    
    return processedBuffer;
  } catch (error) {
    console.error('Error processing audio:', error);
    
    // Clean up on error
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    
    throw new Error(`Failed to process audio: ${error}`);
  }
} 