import React, { useState, useRef, useEffect, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { Square, Play, Pause, Trash2, Send, Mic, X } from "lucide-react";

function DummyWaveVisualizer() {
  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.4); opacity: 1; }
        }

        .dot-pulse {
          animation: dotPulse 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex items-center justify-center flex-1 gap-2 mx-4 h-11">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-green-400 dot-pulse"
            style={{
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function VoiceRecorder({
  setShowVoiceRecorder,
  ReplyData,
  setReplyData,
  onSend,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  const waveformRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const isRecordingRef = useRef(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const cleanup = useCallback(() => {
    // Clear timers and animations
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    isRecordingRef.current = false;

    // Stop MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        mediaRecorder.stop();
      } catch (e) {
        console.warn("MediaRecorder already stopped:", e);
      }
    }

    // Cleanup playback waveform
    if (waveSurfer) {
      try {
        waveSurfer.destroy();
        setWaveSurfer(null);
      } catch (e) {
        console.warn("Error destroying wavesurfer:", e);
      }
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn("Error closing audio context:", e);
      }
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Revoke object URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset state
    setAudioLevel(0);
    setIsRecording(false);
    setIsPlaying(false);
    setIsPaused(false);
    setRecordingTime(0);
    setPlaybackTime("0:00");
    setDuration("0:00");
  }, [mediaRecorder, waveSurfer, audioUrl]);

  const startRecording = async () => {
    try {
      setIsInitializing(true);

      // Get microphone permission and stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true, // ✅ Enable to prevent echo in recordings
          noiseSuppression: true, // ✅ Enable to reduce ambient background noise
          autoGainControl: true, // ✅ Enable to maintain consistent volume level
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Set up audio analysis for level detection
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      // Optimized analyser settings for better audio level detection
      analyser.fftSize = 1024; // Good balance of resolution and performance
      analyser.smoothingTimeConstant = 0.1; // Very fast response
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up MediaRecorder for actual file recording
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const file = new File([blob], `voice-recording-${Date.now()}.webm`, {
          type: mimeType,
        });

        setAudioUrl(url);
        setAudioFile(file);
        setAudioChunks(chunks);
        setIsInitializing(false);

        console.log("Recording completed, file created:", file);
      };

      setMediaRecorder(recorder);
      recorder.start(100);
      setIsRecording(true);
      isRecordingRef.current = true;
      setIsInitializing(false);
      setRecordingTime(0);

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Please check microphone permissions.");
      setShowVoiceRecorder(false);
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    setIsInitializing(true);
    isRecordingRef.current = false;

    // Clear timer and animation
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }

    setIsRecording(false);
    setAudioLevel(0);
  };

  const handleDelete = () => {
    console.log("Deleting recording...");
    cleanup();
    setAudioUrl(null);
    setAudioFile(null);
    setAudioChunks([]);
    setShowVoiceRecorder(false);
  };

  const handleSendAudio = () => {
    if (audioFile && onSend) {
      onSend(audioFile);
    }

    cleanup();
    setAudioUrl(null);
    setAudioFile(null);
    setAudioChunks([]);
    setShowVoiceRecorder(false);
  };

  const togglePlayback = () => {
    if (waveSurfer) {
      if (isPlaying) {
        waveSurfer.pause();
        setIsPlaying(false);
        setIsPaused(true);
      } else {
        waveSurfer.play();
        setIsPlaying(true);
        setIsPaused(false);
      }
    }
  };

  // Start recording when component mounts
  useEffect(() => {
    startRecording();

    return () => {
      cleanup();
    };
  }, []);

  // Set up playback waveform when audio is available
  useEffect(() => {
    if (audioUrl && waveformRef.current && !waveSurfer && !isRecording) {
      console.log("Setting up playback waveform...");

      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "rgba(99, 102, 241, 0.4)",
        progressColor: "rgba(99, 102, 241, 1)",
        cursorColor: "rgba(255, 255, 255, 0.8)",
        barWidth: 2,
        barGap: 1,
        height: 50,
        normalize: true,
        cursorWidth: 2,
        barRadius: 2,
      });

      ws.load(audioUrl);

      ws.on("ready", () => {
        setDuration(formatTime(ws.getDuration()));
        setIsInitializing(false);
        console.log("Playback waveform ready");
      });

      ws.on("audioprocess", () =>
        setPlaybackTime(formatTime(ws.getCurrentTime())),
      );

      ws.on("play", () => {
        setIsPlaying(true);
        setIsPaused(false);
      });

      ws.on("pause", () => {
        setIsPlaying(false);
        setIsPaused(true);
      });

      ws.on("finish", () => {
        setIsPlaying(false);
        setIsPaused(false);
        setPlaybackTime("0:00");
      });

      ws.on("error", (error) => {
        console.error("Waveform error:", error);
        setIsInitializing(false);
      });

      setWaveSurfer(ws);
    }
  }, [audioUrl, isRecording, waveSurfer]);

  // Show recording interface
  if (isRecording) {
    return (
      <div className="bg-gradient-to-r py-3 from-slate-800 to-slate-900 border-t border-slate-700 shadow-2xl">
        <div className="flex items-center px-4">
          {/* Recording indicator and timer */}
          <div className="flex items-center gap-3 min-w-fit">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <Mic size={16} className="text-red-400" />
            </div>
            <div className="text-xl font-mono text-white tabular-nums min-w-[4rem]">
              {formatTime(recordingTime)}
            </div>
          </div>

          {/* Enhanced Live Wave Visualizer */}
          <DummyWaveVisualizer />

          {/* Stop button */}
          <button
            onClick={stopRecording}
            className="relative w-11 h-11 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-opacity-50 transition-all duration-200"
          >
            <div className="absolute inset-2 bg-red-400 rounded-md flex items-center justify-center">
              <Square size={16} className="text-white" fill="white" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Show playback interface
  if (audioUrl && !isInitializing) {
    return (
      <div className="bg-gradient-to-r py-3 from-slate-800 to-slate-900 border-t border-slate-700 shadow-2xl">
        <div className="flex items-center px-4">
          {/* Play/Pause button */}
          <button
            onClick={togglePlayback}
            className="w-11 h-11 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50 mr-3"
          >
            {isPlaying ? (
              <Pause size={16} className="text-white" fill="white" />
            ) : (
              <Play size={16} className="text-white ml-0.5" fill="white" />
            )}
          </button>

          <div className="">
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              {playbackTime} / {duration}
            </div>
          </div>

          {/* Waveform */}
          <div className="flex-1 mx-2">
            <div ref={waveformRef} className="w-full"></div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={handleDelete}
              className="bg-transparent rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 focus:outline-none"
            >
              <Trash2 className="text-white w-8 h-8 font-black hover:text-red-500 transition-colors" />
            </button>

            <button
              onClick={handleSendAudio}
              className="w-11 h-11 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50 transition-all duration-200"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  return (
    <div className="bg-gradient-to-r py-3 from-slate-800 to-slate-900 border-t border-slate-700 shadow-2xl">
      <div className="flex items-center px-4 min-h-[48px]">
        <div className="flex items-center justify-center w-full gap-3 text-slate-300">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
          <span className="text-sm">
            {isRecording ? "Starting recording..." : "Processing..."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorder;
