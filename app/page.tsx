import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="border-b border-slate-700/50 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href="https://lukepayne.web.app/" className="text-xl font-semibold text-white">Portfolio</a>
          <div className="flex items-center gap-8">
            <a href="https://lukepayne.web.app/projects" className="text-slate-300 hover:text-white transition-colors">Projects</a>
            <a href="https://lukepayne.web.app/about" className="text-slate-300 hover:text-white transition-colors">About</a>
            <a href="https://lukepayne.web.app/contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Document Q&A Assistant</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Upload your documents and ask questions about them. Get accurate answers
            with proper citations.
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="tech-tag">Next.js</span>
            <span className="tech-tag">TypeScript</span>
            <span className="tech-tag">LangChain</span>
            <span className="tech-tag">AI</span>
            <span className="tech-tag">Document Analysis</span>
          </div>
        </header>

        <ChatInterface />
      </div>
    </main>
  );
} 