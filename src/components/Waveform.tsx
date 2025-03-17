"use client";

import { memo, useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import type { Region } from "wavesurfer.js/dist/plugins/regions";
import type { default as RegionsPluginType } from "wavesurfer.js/dist/plugins/regions.js";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Repeat } from "lucide-react";

interface WaveformProps {
  audioUrl: string;
  selectionStart: number;
  selectionEnd: number;
  isPlaying: boolean;
  onReady: (isReady: boolean, duration: number) => void;
  onTimeUpdate: (time: number) => void;
  onPlayPause: (isPlaying: boolean) => void;
  onRegionUpdate: (start: number, end: number) => void;
}

// Create a completely isolated Waveform container component
export const WaveformContainer = memo(function WaveformContainer({
  audioUrl,
  onSelectionChange,
  initialSelection,
}: {
  audioUrl: string;
  onSelectionChange?: (start: number, end: number) => void;
  initialSelection: { start: number; end: number };
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectionStart, setSelectionStart] = useState(initialSelection.start);
  const [selectionEnd, setSelectionEnd] = useState(initialSelection.end);
  const [isWaveformReady, setIsWaveformReady] = useState(false);
  const [duration, setDuration] = useState(0);

  // Handle waveform events
  const handleWaveformReady = useCallback(
    (isReady: boolean, audioDuration: number) => {
      setIsWaveformReady(isReady);
      setDuration(audioDuration);

      // Remove the automatic middle segment selection
      // Only set selection if no initial values were provided
      if (
        initialSelection.start === 0 &&
        initialSelection.end === 0 &&
        audioDuration > 30
      ) {
        const middle = audioDuration / 2;
        setSelectionStart(middle - 5);
        setSelectionEnd(middle + 5);
        if (onSelectionChange) {
          onSelectionChange(middle - 5, middle + 5);
        }
      }
    },
    [initialSelection, onSelectionChange]
  );

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handlePlayPause = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleRegionUpdate = useCallback(
    (start: number, end: number) => {
      setSelectionStart(start);
      setSelectionEnd(end);
      if (onSelectionChange) {
        onSelectionChange(start, end);
      }
    },
    [onSelectionChange]
  );

  // Playback control functions using custom events
  const togglePlayPause = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      window.dispatchEvent(new Event("waveform-toggle-play"));
    },
    []
  );

  const skipBackward = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    window.dispatchEvent(new Event("waveform-skip-backward"));
  }, []);

  const skipForward = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    window.dispatchEvent(new Event("waveform-skip-forward"));
  }, []);

  const playSelection = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      window.dispatchEvent(new Event("waveform-play-selection"));
    },
    []
  );

  // Update region via custom event
  useEffect(() => {
    const updateRegion = () => {
      const event = new CustomEvent("waveform-update-region", {
        detail: { start: selectionStart, end: selectionEnd },
      });
      window.dispatchEvent(event);
    };

    if (isWaveformReady) {
      updateRegion();
    }
  }, [selectionStart, selectionEnd, isWaveformReady]);

  // Display current time and duration information
  const renderTimeInfo = () => {
    return (
      <div className="text-sm text-muted-foreground mt-1 flex justify-between">
        <span>Current: {currentTime.toFixed(2)}s</span>
        <span>Duration: {duration.toFixed(2)}s</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Label>Audio Waveform</Label>
      <div className="bg-muted rounded-md overflow-hidden">
        <Waveform
          audioUrl={audioUrl}
          selectionStart={selectionStart}
          selectionEnd={selectionEnd}
          isPlaying={isPlaying}
          onReady={handleWaveformReady}
          onTimeUpdate={handleTimeUpdate}
          onPlayPause={handlePlayPause}
          onRegionUpdate={handleRegionUpdate}
        />
      </div>
      <div className="flex justify-center text-sm text-muted-foreground">
        <span>
          Selection: {selectionStart.toFixed(2)}s - {selectionEnd.toFixed(2)}s
        </span>
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
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
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
  );
});

