import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, MessageSquare, Trash2, Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch documents
  const { data: documents, isLoading, refetch } = trpc.documents.list.useQuery();

  // Upload mutation
  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully!");
      setIsUploadOpen(false);
      setSelectedFile(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF, TXT, or DOCX file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const fileType = selectedFile.name.endsWith(".pdf")
          ? "pdf"
          : selectedFile.name.endsWith(".docx")
            ? "docx"
            : "txt";

        await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileType: fileType as "pdf" | "txt" | "docx",
          fileData: base64,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.name || "User"}!</h1>
            <p className="text-slate-600 mt-2">Manage your documents and start intelligent conversations</p>
          </div>
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Documents</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{documents?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Active Chats</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Storage Used</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">0 MB</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Documents List */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Documents</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : documents && documents.length > 0 ? (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <FileText className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <button className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{doc.fileName}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    <Button
                      size="sm"
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        // Navigate to chat page
                        window.location.href = `/chat/${doc.id}`;
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Start Chat
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No documents yet</h3>
              <p className="text-slate-600 mb-6">Upload your first document to get started with AI-powered insights</p>
              <Button
                onClick={() => setIsUploadOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a PDF, TXT, or DOCX file to start analyzing with AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.txt,.docx"
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">
                  {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF, TXT, or DOCX up to 50MB</p>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
