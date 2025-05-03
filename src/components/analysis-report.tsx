import * as React from 'react';
import { AlertCircle, Lightbulb, Download, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import type { AnalyzeCodeAndProvideReportOutput } from "@/ai/flows/code-analysis"; // Import the correct type

// Use the imported type directly
type AnalysisReportData = AnalyzeCodeAndProvideReportOutput;

interface AnalysisReportProps {
  reportData?: AnalysisReportData | null; // Allow null or undefined if no report yet
  isLoading?: boolean;
}

// Helper to get an icon for a category
const getCategoryIcon = (category: 'smell' | 'pattern' | 'step') => {
  switch (category) {
    case 'smell':
      return <AlertCircle className="h-5 w-5 text-destructive mr-2 flex-shrink-0" />;
    case 'pattern':
      return <Lightbulb className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />; // Using yellow for potential patterns
    case 'step':
      return <FileText className="h-5 w-5 text-accent mr-2 flex-shrink-0" />;
    default:
      return null;
  }
};


export function AnalysisReport({ reportData: propReportData, isLoading }: AnalysisReportProps) {
    const reportData = propReportData; // Directly use propReportData

    const hasData = !isLoading && reportData && (
        reportData.report ||
        (reportData.codeSmells && reportData.codeSmells.length > 0) ||
        (reportData.designPatterns && reportData.designPatterns.length > 0) ||
        (reportData.suggestedRefactoringSteps && reportData.suggestedRefactoringSteps.length > 0)
    );

    const handleDownloadTemplate = () => {
        // TODO: Implement download logic for the starter template
        alert("Download starter template functionality not yet implemented.");
        console.log("Download template requested for:", reportData?.starterTemplate);
    };

    const renderLoadingState = () => (
        <div className="space-y-6 p-1">
            {/* Skeleton for Summary Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
            </Card>

            {/* Skeletons for Accordion Items */}
            <div className="space-y-4">
                <div className="border-b">
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="border-b">
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="border-b">
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>

             {/* Skeleton for Download Button */}
            <div className="mt-6 text-center flex flex-col items-center">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-3 w-64 mt-2" />
            </div>
        </div>
    );

    const renderEmptyState = () => (
         <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
           <FileText size={48} className="mb-4 opacity-50" />
           <p className="text-lg">No Report Yet</p>
           <p>Submit code via the form on the left to generate a refactoring report.</p>
         </div>
    );

    const renderReportContent = () => (
        <div className="space-y-6">
            {reportData?.report && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Analysis Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground">{reportData.report}</p>
                    </CardContent>
                </Card>
            )}

            <Accordion type="multiple" defaultValue={['smells', 'steps', 'patterns']} className="w-full">
             {reportData?.codeSmells && reportData.codeSmells.length > 0 && (
                <AccordionItem value="smells">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    <div className="flex items-center w-full">
                         {getCategoryIcon('smell')}
                         <span className="flex-1 text-left">Detected Code Smells ({reportData.codeSmells.length})</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                    <ul className="space-y-2 pl-8 list-disc list-outside">
                        {reportData.codeSmells.map((smell, index) => (
                        <li key={`smell-${index}`} className="text-sm text-foreground">
                            {smell} - <a href={`https://refactoring.guru/smells/${smell.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Learn more</a>
                        </li>
                        ))}
                    </ul>
                    </AccordionContent>
                </AccordionItem>
                )}

                {reportData?.designPatterns && reportData.designPatterns.length > 0 && (
                <AccordionItem value="patterns">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">
                     <div className="flex items-center w-full">
                         {getCategoryIcon('pattern')}
                         <span className="flex-1 text-left">Identified Design Patterns / Opportunities ({reportData.designPatterns.length})</span>
                     </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                    <ul className="space-y-2 pl-8 list-disc list-outside">
                        {reportData.designPatterns.map((pattern, index) => (
                         <li key={`pattern-${index}`} className="text-sm text-foreground">
                            {pattern} - <a href={`https://refactoring.guru/design-patterns/${pattern.split(/[\s(]+/)[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Learn more</a>
                        </li>
                        ))}
                    </ul>
                    </AccordionContent>
                </AccordionItem>
                )}

                {reportData?.suggestedRefactoringSteps && reportData.suggestedRefactoringSteps.length > 0 && (
                <AccordionItem value="steps">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">
                    <div className="flex items-center w-full">
                        {getCategoryIcon('step')}
                        <span className="flex-1 text-left">Suggested Refactoring Steps ({reportData.suggestedRefactoringSteps.length})</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                    <ol className="space-y-3 pl-8 list-decimal list-outside">
                        {reportData.suggestedRefactoringSteps.map((step, index) => (
                        <li key={`step-${index}`} className="text-sm text-foreground">
                            {step}
                        </li>
                        ))}
                    </ol>
                    </AccordionContent>
                </AccordionItem>
                )}
            </Accordion>


          {reportData?.starterTemplate && (
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
    );


  return (
    <ScrollArea className="h-[calc(100vh-200px)] pr-4"> {/* Adjust height based on surrounding elements */}
        {isLoading
            ? renderLoadingState()
            : hasData
            ? renderReportContent()
            : renderEmptyState()
        }
    </ScrollArea>
  );
}
