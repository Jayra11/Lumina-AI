import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface VoiceInputProps {
  onTranscribed: (text: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceInput({ onTranscribed, isOpen, onOpenChange }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transcribeMutation = trpc.transcribeVoice.useMutation({
    onSuccess: (result) => {
      onTranscribed(result.text);
      setIsTranscribing(false);
      onOpenChange(false);
      toast.success("Voice transcribed successfully!");
    },
    onError: () => {
      toast.error("Failed to transcribe voice");
      setIsTranscribing(false);
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        // Upload to storage and get URL
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        // For now, we'll use a simple approach - convert blob to data URL
        const reader = new FileReader();
        reader.onload = async () => {
          const audioUrl = reader.result as string;
          setIsTranscribing(true);
          transcribeMutation.mutate({ audioUrl });
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Voice Input</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center justify-center py-8">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-100 animate-pulse"
                  : "bg-blue-100"
              }`}
            >
              <Mic className={`w-12 h-12 ${isRecording ? "text-red-600" : "text-blue-600"}`} />
            </div>
            {isRecording && (
              <p className="text-sm text-slate-600 mt-4">Recording... Click stop when done</p>
            )}
          </div>

          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isTranscribing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            )}
          </div>

          {isTranscribing && (
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transcribing...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
