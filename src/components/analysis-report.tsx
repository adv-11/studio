import * as React from 'react';
import { AlertCircle, Lightbulb, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AnalyzeCodeAndProvideReportOutput } from "@/ai/flows/code-analysis"; // Import the correct type

// Use the imported type directly
type AnalysisReportData = AnalyzeCodeAndProvideReportOutput;

interface AnalysisReportProps {
  reportData?: AnalysisReportData | null; // Allow null or undefined if no report yet
  isLoading?: boolean;
}

// Mock data for demonstration purposes when no reportData is passed (can be removed or kept for testing)
// const mockReportData: AnalysisReportData = {
//   report: "Initial analysis indicates several areas for improvement, particularly around method length and class cohesion. Applying suggested refactorings could enhance maintainability.",
//   codeSmells: ["Long Method", "Large Class", "Feature Envy"],
//   designPatterns: ["Factory Method (Potential)", "Observer (Consideration)"],
//   suggestedRefactoringSteps: [
//     "Extract Method: Break down `process_data` into smaller, focused functions.",
//     "Move Method: Relocate `calculate_metrics` to the `MetricsCalculator` class.",
//     "Introduce Parameter Object: Consolidate `user_id`, `session_id`, `timestamp` into a `RequestContext` object.",
//     "Replace Conditional with Polymorphism: Refactor `if/elif` block handling different report types using Strategy pattern.",
//   ],
//   starterTemplate: "placeholder_template_id" // Example
// };

// Helper to get an icon for a category
const getCategoryIcon = (category: 'smell' | 'pattern' | 'step') => {
  switch (category) {
    case 'smell':
      return <AlertCircle className="h-5 w-5 text-destructive mr-2" />;
    case 'pattern':
      return <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />; // Using yellow for potential patterns
    case 'step':
      return <FileText className="h-5 w-5 text-accent mr-2" />;
    default:
      return null;
  }
};


export function AnalysisReport({ reportData: propReportData, isLoading }: AnalysisReportProps) {
    // Use propReportData if available, otherwise null
    const reportData = isLoading ? null : (propReportData || null);

    const hasData = reportData && (
        reportData.report ||
        (reportData.codeSmells && reportData.codeSmells.length > 0) ||
        (reportData.designPatterns && reportData.designPatterns.length > 0) ||
        (reportData.suggestedRefactoringSteps && reportData.suggestedRefactoringSteps.length > 0)
    );

    const handleDownloadTemplate = () => {
        // TODO: Implement download logic for the starter template
        // This might involve calling another Genkit flow (generateStarterTemplate)
        // with relevant info (e.g., refactoring steps, language choice)
        // and then handling the base64 zip data.
        alert("Download starter template functionality not yet implemented.");
        console.log("Download template requested for:", reportData?.starterTemplate);
    };


  return (
    <ScrollArea className="h-[60vh] pr-4"> {/* Adjust height as needed */}
     {isLoading ? (
        <div className="flex justify-center items-center h-full">
           {/* Optional: Add a spinner */}
          <p className="text-muted-foreground animate-pulse">Analyzing code...</p>
        </div>
      ) : !hasData ? (
         <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
           <FileText size={48} className="mb-4 opacity-50" />
           <p>Submit code via the form to see the refactoring report here.</p>
         </div>
      ) : (
        <div className="space-y-6">
            {reportData.report && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Analysis Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground">{reportData.report}</p>
                    </CardContent>
                </Card>
            )}

            <Accordion type="multiple" defaultValue={['smells', 'steps', 'patterns']} className="w-full"> {/* Add 'patterns' to default */}
             {reportData.codeSmells && reportData.codeSmells.length > 0 && (
                <AccordionItem value="smells">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    <div className="flex items-center">
                         {getCategoryIcon('smell')} Detected Code Smells ({reportData.codeSmells.length})
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                    <ul className="space-y-2 pl-4 list-disc list-inside">
                        {reportData.codeSmells.map((smell, index) => (
                        <li key={`smell-${index}`} className="text-sm text-foreground">
                            {smell} - <a href={`https://refactoring.guru/smells/${smell.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Learn more</a>
                        </li>
                        ))}
                    </ul>
                    </AccordionContent>
                </AccordionItem>
                )}

                {reportData.designPatterns && reportData.designPatterns.length > 0 && (
                <AccordionItem value="patterns">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">
                     <div className="flex items-center">
                         {getCategoryIcon('pattern')} Identified Design Patterns / Opportunities ({reportData.designPatterns.length})
                     </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                    <ul className="space-y-2 pl-4 list-disc list-inside">
                        {reportData.designPatterns.map((pattern, index) => (
                         <li key={`pattern-${index}`} className="text-sm text-foreground">
                            {/* Adjust link generation if needed, this is a basic attempt */}
                            {pattern} - <a href={`https://refactoring.guru/design-patterns/${pattern.split(/[\s(]+/)[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Learn more</a>
                        </li>
                        ))}
                    </ul>
                    </AccordionContent>
                </AccordionItem>
                )}

                {reportData.suggestedRefactoringSteps && reportData.suggestedRefactoringSteps.length > 0 && (
                <AccordionItem value="steps">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    <div className="flex items-center">
                        {getCategoryIcon('step')} Suggested Refactoring Steps ({reportData.suggestedRefactoringSteps.length})
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                    <ol className="space-y-3 pl-4 list-decimal list-inside">
                        {reportData.suggestedRefactoringSteps.map((step, index) => (
                        <li key={`step-${index}`} className="text-sm text-foreground">
                            {step}
                            {/* Optionally add 'Learn more' links if refactoring names are reliably extractable */}
                        </li>
                        ))}
                    </ol>
                    </AccordionContent>
                </AccordionItem>
                )}
            </Accordion>


          {reportData.starterTemplate && (
            <div className="mt-6 text-center">
              <Button onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Download Starter Template
              </Button>
               <p className="text-xs text-muted-foreground mt-2">
                 A basic project structure to help you apply these suggestions.
               </p>
            </div>
          )}
        </div>
      )}
    </ScrollArea>
  );
}
