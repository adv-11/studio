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
            {/* Pass state setters down to the form */}
            <CodeInputForm
              setIsLoading={setIsLoading}
              setAnalysisResult={setAnalysisResult}
              isLoading={isLoading} // Pass isLoading to disable button during analysis
            />
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-4">
              Refactoring Report
            </h2>
            <Separator className="mb-6" />
            {/* Pass state down to the report */}
            <AnalysisReport reportData={analysisResult} isLoading={isLoading} />
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
