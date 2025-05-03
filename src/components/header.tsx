import Link from 'next/link';
import { Code } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Code className="h-6 w-6 text-accent" />
          <span className="text-lg font-semibold text-foreground">VibeRefactor</span>
        </Link>
        {/* Add navigation items here if needed in the future */}
        {/* <nav>...</nav> */}
      </div>
    </header>
  );
}
