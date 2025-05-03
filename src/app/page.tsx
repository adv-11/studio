import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { CodeInputForm } from '@/components/code-input-form';
import { AnalysisReport } from '@/components/analysis-report';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'VibeRefactor | Analyze Your Code',
  description: 'Upload your Python code via GitHub URL or ZIP file for AI-powered refactoring analysis.',
};


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Analyze Your Code
            </h2>
            <p className="text-muted-foreground">
              Enter a public GitHub repository URL or upload a ZIP file containing your Python code.
              Our AI agent will analyze it for code smells, design patterns, and suggest refactoring steps.
            </p>
            <CodeInputForm />
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-4">
              Refactoring Report
            </h2>
            <Separator className="mb-6" />
            <AnalysisReport />
          </div>
        </div>
      </main>
      <footer className="py-6 border-t bg-secondary/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} VibeRefactor. Powered by AI.
        </div>
      </footer>
    </div>
  );
}
