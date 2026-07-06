import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ArrowRight, FileText, MessageSquare, Zap, Image, Mic, Sparkles, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users to dashboard
  if (isAuthenticated && !loading) {
    navigate("/dashboard");
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const features = [
    {
      icon: FileText,
      title: "Smart Document Upload",
      description: "Upload PDFs, TXT, and DOCX files. Automatic text extraction and intelligent chunking for RAG.",
    },
    {
      icon: MessageSquare,
      title: "AI-Powered Chat",
      description: "Ask questions about your documents. Get instant, context-aware answers powered by advanced LLMs.",
    },
    {
      icon: Zap,
      title: "Lightning-Fast Retrieval",
      description: "Semantic search with embeddings. Find relevant information in seconds, not minutes.",
    },
    {
      icon: Image,
      title: "Visual Summaries",
      description: "Generate beautiful infographic-style summaries. Download and share insights instantly.",
    },
    {
      icon: Mic,
      title: "Voice Input",
      description: "Speak your questions. Whisper-powered transcription converts speech to text seamlessly.",
    },
    {
      icon: Sparkles,
      title: "Image Analysis",
      description: "Upload images and ask questions. Vision-capable AI analyzes visual content deeply.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Lumina
            </span>
          </div>
          <a href={getLoginUrl()}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign In
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
              Your AI Document
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Intelligence Platform
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Upload documents, ask questions, get instant insights. Powered by advanced RAG, streaming LLMs, and multi-modal AI.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-lg border-slate-300 hover:bg-slate-50"
            >
              View Demo
            </Button>
          </motion.div>

          {/* Hero Image Placeholder */}
          <motion.div
            variants={itemVariants}
            className="pt-12 rounded-2xl overflow-hidden shadow-2xl"
            style={{ perspective: 1000 }}
          >
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 aspect-video flex items-center justify-center border border-slate-200">
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="w-16 h-16 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-cyan-600" />
                  </div>
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <p className="text-slate-600 font-medium">Dashboard Preview</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to master your documents with AI
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-8 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors mb-4">
                    <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* Trust Section */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-cyan-50"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
              <p className="text-slate-600">Secure & Private</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">Real-time</div>
              <p className="text-slate-600">Streaming Responses</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">Multi-modal</div>
              <p className="text-slate-600">Text, Image, Voice</p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div variants={itemVariants}>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Ready to Transform Your Documents?
            </h2>
            <p className="text-xl text-slate-600">
              Start exploring the power of AI-driven document intelligence today.
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto text-center text-slate-600">
          <p>&copy; 2026 Lumina AI. Built with ❤️ for document intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
