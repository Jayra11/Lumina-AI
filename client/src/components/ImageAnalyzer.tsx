import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ImageAnalyzerProps {
  onAnalysisComplete: (analysis: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageAnalyzer({ onAnalysisComplete, isOpen, onOpenChange }: ImageAnalyzerProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [query, setQuery] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImageMutation = trpc.analyzeImage.useMutation({
    onSuccess: (result) => {
      const analysisText = typeof result.analysis === "string" ? result.analysis : JSON.stringify(result.analysis);
      onAnalysisComplete(analysisText);
      setIsAnalyzing(false);
      onOpenChange(false);
      toast.success("Image analyzed successfully!");
      setImageUrl("");
      setQuery("");
      setPreviewUrl("");
    },
    onError: (error) => {
      toast.error(`Failed to analyze image: ${error.message}`);
      setIsAnalyzing(false);
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setPreviewUrl(url);
        setImageUrl(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (!imageUrl || !query) {
      toast.error("Please upload an image and enter a question");
      return;
    }

    setIsAnalyzing(true);
    analyzeImageMutation.mutate({ imageUrl, query });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Analyze Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Upload Image
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-input"
              />
              <label htmlFor="image-input" className="cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
              </label>
            </div>
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="border border-slate-200 rounded-lg p-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Query Input */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              What would you like to know about this image?
            </label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., What is shown in this image? Describe the main elements..."
              className="min-h-24"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAnalyzing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={!imageUrl || !query || isAnalyzing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Analyze Image
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
