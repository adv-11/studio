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
import { analyzeCodeAndProvideReport } from "@/ai/flows/code-analysis"; // Ensure this path is correct
import type { AnalyzeCodeAndProvideReportInput } from "@/ai/flows/code-analysis"; // Ensure this path is correct

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


export function CodeInputForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<any>(null); // State to hold results

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: "github",
      githubUrl: "",
    },
  });

  const inputType = form.watch("inputType");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult(null); // Clear previous results
    console.log("Submitting values:", values);

    let analysisInput: AnalyzeCodeAndProvideReportInput = {};

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
            toast({
                variant: "destructive",
                title: "File Read Error",
                description: "Could not read the uploaded ZIP file.",
            });
            setIsLoading(false);
            return;
        }
    } else {
         toast({
            variant: "destructive",
            title: "Input Error",
            description: "Invalid input provided.",
        });
        setIsLoading(false);
        return;
    }


    try {
      // Call the Genkit flow
      const result = await analyzeCodeAndProvideReport(analysisInput);
      console.log("Analysis Result:", result);
      setAnalysisResult(result); // Store result - this should trigger update in AnalysisReport
      toast({
        title: "Analysis Complete",
        description: "Your code has been analyzed successfully.",
      });
       // TODO: Pass 'result' to the AnalysisReport component or manage state globally
       // For now, we'll just log it and show a success toast.
       // You'll likely need a state management solution (Context API, Zustand, etc.)
       // or pass the result down via props if AnalysisReport is a child here.


    } catch (error) {
      console.error("Analysis Error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: `An error occurred during analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
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
            <TabsTrigger value="github">
              <Github className="mr-2 h-4 w-4" /> GitHub URL
            </TabsTrigger>
            <TabsTrigger value="zip">
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
                    <Input placeholder="https://github.com/owner/repo" {...field} />
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
       {/* Temporary display of results - Replace with proper state management */}
       {/* {analysisResult && (
         <pre className="mt-4 p-4 bg-muted rounded-md overflow-x-auto text-sm">
           {JSON.stringify(analysisResult, null, 2)}
         </pre>
       )} */}
    </Form>
  );
}
