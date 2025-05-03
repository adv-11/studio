"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Github, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { analyzeCodeAndProvideReport } from "@/ai/flows/code-analysis";
import type { AnalyzeCodeAndProvideReportInput, AnalyzeCodeAndProvideReportOutput } from "@/ai/flows/code-analysis";

// Define the schema for the form
const formSchema = z.object({
  inputType: z.enum(["github", "zip"]),
  githubUrl: z.string().url({ message: "Please enter a valid GitHub URL." }).optional(),
  zipFile: z.instanceof(File).optional(),
}).refine(data => {
    if (data.inputType === 'github') {
      return !!data.githubUrl;
    }
    if (data.inputType === 'zip') {
      return !!data.zipFile;
    }
    return false;
  }, {
    message: "Please provide either a GitHub URL or upload a ZIP file.",
    path: ["inputType"], // Attach error to a relevant field or create a general one
});

// Define props interface to accept state setters from parent
interface CodeInputFormProps {
    // Callback when analysis starts
    onAnalysisStart: () => void;
    // Callback when analysis completes (successfully or with error)
    onAnalysisComplete: (result: AnalyzeCodeAndProvideReportOutput | null, error?: string) => void;
    isLoading: boolean; // Receive isLoading to disable button
}

export function CodeInputForm({ onAnalysisStart, onAnalysisComplete, isLoading }: CodeInputFormProps) {
  const { toast } = useToast();
  // isLoading and analysisResult state are now managed by the parent (Home component)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: "github",
      githubUrl: "",
    },
  });

  const inputType = form.watch("inputType");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    onAnalysisStart(); // Notify parent that analysis is starting
    console.log("Submitting values:", values);

    let analysisInput: AnalyzeCodeAndProvideReportInput = {};
    let errorMessage: string | undefined = undefined;

    if (values.inputType === 'github' && values.githubUrl) {
        analysisInput.githubRepoUrl = values.githubUrl;
    } else if (values.inputType === 'zip' && values.zipFile) {
        try {
            const fileContentBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(values.zipFile!);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
            });
            analysisInput.zipFileBase64 = fileContentBase64;
        } catch (error) {
            console.error("Error reading file:", error);
            errorMessage = "Could not read the uploaded ZIP file.";
            toast({
                variant: "destructive",
                title: "File Read Error",
                description: errorMessage,
            });
            onAnalysisComplete(null, errorMessage); // Notify parent of error
            return;
        }
    } else {
         errorMessage = "Invalid input provided. Please select a source and provide the required information.";
         toast({
            variant: "destructive",
            title: "Input Error",
            description: errorMessage,
        });
        onAnalysisComplete(null, errorMessage); // Notify parent of error
        return;
    }


    try {
      // Call the Genkit flow
      const result = await analyzeCodeAndProvideReport(analysisInput);
      console.log("Analysis Result:", result);
      onAnalysisComplete(result); // Notify parent with the result
      toast({
        title: "Analysis Complete",
        description: "Your code has been analyzed successfully.",
      });

    } catch (error) {
      console.error("Analysis Error:", error);
      errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
      onAnalysisComplete(null, errorMessage); // Notify parent of error
      // Error message is now displayed in the parent component
      // toast({
      //   variant: "destructive",
      //   title: "Analysis Failed",
      //   description: `An error occurred during analysis: ${errorMessage}`,
      // });
    }
    // finally block removed as parent handles isLoading state via callbacks
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs
          value={inputType}
          onValueChange={(value) => form.setValue("inputType", value as "github" | "zip")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="github" disabled={isLoading}>
              <Github className="mr-2 h-4 w-4" /> GitHub URL
            </TabsTrigger>
            <TabsTrigger value="zip" disabled={isLoading}>
              <Upload className="mr-2 h-4 w-4" /> Upload ZIP
            </TabsTrigger>
          </TabsList>
          <TabsContent value="github" className="pt-4">
            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public GitHub Repository URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/owner/repo" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    Enter the URL of a public Python repository.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="zip" className="pt-4">
             <FormField
                control={form.control}
                name="zipFile"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                    <FormLabel>Upload ZIP File</FormLabel>
                    <FormControl>
                        <Input
                        type="file"
                        accept=".zip"
                        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                        {...rest}
                        disabled={isLoading}
                        />
                    </FormControl>
                    <FormDescription>
                        Upload a ZIP archive containing your Python code.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Analyzing..." : "Analyze Code"}
        </Button>
      </form>
       {/* Removed temporary display */}
    </Form>
  );
}
