// src/app/page.tsx
"use client"; // Add this directive because we are using useState

import * as React from 'react';
import { Header } from '@/components/header';
import { CodeInputForm } from '@/components/code-input-form';
import { AnalysisReport } from '@/components/analysis-report';
import { Separator } from '@/components/ui/separator';
import type { AnalyzeCodeAndProvideReportOutput } from "@/ai/flows/code-analysis";

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeCodeAndProvideReportOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null); // Add error state

  const handleAnalysisStart = () => {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null); // Clear previous errors
  };

  const handleAnalysisComplete = (result: AnalyzeCodeAndProvideReportOutput | null, error?: string) => {
    setIsLoading(false);
    setAnalysisResult(result);
    setError(error || null); // Set error if present
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      {/* Reduced vertical padding */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        {/* Adjust main grid layout if needed */}
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
              // Pass handlers instead of direct setters
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
              isLoading={isLoading}
            />
             {error && ( // Display error message below the form
                <div className="mt-4 text-destructive text-sm p-4 border border-destructive/50 rounded-md bg-destructive/10">
                    <p><strong>Analysis Error:</strong> {error}</p>
                </div>
             )}
          </div>

          {/* Analysis Report Column - Ensure parent div allows flex-grow */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col h-[calc(100vh-160px)]"> {/* Adjust height if header/footer size changes */}
            <div className="p-6 flex-shrink-0">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                Refactoring Report
                </h2>
            </div>
            <Separator className="mb-0 flex-shrink-0" />
            {/* Content area - let AnalysisReport's ScrollArea handle scrolling */}
            <div className="flex-grow overflow-hidden p-6 pt-0"> {/* Padding moved here */}
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
