# Lumina AI Knowledge Studio

A **production-ready, premium AI document intelligence platform** that combines RAG (Retrieval-Augmented Generation), multi-modal AI, and elegant design for seamless document analysis and conversation.

## 🌟 Features

### Core Capabilities
- **📄 Document Management** - Upload and organize PDFs, TXT, and DOCX files
- **💬 RAG-Powered Chat** - Ask questions about documents with AI-powered context retrieval
- **🎙️ Voice Input** - Speak your questions; Whisper API transcribes to text
- **🖼️ Image Analysis** - Upload images and ask questions using vision-capable LLMs
- **✨ Document Summarization** - One-click AI summaries with key insights
- **🎨 Visual Summaries** - AI-generated infographic-style summary cards (downloadable)

### Premium UX
- **Animated Landing Page** - Hero section with feature highlights and CTAs
- **Manus OAuth** - Secure, seamless authentication
- **Dashboard** - Personalized workspace with document library and stats
- **Multi-Turn Chat** - Streaming responses with markdown rendering
- **Skeleton Loaders** - Professional loading states throughout
- **Responsive Design** - Works beautifully on desktop, tablet, and mobile

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript for type safety
- **TailwindCSS 4** for responsive, utility-first styling
- **Framer Motion** for smooth animations and transitions
- **tRPC** for end-to-end type-safe API communication
- **Wouter** for lightweight client-side routing

### Backend
- **Node.js + Express** for the server runtime
- **tRPC 11** for type-safe RPC procedures
- **Drizzle ORM** for database management
- **TiDB** (MySQL-compatible) for data persistence

### AI & Storage
- **LLM Integration** - Streaming chat completions with context
- **Vision API** - Image analysis with gpt-4o
- **Voice Transcription** - Whisper API for audio-to-text
- **Image Generation** - AI-powered visual summaries
- **S3 Storage** - Cloud file persistence

## 📋 Database Schema

```
users
├── id (PK)
├── openId (unique, Manus OAuth)
├── name, email, loginMethod
├── role (user | admin)
└── timestamps

documents
├── id (PK)
├── userId (FK)
├── fileName, fileType (pdf | txt | docx)
├── storageKey (S3 reference)
├── textContent (extracted text)
├── summary
├── fileSize
└── timestamps

chats
├── id (PK)
├── userId (FK)
├── documentId (FK)
├── title
└── timestamps

messages
├── id (PK)
├── chatId (FK)
├── role (user | assistant)
├── content
└── timestamps

documentChunks
├── id (PK)
├── documentId (FK)
├── chunkIndex
├── text (chunk content)
└── timestamps

visualSummaries
├── id (PK)
├── userId (FK)
├── documentId (FK)
├── imageUrl (S3 reference)
├── storageKey
├── prompt
└── timestamps
```

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- pnpm 10+
- Manus account with OAuth configured
- S3 bucket for file storage

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
# (Manus provides these automatically in deployment)

# Run database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Start development server
pnpm dev
```

### Building for Production

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

## 📖 API Routes (tRPC)

### Documents
- `documents.list` - Get all user documents
- `documents.get` - Get a specific document
- `documents.upload` - Upload a new document (PDF, TXT, DOCX)

### Chats
- `chats.listByDocument` - Get chats for a document
- `chats.create` - Create a new chat session
- `chats.get` - Get chat details

### Messages
- `messages.list` - Get messages in a chat
- `messages.send` - Send a message and get RAG response

### AI Features
- `summarize` - Generate document summary
- `generateVisualSummary` - Create infographic-style summary
- `analyzeImage` - Analyze uploaded image with vision API
- `transcribeVoice` - Transcribe audio to text

## 🎨 Design System

### Color Palette
- **Primary** - Blue (#2563eb)
- **Secondary** - Cyan (#06b6d4)
- **Neutral** - Slate (#64748b)
- **Success** - Green (#10b981)
- **Error** - Red (#ef4444)

### Typography
- **Headings** - Bold, high contrast
- **Body** - Clear, readable sans-serif
- **Code** - Monospace for technical content

### Spacing
- Base unit: 4px (Tailwind)
- Consistent padding/margin throughout
- Responsive breakpoints: sm (640px), md (768px), lg (1024px)

## 🔒 Security

- **OAuth 2.0** - Manus OAuth for secure authentication
- **Type Safety** - TypeScript prevents runtime errors
- **Input Validation** - Zod schemas for all API inputs
- **File Validation** - Content-based file type checking
- **Database Security** - Parameterized queries via Drizzle
- **HTTPS** - All communications encrypted

## 📊 Performance

- **Streaming Responses** - Real-time LLM output
- **Lazy Loading** - Code splitting and dynamic imports
- **Image Optimization** - Responsive images with proper sizing
- **Caching** - Browser and server-side caching strategies
- **Database Indexing** - Optimized queries on userId, documentId

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 📝 Development Workflow

1. **Create feature branch** - `git checkout -b feature/my-feature`
2. **Make changes** - Update code, add tests
3. **Run tests** - Ensure all tests pass
4. **Format code** - `pnpm format`
5. **Commit** - `git commit -m "feat: description"`
6. **Push** - `git push origin feature/my-feature`
7. **Create PR** - Request review

## 🐛 Troubleshooting

### PDF extraction fails
- Ensure pdf-parse is installed: `pnpm add pdf-parse`
- Check file is valid PDF (starts with %PDF)

### DOCX extraction fails
- Ensure mammoth is installed: `pnpm add mammoth`
- Check file is valid DOCX (ZIP archive)

### Voice transcription errors
- Check microphone permissions in browser
- Ensure audio is clear and not too long
- Verify Whisper API is accessible

### Image analysis not working
- Ensure image URL is publicly accessible
- Check image format is supported (PNG, JPG, GIF, WebP)
- Verify vision API credentials

## 📚 Resources

- [Manus Documentation](https://docs.manus.im)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM Documentation](https://orm.drizzle.team)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## 📞 Support

For issues, questions, or feature requests, please:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Contact support at support@lumina.ai

---

**Built with ❤️ for document intelligence**
