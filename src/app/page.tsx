// src/app/page.tsx
"use client"; // Add this directive because we are using useState

import * as React from 'react';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { CodeInputForm } from '@/components/code-input-form';
import { AnalysisReport } from '@/components/analysis-report';
import { Separator } from '@/components/ui/separator';
import type { AnalyzeCodeAndProvideReportOutput } from "@/ai/flows/code-analysis";

// Note: Metadata export is generally for Server Components.
// Since we added "use client", this might behave differently or is better placed elsewhere
// if this page becomes purely client-rendered. For now, we leave it but acknowledge the change.
// export const metadata: Metadata = {
//   title: 'VibeRefactor | Analyze Your Code',
//   description: 'Upload your Python code via GitHub URL or ZIP file for AI-powered refactoring analysis.',
// };


export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeCodeAndProvideReportOutput | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      {/* Reduced vertical padding */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16 h-full">
          {/* Input Form Column */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Analyze Your Code
            </h2>
            <p className="text-muted-foreground">
              Enter a public GitHub repository URL or upload a ZIP file containing your Python code.
              Our AI agent will analyze it for code smells, design patterns, and suggest refactoring steps.
            </p>
            <CodeInputForm
              setIsLoading={setIsLoading}
              setAnalysisResult={setAnalysisResult}
              isLoading={isLoading}
            />
          </div>

          {/* Analysis Report Column - Added fixed height and overflow handling */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col h-[calc(100vh-160px)]"> {/* Adjust height based on header/footer */}
            <div className="p-6 flex-shrink-0">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                Refactoring Report
                </h2>
            </div>
            <Separator className="mb-0 flex-shrink-0" /> {/* Remove margin bottom */}
            {/* AnalysisReport will now use ScrollArea internally */}
            <div className="flex-grow overflow-hidden p-6 pt-0"> {/* Add padding here, remove from ScrollArea in child */}
                 <AnalysisReport reportData={analysisResult} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
      <footer className="py-4 border-t bg-secondary/50 flex-shrink-0"> {/* Reduced padding */}
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} VibeRefactor. Powered by AI.
        </div>
      </footer>
    </div>
  );
}
