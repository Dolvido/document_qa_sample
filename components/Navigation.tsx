import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="border-b border-slate-200 dark:border-slate-800">
      <div className="container px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link 
            href="/"
            className="text-xl font-bold text-slate-900 dark:text-white"
          >
            Portfolio
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link
              href="/projects"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Projects
            </Link>
            <Link
              href="/about"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 