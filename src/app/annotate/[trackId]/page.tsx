"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WaveformContainer } from "@/components/Waveform";
import { MultiSelect } from "@/components/ui/multi-select";
import { detectTempo } from "@/lib/tempoDetection";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { Badge } from "@/components/ui/badge";

// Define form schema with Zod
const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  instruments: z.array(z.string()),
  aspect_list: z.array(z.string()),
  tempo: z.string().optional(),
  genres: z.array(z.string()),
});

type AnnotationFormValues = z.infer<typeof formSchema>;

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
  aspect_list,
  tempo,
  genres
}: {
  trackId: string;
  startTime: number;
  endTime: number;
  description: string;
  instruments: string[];
  aspect_list: string[];
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
      aspect_list,
      tempo,
      genres
    }),
  });
  
  if (!response.ok) throw new Error('Failed to save annotation');
  return response.json();
};


export default function AnnotatePage() {
  const { trackId } = useParams() as { trackId: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Waveform-related state
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(10);
  const [isDetectingBPM, setIsDetectingBPM] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize form with react-hook-form
  const form = useForm<AnnotationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      instruments: [],
      aspect_list: [],
      tempo: "",
      genres: []
    },
    mode: "onSubmit"
  });
  
  // Fetch track details
  const { data: track, isLoading: isLoadingTrack } = useQuery({
    queryKey: ["track", trackId],
    queryFn: () => fetchTrackDetails(trackId),
  });
  
  // Add this to get dynamic options
  const { instruments, aspects, genres, refreshTaxonomy, isLoading: isTaxonomyLoading } = useTaxonomy();
  
  // Handle selection change from waveform container
  const handleSelectionChange = useCallback((start: number, end: number) => {
    setSelectionStart(start);
    setSelectionEnd(end);
  }, []);
  
  // Save annotation mutation
  const { mutate: submitAnnotation, isPending: isSaving } = useMutation({
    mutationFn: saveAnnotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["track", trackId] });
      
      // Show success toast
      toast.success("Your annotation was saved successfully.");
      
      // Redirect to the annotate page which will handle finding the next track
      router.push('/annotate');
    },
    onError: () => {
      toast.error("Failed to save annotation. Please try again.");
    }
  });
  
  // Form submission handler
  const onSubmit = (values: AnnotationFormValues) => {
    submitAnnotation({
      trackId,
      startTime: selectionStart,
      endTime: selectionEnd,
      description: values.description,
      instruments: values.instruments,
      aspect_list: values.aspect_list,
      tempo: values.tempo || "",
      genres: values.genres
    });
  };
  
  // Auto-detect BPM when audio is loaded
  useEffect(() => {
    if (track?.originalUrl && !form.getValues("tempo") && !isDetectingBPM) {
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
            form.setValue("tempo", roundedBPM.toString());
          }
        } catch (error) {
          console.error("Error detecting BPM:", error);
        } finally {
          setIsDetectingBPM(false);
        }
      };
      
      detectTheTempo();
    }
  }, [track?.originalUrl, form, isDetectingBPM]);
  
  // Handle tempo input change
  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    form.setValue("tempo", value);
  };
  
  // Handle manual BPM detection
  const handleDetectBPM = () => {
    if (audioRef.current && track?.originalUrl) {
      setIsDetectingBPM(true);
      detectTempo(track.originalUrl)
        .then(bpm => {
          if (bpm) {
            const roundedBPM = Math.round(bpm / 10) * 10;
            form.setValue("tempo", roundedBPM.toString());
          }
        })
        .catch(console.error)
        .finally(() => setIsDetectingBPM(false));
    }
  };
  
  // Add this after the form initialization (around line 108)
  useEffect(() => {
    if (track?.annotated) {
      // Reset form with existing annotation data
      form.reset({
        description: track.description || "",
        instruments: track.instruments || [],
        aspect_list: track.aspect_list || [],
        tempo: track.tempo || "",
        genres: track.genres || []
      });

      // Update selection state if segment exists
      if (track.segment) {
        setSelectionStart(track.segment.start);
        setSelectionEnd(track.segment.end);
      }
    }
  }, [track, form]);
  
  const handleGoToLatest = () => {
    router.push('/annotate');
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
        <CardHeader className="relative">
          <CardTitle>Annotate Track: {track?.id}</CardTitle>
          {track?.annotated && (
            <Badge 
              variant="secondary" 
              className="absolute top-0 right-6"
            >
              Already Annotated
            </Badge>
          )}
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {track?.originalUrl && (
                <WaveformContainer
                  audioUrl={track.originalUrl}
                  onSelectionChange={handleSelectionChange}
                  initialSelection={{
                    start: track.segment?.start ?? selectionStart,
                    end: track.segment?.end ?? selectionEnd
                  }}
                />
              )}
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the audio segment in detail..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="instruments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Instruments
                      {isTaxonomyLoading && (
                        <div className="ml-2 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      )}
                    </FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={instruments}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder={isTaxonomyLoading ? "Loading instruments..." : "Select instruments..."}
                        emptyMessage="No instruments found."
                        allowCustomValues={true}
                        category="instruments"
                        onOptionsChange={() => refreshTaxonomy()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="aspect_list"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aspects</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={aspects}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select aspects..."
                        emptyMessage="No aspects found."
                        allowCustomValues={true}
                        category="aspects"
                        onOptionsChange={() => refreshTaxonomy()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="genres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genres</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={genres}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select genres..."
                        emptyMessage="No genres found."
                        allowCustomValues={true}
                        category="genres"
                        onOptionsChange={() => refreshTaxonomy()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tempo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tempo (BPM) {isDetectingBPM ? " (Detecting...)" : ""}
                    </FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input
                          type="text"
                          value={field.value}
                          onChange={handleTempoChange}
                          placeholder="Enter BPM"
                          className="w-32"
                        />
                      </FormControl>
                      {isDetectingBPM && (
                        <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
                      )}
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={handleDetectBPM}
                        disabled={isDetectingBPM || !track?.originalUrl}
                      >
                        Detect
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-detected BPM can be manually adjusted if needed
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-end gap-4">
              {/* Only show the Go to Latest button if the current track has already been annotated */}
              {track?.annotated && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleGoToLatest}
                >
                  Go to Latest Track
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {track?.annotated ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  track?.annotated ? 'Update Annotation' : 'Save Annotation'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}