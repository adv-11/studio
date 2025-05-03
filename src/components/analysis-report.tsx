import * as React from 'react';
import { AlertCircle, Lightbulb, Download, FileText, Loader2, BrainCircuit, SearchCode, Bug, Wrench, ClipboardCheck } from 'lucide-react';
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

type DisplayState = 'idle' | 'loading' | 'animating' | 'showingReport' | 'error';

const animationSteps = [
  { text: "Initializing analysis...", icon: BrainCircuit },
  { text: "Scanning files...", icon: SearchCode },
  { text: "Detecting code smells...", icon: Bug },
  { text: "Identifying design patterns...", icon: Lightbulb },
  { text: "Suggesting improvements...", icon: Wrench },
  { text: "Finalizing report...", icon: ClipboardCheck },
];
const ANIMATION_STEP_DURATION = 1500; // 1.5 seconds per step

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
    const [displayState, setDisplayState] = React.useState<DisplayState>('idle');
    const [currentAnimationStep, setCurrentAnimationStep] = React.useState(0);
    const animationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        // Clear any existing animation timeouts on prop changes
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = null;
        }

        if (isLoading) {
            setDisplayState('loading');
            setCurrentAnimationStep(0); // Reset animation step
        } else if (propReportData) {
            // Start animation sequence
            setDisplayState('animating');
            setCurrentAnimationStep(0);
            animationTimeoutRef.current = setTimeout(runAnimation, ANIMATION_STEP_DURATION);
        } else {
            setDisplayState('idle'); // No data, not loading -> idle
             // If there was an error previously, might need another state or flag
        }

        // Cleanup function to clear timeout if component unmounts during animation
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, propReportData]); // Rerun effect when loading or data changes

    const runAnimation = () => {
        setCurrentAnimationStep(prevStep => {
            const nextStep = prevStep + 1;
            if (nextStep < animationSteps.length) {
                // Continue animation
                animationTimeoutRef.current = setTimeout(runAnimation, ANIMATION_STEP_DURATION);
                return nextStep;
            } else {
                // Animation finished, show report
                setDisplayState('showingReport');
                return prevStep; // Keep the last step index (or reset)
            }
        });
    };


    const handleDownloadTemplate = () => {
        // TODO: Implement download logic for the starter template
        alert("Download starter template functionality not yet implemented.");
        console.log("Download template requested for:", propReportData?.starterTemplate);
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
            {propReportData?.starterTemplate && ( // Only show if template might exist
                <div className="mt-6 text-center flex flex-col items-center">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-3 w-64 mt-2" />
                </div>
            )}
        </div>
    );

    const renderAnimatingState = () => {
        const step = animationSteps[currentAnimationStep];
        const Icon = step.icon;
        return (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6 space-y-4">
               <Icon size={48} className="mb-4 opacity-75 animate-pulse text-accent" />
               <p className="text-lg font-medium">{step.text}</p>
               <Loader2 className="h-6 w-6 animate-spin" />
             </div>
        );
    };


    const renderEmptyState = () => (
         <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
           <FileText size={48} className="mb-4 opacity-50" />
           <p className="text-lg">No Report Yet</p>
           <p>Submit code via the form on the left to generate a refactoring report.</p>
         </div>
    );

    const renderReportContent = () => {
        if (!propReportData) return renderEmptyState(); // Should not happen if state is showingReport, but safety check

        // Basic Markdown-like formatting for the main report (split by newlines)
        const reportParagraphs = propReportData.report
                                    ?.split('\n')
                                    .map(para => para.trim())
                                    .filter(para => para.length > 0) || [];

        return (
            <div className="space-y-6">
                {reportParagraphs.length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Analysis Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {reportParagraphs.map((paragraph, index) => (
                                <p key={`report-para-${index}`} className="text-sm text-foreground leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Accordion type="multiple" defaultValue={['smells', 'steps', 'patterns']} className="w-full">
                 {propReportData.codeSmells && propReportData.codeSmells.length > 0 && (
                    <AccordionItem value="smells">
                        <AccordionTrigger className="text-lg font-medium hover:no-underline">
                        <div className="flex items-center w-full">
                             {getCategoryIcon('smell')}
                             <span className="flex-1 text-left">Detected Code Smells ({propReportData.codeSmells.length})</span>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                        <ul className="space-y-2 pl-8 list-disc list-outside">
                            {propReportData.codeSmells.map((smell, index) => (
                            <li key={`smell-${index}`} className="text-sm text-foreground">
                                {smell} - <a href={`https://refactoring.guru/smells/${smell.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Learn more</a>
                            </li>
                            ))}
                        </ul>
                        </AccordionContent>
                    </AccordionItem>
                    )}

                    {propReportData.designPatterns && propReportData.designPatterns.length > 0 && (
                    <AccordionItem value="patterns">
                        <AccordionTrigger className="text-lg font-medium hover:no-underline">
                         <div className="flex items-center w-full">
                             {getCategoryIcon('pattern')}
                             <span className="flex-1 text-left">Identified Design Patterns / Opportunities ({propReportData.designPatterns.length})</span>
                         </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                        <ul className="space-y-2 pl-8 list-disc list-outside">
                            {propReportData.designPatterns.map((pattern, index) => (
                             <li key={`pattern-${index}`} className="text-sm text-foreground">
                                {pattern} - <a href={`https://refactoring.guru/design-patterns/${pattern.split(/[\s(]+/)[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Learn more</a>
                            </li>
                            ))}
                        </ul>
                        </AccordionContent>
                    </AccordionItem>
                    )}

                    {propReportData.suggestedRefactoringSteps && propReportData.suggestedRefactoringSteps.length > 0 && (
                    <AccordionItem value="steps">
                        <AccordionTrigger className="text-lg font-medium hover:no-underline">
                        <div className="flex items-center w-full">
                            {getCategoryIcon('step')}
                            <span className="flex-1 text-left">Suggested Refactoring Steps ({propReportData.suggestedRefactoringSteps.length})</span>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                        <ol className="space-y-3 pl-8 list-decimal list-outside">
                            {propReportData.suggestedRefactoringSteps.map((step, index) => (
                            <li key={`step-${index}`} className="text-sm text-foreground">
                                {step}
                            </li>
                            ))}
                        </ol>
                        </AccordionContent>
                    </AccordionItem>
                    )}
                </Accordion>


              {propReportData.starterTemplate && (
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
    };

    const renderContentBasedOnState = () => {
        switch (displayState) {
            case 'loading':
                return renderLoadingState();
            case 'animating':
                return renderAnimatingState();
            case 'showingReport':
                return renderReportContent();
            case 'idle':
            default:
                return renderEmptyState();
        }
    };


  return (
    // Adjust height calculation if necessary based on header/footer/padding changes in page.tsx
    <ScrollArea className="h-[calc(100%-1rem)] pr-4"> {/* Reduce height slightly if needed */}
       {renderContentBasedOnState()}
    </ScrollArea>
  );
}
