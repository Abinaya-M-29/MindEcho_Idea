import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, X, Send, AlertCircle, Sparkles } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (base64Audio: string, mimeType: string) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoice,
  onCancel,
  disabled,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    setAudioBlob(null);
    setElapsedSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine best supported audio mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
        'audio/wav',
      ];
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: selectedMimeType || 'audio/webm',
        });
        setAudioBlob(finalBlob);
      };

      mediaRecorder.start(250); // Slice chunks every 250ms
      setIsRecording(true);

      timerIntervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
      } else {
        setErrorMessage(err.message || 'Unable to access microphone.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    onCancel();
  };

  const handleSend = async () => {
    let blobToSend = audioBlob;
    if (isRecording) {
      stopRecording();
      // wait a tick for onstop to trigger
      await new Promise((resolve) => setTimeout(resolve, 300));
      blobToSend = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || 'audio/webm',
      });
      setAudioBlob(blobToSend);
    }

    if (!blobToSend || blobToSend.size === 0) {
      setErrorMessage('No audio recorded. Please try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await onSendVoice(base64String, blobToSend.type);
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to process voice reflection.');
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(blobToSend);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read audio data.');
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    startRecording();

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="voice-recorder-bar"
      className="p-4 bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 shadow-lg flex flex-col gap-3 transition-all animate-fadeIn"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isRecording ? (
            <div className="relative flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-rose-500 animate-ping absolute" />
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 relative" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
          )}

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-stone-200">
              {isRecording ? 'Listening to your thoughts...' : 'Audio entry recorded'}
            </span>
            <span className="text-xs font-mono text-stone-400">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Audio Waveform visualization */}
        {isRecording && (
          <div className="flex items-center space-x-1 px-4">
            <div className="w-1 bg-amber-400 rounded-full h-3 animate-pulse" style={{ animationDuration: '400ms' }} />
            <div className="w-1 bg-amber-300 rounded-full h-6 animate-pulse" style={{ animationDuration: '600ms' }} />
            <div className="w-1 bg-amber-200 rounded-full h-4 animate-pulse" style={{ animationDuration: '300ms' }} />
            <div className="w-1 bg-amber-400 rounded-full h-7 animate-pulse" style={{ animationDuration: '500ms' }} />
            <div className="w-1 bg-amber-300 rounded-full h-5 animate-pulse" style={{ animationDuration: '450ms' }} />
            <div className="w-1 bg-amber-200 rounded-full h-3 animate-pulse" style={{ animationDuration: '350ms' }} />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Pause / Stop recording"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Finish</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Record again"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>Retake</span>
            </button>
          )}

          <button
            onClick={cancelRecording}
            className="p-2 rounded-lg bg-stone-800/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={handleSend}
            disabled={isProcessing || disabled}
            className="px-4 py-2 rounded-lg bg-white text-stone-950 hover:bg-stone-100 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-stone-900" />
                <span>Reflecting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Transcribe & Reflect</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
