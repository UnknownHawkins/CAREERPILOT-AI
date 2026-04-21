'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, ScreenShare, User, VideoOff, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface InterviewStreamProps {
  isRecording: boolean;
  isAIThinking: boolean;
  sessionActive: boolean;
  onPermissionsGranted?: (stream: MediaStream) => void;
}

export const InterviewStream: React.FC<InterviewStreamProps> = ({
  isRecording,
  isAIThinking,
  sessionActive,
  onPermissionsGranted,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [hasCamera, setHasCamera] = useState(true);
  const [hasMic, setHasMic] = useState(true);
  const [permError, setPermError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (sessionActive && !stream) {
      startMedia();
    }
    return () => stopMedia();
  }, [sessionActive]);

  const startMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      onPermissionsGranted?.(mediaStream);
      setupAudioAnalysis(mediaStream);
    } catch (err: any) {
      console.error('Media error:', err);
      setPermError(err.message || 'Could not access camera/mic');
      if (err.name === 'NotAllowedError') setPermError('Camera and Microphone access denied.');
    }
  };

  const stopMedia = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    
    analyserRef.current = analyser;
    audioContextRef.current = audioContext;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateLevel = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
      setMicLevel(average / 128); // Normalize to 0-1 approx
      requestAnimationFrame(updateLevel);
    };
    updateLevel();
  };

  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Background/Video Feed */}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-zinc-500">
          <User className="w-16 h-16 opacity-20" />
          <p className="text-sm font-medium">{permError || 'Waiting for camera access...'}</p>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/20 text-white gap-2 px-3 py-1">
              <div className={cn("w-2 h-2 rounded-full", stream ? "bg-green-500 animate-pulse" : "bg-red-500")} />
              {stream ? "LIVE" : "OFFLINE"}
            </Badge>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                REC
              </motion.div>
            )}
          </div>

          <div className="flex gap-2">
             <button className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-white pointer-events-auto transition-colors">
               {hasCamera ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
             </button>
             <button className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-white pointer-events-auto transition-colors">
               {hasMic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
             </button>
          </div>
        </div>

        {/* Bottom Bar: Audio Visualizer & Feedback */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 h-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isRecording ? Math.max(4, micLevel * (30 + Math.random() * 50)) : 4 
                  }}
                  className="w-1 bg-primary/80 rounded-full"
                />
              ))}
            </div>
          </div>

          <AnimatePresence>
            {isAIThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-primary/90 backdrop-blur-xl text-primary-foreground px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-white/20 flex items-center gap-2"
              >
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" />
                </div>
                AI is analyzing your response...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Decorative Gradient Shading */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
    </div>
  );
};
