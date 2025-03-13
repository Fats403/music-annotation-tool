import * as beatDetector from 'web-audio-beat-detector';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

/**
 * Detects the tempo (BPM) of an audio file
 * @param audioUrl URL of the audio file to analyze
 * @returns Promise resolving to the detected BPM
 */
export async function detectTempo(audioUrl: string): Promise<number> {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Fetch the audio file
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Detect tempo using web-audio-beat-detector
    const tempo = await beatDetector.analyze(audioBuffer);
    
    // Round to nearest integer
    return Math.round(tempo);
  } catch (error) {
    console.error('Error detecting tempo:', error);
    
    // If tempo detection fails, return a reasonable default
    return 120;
  }
}