"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Waveform from "@/components/Waveform";
import { INSTRUMENTS, MOODS, GENRES } from "@/lib/types";
import { Play, Pause, SkipBack, SkipForward, Repeat } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { detectTempo } from "@/lib/tempoDetection";
import { Input } from "@/components/ui/input";

// Replace mock functions with actual implementations
const fetchTrackDetails = async (trackId: string) => {
  const response = await fetch(`/api/tracks/${trackId}`);
  if (!response.ok) throw new Error('Failed to fetch track');
  return response.json();
};

const saveAnnotation = async ({
  trackId,
  startTime,
  endTime,
  description,
  instruments,
  moods,
  tempo,
  genres
}: {
  trackId: string;
  startTime: number;
  endTime: number;
  description: string;
  instruments: string[];
  moods: string[];
  tempo: string;
  genres: string[];
}) => {
  const response = await fetch('/api/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      trackId, 
      startTime, 
      endTime, 
      description,
      instruments,
      moods,
      tempo,
      genres
    }),
  });
  
  if (!response.ok) throw new Error('Failed to save annotation');
  return response.json();
};

const fetchNextTrack = async () => {
  const response = await fetch('/api/tracks/next');
  if (!response.ok) throw new Error('Failed to fetch next track');
  return response.json();
};

