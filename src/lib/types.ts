interface AnnotationProgress {
  currentFolder: string;  // "000", "001", etc.
  currentFileIndex: number;  // Index within the current folder
  completedFolders: string[];  // List of completed folders
  totalAnnotated: number;  // Total files annotated
  lastAnnotatedAt: string;  // ISO timestamp
}

interface Track {
  id: string;
  folderPath: string;  // e.g., "000/000123"
  fileName: string;    // e.g., "000123.mp3"
  s3Key: string;       // Full S3 key
  title?: string;      // Optional metadata from tracks.csv
  artist?: string;
  genre?: string;
  annotated: boolean;
  description?: string;
  instruments?: string[];  // Selected instruments
  aspect_list?: string[];  // Changed from moods
  tempo?: string;          // Selected tempo
  genres?: string[];       // Selected genres
  processedUrl?: string;
  annotatedAt?: string;
  segment?: {
    start: number;
    end: number;
  };
}

// Predefined options for structured data
const INSTRUMENTS = [
  "acoustic guitar", "electric guitar", "piano", "synthesizer", "drums", 
  "bass", "violin", "cello", "trumpet", "saxophone", "flute", 
  "vocals", "choir", "organ", "harp", "banjo", "ukulele"
];

const ASPECTS = [
  // Keep some mood descriptors
  "happy", "sad", "energetic", "calm", "relaxed", "tense", "dark", 
  "bright", "melancholic", "nostalgic", "dreamy", "aggressive", 
  "playful", "romantic", "mysterious", "epic",
  
  // Add musical aspects
  "crescendo", "diminuendo", "staccato", "legato", "pizzicato",
  "distorted", "clean", "reverb", "delay", "chorus",
  "rhythmic", "arpeggiated", "layered", "minimal", "complex",
  "melodic", "harmonic", "dissonant", "consonant", "atonal",
  "acoustic", "electronic", "synthetic", "organic", "processed",
  "looped", "sampled", "live", "studio", "improvised",
  "vocal-heavy", "instrumental", "beat-driven", "ambient"
];

const TEMPOS = [
  "very slow", "slow", "medium", "fast", "very fast"
];

const GENRES = [
  "rock", "pop", "jazz", "classical", "electronic", "hip hop", "rap",
  "r&b", "folk", "country", "blues", "metal", "ambient", "funk",
  "soul", "reggae", "world", "experimental"
];

export type { AnnotationProgress, Track };
export { INSTRUMENTS, ASPECTS, TEMPOS, GENRES }; 