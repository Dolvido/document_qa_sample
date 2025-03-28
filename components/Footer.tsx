export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-600 dark:text-slate-400 text-sm">
            © {new Date().getFullYear()} Your Name. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              LinkedIn
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 