export default function AnnotatePage() {
  const { trackId } = useParams() as { trackId: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(10); // Default 10-second segment
  const [description, setDescription] = useState("");
  const [isWaveformReady, setIsWaveformReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [annotationStatus, setAnnotationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Add state for structured data
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [tempo, setTempo] = useState<string>("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isDetectingBPM, setIsDetectingBPM] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Fetch track details
  const { data: track, isLoading: isLoadingTrack } = useQuery({
    queryKey: ["track", trackId],
    queryFn: () => fetchTrackDetails(trackId),
  });
  
  // If no trackId is provided, fetch the next track
  useEffect(() => {
    if (!trackId || trackId === 'next') {
      fetchNextTrack().then(nextTrack => {
        if (nextTrack.complete) {
          router.push('/annotate/complete');
        } else {
          router.replace(`/annotate/${nextTrack.id}`);
        }
      }).catch(error => {
        console.error('Error fetching next track:', error);
      });
    }
  }, [trackId, router]);
  
  // Modify save annotation mutation
  const { mutate: submitAnnotation, isPending: isSaving } = useMutation({
    mutationFn: saveAnnotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["track", trackId] });
      setDescription("");
      setSelectedInstruments([]);
      setSelectedMoods([]);
      setTempo("");
      setSelectedGenres([]);
      setAnnotationStatus('success');
      
      // Fetch next track directly instead of redirecting
      setTimeout(() => {
        fetchNextTrack().then(nextTrack => {
          if (nextTrack.complete) {
            router.push('/annotate/complete');
          } else {
            router.replace(`/annotate/${nextTrack.id}`);
          }
        }).catch(error => {
          console.error('Error fetching next track:', error);
        });
      }, 1500);
    },
    onError: () => {
      setAnnotationStatus('error');
    }
  });
  
  // Handle waveform events
  const handleWaveformReady = (isReady: boolean, audioDuration: number) => {
    setIsWaveformReady(isReady);
    setDuration(audioDuration);
    
    // If the audio is longer than 30 seconds, set a default 10-second segment in the middle
    if (audioDuration > 30) {
      const middle = audioDuration / 2;
      setSelectionStart(middle - 5);
      setSelectionEnd(middle + 5);
    }
  };
  
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  const handlePlayPause = (playing: boolean) => {
    setIsPlaying(playing);
  };
  
  const handleRegionUpdate = (start: number, end: number) => {
    setSelectionStart(start);
    setSelectionEnd(end);
  };
  
  // Playback control functions using custom events
  const togglePlayPause = () => {
    window.dispatchEvent(new Event('waveform-toggle-play'));
  };
  
  const skipBackward = () => {
    window.dispatchEvent(new Event('waveform-skip-backward'));
  };
  
  const skipForward = () => {
    window.dispatchEvent(new Event('waveform-skip-forward'));
  };
  
  const playSelection = () => {
    window.dispatchEvent(new Event('waveform-play-selection'));
  };
  
  // Update region via custom event
  useEffect(() => {
    const updateRegion = () => {
      const event = new CustomEvent('waveform-update-region', {
        detail: { start: selectionStart, end: selectionEnd }
      });
      window.dispatchEvent(event);
    };
    
    if (isWaveformReady) {
      updateRegion();
    }
  }, [selectionStart, selectionEnd, isWaveformReady]);
  
  const handleSaveAnnotation = () => {
    if (!description.trim()) {
      alert("Please provide a description");
      return;
    }
    
    submitAnnotation({
      trackId,
      startTime: selectionStart,
      endTime: selectionEnd,
      description,
      instruments: selectedInstruments,
      moods: selectedMoods,
      tempo: tempo,
      genres: selectedGenres
    });
  };
  
  // Render status message
  const renderStatusMessage = () => {
    if (annotationStatus === 'success') {
      return (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
          Annotation saved successfully! Processing audio and loading next track...
        </div>
      );
    } else if (annotationStatus === 'error') {
      return (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          Error saving annotation. Please try again.
        </div>
      );
    }
    return null;
  };
  
  // Display current time and duration information
  const renderTimeInfo = () => {
    return (
      <div className="text-sm text-muted-foreground mt-1 flex justify-between">
        <span>Current: {currentTime.toFixed(2)}s</span>
        <span>Duration: {duration.toFixed(2)}s</span>
      </div>
    );
  };
  
  // Auto-detect BPM when audio is loaded
  useEffect(() => {
    if (track?.originalUrl && !tempo && !isDetectingBPM) {
      const detectTheTempo = async () => {
        try {
          setIsDetectingBPM(true);
          
          // Create audio element if it doesn't exist
          if (!audioRef.current) {
            audioRef.current = new Audio(track.originalUrl);
          }
          
          // Wait for audio to be loaded
          if (audioRef.current.readyState < 2) {
            await new Promise(resolve => {
              audioRef.current!.addEventListener('canplay', resolve, { once: true });
            });
          }
          
          // Detect BPM using the tempo detection function
          const bpm = await detectTempo(track.originalUrl);
          
          // Set the detected BPM as the tempo value, rounded to nearest 10
          if (bpm) {
            const roundedBPM = Math.round(bpm / 10) * 10;
            setTempo(roundedBPM.toString());
          }
        } catch (error) {
          console.error("Error detecting BPM:", error);
        } finally {
          setIsDetectingBPM(false);
        }
      };
      
      detectTheTempo();
    }
  }, [track?.originalUrl, tempo, isDetectingBPM]);
  
  // Handle tempo input change
  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    setTempo(value);
  };
  
  if (isLoadingTrack) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-3xl bg-background text-foreground">
      <Card className="shadow-lg border-border">
        <CardHeader>
          <CardTitle>Annotate Track: {track?.id}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {track?.originalUrl && (
            <div className="space-y-2">
              <Label>Audio Waveform</Label>
              <div className="bg-muted rounded-md overflow-hidden">
                <Waveform
                  audioUrl={track.originalUrl}
                  selectionStart={selectionStart}
                  selectionEnd={selectionEnd}
                  isPlaying={isPlaying}
                  onReady={handleWaveformReady}
                  onTimeUpdate={handleTimeUpdate}
                  onPlayPause={handlePlayPause}
                  onRegionUpdate={handleRegionUpdate}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Selection: {selectionStart.toFixed(2)}s - {selectionEnd.toFixed(2)}s</span>
                <span>Duration: {(selectionEnd - selectionStart).toFixed(2)}s</span>
              </div>
              {renderTimeInfo()}
              
              {/* Playback controls */}
              <div className="flex justify-center space-x-2 mt-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={skipBackward}
                  title="Skip back 5 seconds"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={togglePlayPause}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={skipForward}
                  title="Skip forward 5 seconds"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={playSelection}
                  title="Play selected region"
                  className="ml-2"
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Play Selection
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the audio segment in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24"
            />
          </div>
          
          {/* Instruments Selection */}
          <div className="space-y-2">
            <Label>Instruments</Label>
            <MultiSelect
              options={INSTRUMENTS}
              selected={selectedInstruments}
              onChange={setSelectedInstruments}
              placeholder="Select instruments..."
              emptyMessage="No instruments found."
              allowCustomValues={true}
            />
          </div>
          
          {/* Moods Selection */}
          <div className="space-y-2">
            <Label>Moods</Label>
            <MultiSelect
              options={MOODS}
              selected={selectedMoods}
              onChange={setSelectedMoods}
              placeholder="Select moods..."
              emptyMessage="No moods found."
              allowCustomValues={true}
            />
          </div>
          
          {/* Tempo Input */}
          <div className="space-y-2">
            <Label htmlFor="tempo">
              Tempo (BPM) {isDetectingBPM ? " (Detecting...)" : ""}
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="tempo"
                type="text"
                value={tempo}
                onChange={handleTempoChange}
                placeholder="Enter BPM"
                className="w-32"
              />
              {isDetectingBPM && (
                <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (audioRef.current && track?.originalUrl) {
                    setIsDetectingBPM(true);
                    detectTempo(track.originalUrl)
                      .then(bpm => {
                        if (bpm) {
                          const roundedBPM = Math.round(bpm / 10) * 10;
                          setTempo(roundedBPM.toString());
                        }
                      })
                      .catch(console.error)
                      .finally(() => setIsDetectingBPM(false));
                  }
                }}
                disabled={isDetectingBPM || !track?.originalUrl}
              >
                Detect
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-detected BPM can be manually adjusted if needed
            </p>
          </div>
          
          {/* Genres Selection */}
          <div className="space-y-2">
            <Label>Genres</Label>
            <MultiSelect
              options={GENRES}
              selected={selectedGenres}
              onChange={setSelectedGenres}
              placeholder="Select genres..."
              emptyMessage="No genres found."
              allowCustomValues={true}
            />
          </div>
          
          {renderStatusMessage()}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/')}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAnnotation} 
            disabled={!isWaveformReady || isSaving || !description.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Annotation'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}