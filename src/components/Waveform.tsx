"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import type { Region } from 'wavesurfer.js/dist/plugins/regions';
import type { default as RegionsPluginType } from 'wavesurfer.js/dist/plugins/regions.js';

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

export default function Waveform({
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

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

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
      waveColor: '#3D8F6F',
      progressColor: '#70B69B',
      cursorColor: '#70B69B',
      height: 96,
      normalize: true,
      plugins: [regionsPlugin],
      fetchParams: { signal }, // Pass the abort signal to fetch requests
    });

    wavesurferRef.current = wavesurfer;
    regionsRef.current = regionsPlugin;

    // Add error handling for load
    wavesurfer.load(audioUrl).catch(error => {
      // Check if this is an abort error (which is expected during cleanup)
      if (error.name === 'AbortError') {
        // This is expected when component unmounts during loading, ignore it
        console.debug('Audio loading aborted due to component unmount');
      } else {
        // Log other errors that might be actual issues
        console.error('Error loading audio:', error);
      }
    });

    wavesurfer.on('ready', () => {
      setIsInitialized(true);
      onReady(true, wavesurfer.getDuration());

      // Create initial region
      regionsPlugin.addRegion({
        id: 'selection',
        start: selectionStart,
        end: selectionEnd,
        color: 'rgba(112, 182, 155, 0.3)',
        drag: true,
        resize: false,
      });
    });

    wavesurfer.on('timeupdate', (time) => {
      onTimeUpdate(time);
    });

    wavesurfer.on('play', () => onPlayPause(true));
    wavesurfer.on('pause', () => onPlayPause(false));

    // Handle region updates
    regionsPlugin.on('region-updated', (region: Region) => {
      if (region.id === 'selection') {
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
          console.warn('Error destroying WaveSurfer instance:', error);
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
      if(wavesurferRef.current.isPlaying()) {
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
          wavesurferRef.current?.un('timeupdate', checkTime);
        }
      };
      
      wavesurferRef.current.on('timeupdate', checkTime);
    };

    const handleUpdateRegion = (e: CustomEvent<{ start: number; end: number }>) => {
      if (!regionsRef.current) return;
      
      const regions = regionsRef.current.getRegions();
      const region = regions.find((r: Region) => r.id === 'selection');
      
      if (region) {
        region.setOptions({
          start: e.detail.start,
          end: e.detail.end,
        });
      }
    };

    window.addEventListener('waveform-toggle-play', handleTogglePlay);
    window.addEventListener('waveform-skip-backward', handleSkipBackward);
    window.addEventListener('waveform-skip-forward', handleSkipForward);
    window.addEventListener('waveform-play-selection', handlePlaySelection);
    window.addEventListener('waveform-update-region', handleUpdateRegion as EventListener);

    return () => {
      window.removeEventListener('waveform-toggle-play', handleTogglePlay);
      window.removeEventListener('waveform-skip-backward', handleSkipBackward);
      window.removeEventListener('waveform-skip-forward', handleSkipForward);
      window.removeEventListener('waveform-play-selection', handlePlaySelection);
      window.removeEventListener('waveform-update-region', handleUpdateRegion as EventListener);
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
      <div ref={waveformRef} />
    </div>
  );
}