function Waveform({
  audioUrl,
  selectionStart,
  selectionEnd,
  isPlaying,
  onReady,
  onTimeUpdate,
  onPlayPause,
  onRegionUpdate,
}: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPluginType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    setIsLoading(true);

    // Clean up previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // Create AbortController for fetch requests
    const controller = new AbortController();
    const signal = controller.signal;

    const regionsPlugin = RegionsPlugin.create();

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "oklch(0.65 0.15 145)", // muted green
      progressColor: "oklch(0.75 0.22 145)", // brighter green
      cursorColor: "oklch(0.75 0.22 145)", // same bright green
      height: 96,
      normalize: true,
      plugins: [regionsPlugin],
      dragToSeek: false,
      interact: true,
      fetchParams: { signal }, // Pass the abort signal to fetch requests
    });

    wavesurferRef.current = wavesurfer;
    regionsRef.current = regionsPlugin;

    // Add error handling for load
    wavesurfer.load(audioUrl).catch((error) => {
      // Check if this is an abort error (which is expected during cleanup)
      if (error.name === "AbortError") {
        // This is expected when component unmounts during loading, ignore it
        console.debug("Audio loading aborted due to component unmount");
      } else {
        // Log other errors that might be actual issues
        console.error("Error loading audio:", error);
      }
      setIsLoading(false);
    });

    wavesurfer.on("ready", () => {
      setIsInitialized(true);
      setIsLoading(false);
      onReady(true, wavesurfer.getDuration());

      // Create initial region
      regionsPlugin.addRegion({
        id: "selection",
        start: selectionStart,
        end: selectionEnd,
        color: "oklch(0.75 0.22 145 / 0.3)", // semi-transparent bright green
        drag: true,
        resize: false,
      });
    });

    wavesurfer.on("timeupdate", (time) => {
      onTimeUpdate(time);
    });

    wavesurfer.on("play", () => onPlayPause(true));
    wavesurfer.on("pause", () => onPlayPause(false));

    // Handle region updates
    regionsPlugin.on("region-updated", (region: Region) => {
      if (region.id === "selection") {
        onRegionUpdate(region.start, region.end);
      }
    });

    return () => {
      // Abort any in-progress fetch requests
      controller.abort();

      if (wavesurferRef.current) {
        // Unsubscribe from all events before destroying
        wavesurferRef.current.unAll();

        // Use a try-catch to handle potential errors during destroy
        try {
          wavesurferRef.current.destroy();
        } catch (error) {
          console.warn("Error destroying WaveSurfer instance:", error);
        }

        wavesurferRef.current = null;
      }
    };
  }, [audioUrl]);

  // Handle external controls via events
  useEffect(() => {
    if (!wavesurferRef.current || !isInitialized) return;

    const handleTogglePlay = () => {
      if (!wavesurferRef.current) return;
      if (wavesurferRef.current.isPlaying()) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
    };

    const handleSkipBackward = () => {
      if (!wavesurferRef.current) return;
      const newTime = Math.max(0, wavesurferRef.current.getCurrentTime() - 5);
      wavesurferRef.current.setTime(newTime);
    };

    const handleSkipForward = () => {
      if (!wavesurferRef.current) return;
      const newTime = Math.min(
        wavesurferRef.current.getDuration(),
        wavesurferRef.current.getCurrentTime() + 5
      );
      wavesurferRef.current.setTime(newTime);
    };

    const handlePlaySelection = () => {
      if (!wavesurferRef.current) return;

      wavesurferRef.current.setTime(selectionStart);
      wavesurferRef.current.play();

      const checkTime = () => {
        if (!wavesurferRef.current) return;
        if (wavesurferRef.current?.getCurrentTime() >= selectionEnd) {
          wavesurferRef.current?.pause();
          wavesurferRef.current?.un("timeupdate", checkTime);
        }
      };

      wavesurferRef.current.on("timeupdate", checkTime);
    };

    const handleUpdateRegion = (
      e: CustomEvent<{ start: number; end: number }>
    ) => {
      if (!regionsRef.current) return;

      const regions = regionsRef.current.getRegions();
      const region = regions.find((r: Region) => r.id === "selection");

      if (region) {
        region.setOptions({
          start: e.detail.start,
          end: e.detail.end,
        });
      }
    };

    window.addEventListener("waveform-toggle-play", handleTogglePlay);
    window.addEventListener("waveform-skip-backward", handleSkipBackward);
    window.addEventListener("waveform-skip-forward", handleSkipForward);
    window.addEventListener("waveform-play-selection", handlePlaySelection);
    window.addEventListener(
      "waveform-update-region",
      handleUpdateRegion as EventListener
    );

    return () => {
      window.removeEventListener("waveform-toggle-play", handleTogglePlay);
      window.removeEventListener("waveform-skip-backward", handleSkipBackward);
      window.removeEventListener("waveform-skip-forward", handleSkipForward);
      window.removeEventListener(
        "waveform-play-selection",
        handlePlaySelection
      );
      window.removeEventListener(
        "waveform-update-region",
        handleUpdateRegion as EventListener
      );
    };
  }, [isInitialized, selectionStart, selectionEnd]);

  // Update playback state from props
  useEffect(() => {
    if (!wavesurferRef.current || !isInitialized) return;

    if (isPlaying && !wavesurferRef.current.isPlaying()) {
      wavesurferRef.current.play();
    } else if (!isPlaying && wavesurferRef.current.isPlaying()) {
      wavesurferRef.current.pause();
    }
  }, [isPlaying, isInitialized]);

  return (
    <div className="h-24 bg-muted rounded-md overflow-hidden">
      {isLoading && (
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-full w-full bg-muted-foreground/10 animate-pulse"></div>
        </div>
      )}
      <div ref={waveformRef} className={isLoading ? "invisible h-0" : ""} />
    </div>
  );
}
