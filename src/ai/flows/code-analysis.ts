
// src/ai/flows/code-analysis.ts
'use server';
/**
 * @fileOverview A code analysis AI agent that detects code smells, design patterns, and suggests refactoring steps.
 *
 * - analyzeCodeAndProvideReport - A function that handles the code analysis process.
 * - AnalyzeCodeAndProvideReportInput - The input type for the analyzeCodeAndProvideReport function.
 * - AnalyzeCodeAndProvideReportOutput - The return type for the analyzeCodeAndProvideReport function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {fetchRepositoryContent, GitHubRepository, processZipFileContent} from '@/services/github'; // Updated import

const AnalyzeCodeAndProvideReportInputSchema = z.object({
  githubRepoUrl: z
    .string()
    .url({ message: "Invalid GitHub URL format."}) // Added URL validation
    .optional()
    .describe('The URL of the GitHub repository to analyze.'),
  zipFileBase64: z
    .string()
    .optional()
    .describe(
      'The ZIP file containing the code to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
}).refine(data => data.githubRepoUrl || data.zipFileBase64, { // Ensure at least one input is provided
  message: "Either a GitHub URL or a ZIP file must be provided.",
  path: ["inputType"], // Arbitrary path, maybe adjust based on form structure
});
export type AnalyzeCodeAndProvideReportInput = z.infer<
  typeof AnalyzeCodeAndProvideReportInputSchema
>;

const AnalyzeCodeAndProvideReportOutputSchema = z.object({
  report: z.string().describe('The detailed refactoring report.'),
  codeSmells: z.array(z.string()).describe('The detected code smells.'),
  designPatterns: z.array(z.string()).describe('The identified design patterns.'),
  suggestedRefactoringSteps: z
    .array(z.string())
    .describe('The suggested refactoring steps.'),
  // starterTemplate field removed as per previous iteration, re-add if needed
});
export type AnalyzeCodeAndProvideReportOutput = z.infer<
  typeof AnalyzeCodeAndProvideReportOutputSchema
>;

export async function analyzeCodeAndProvideReport(
  input: AnalyzeCodeAndProvideReportInput
): Promise<AnalyzeCodeAndProvideReportOutput> {
  // Basic input validation at the flow entry point
  if (!input.githubRepoUrl && !input.zipFileBase64) {
      throw new Error("No input provided. Please supply a GitHub URL or upload a ZIP file.");
  }
  return analyzeCodeAndProvideReportFlow(input);
}

const refactorGuruTool = ai.defineTool({
  name: 'refactorGuruLookup',
  description: 'Lookup information about refactoring techniques, design patterns, and code smells from refactoring.guru. Use this to provide more context or examples for identified issues.',
  inputSchema: z.object({
    query: z.string().describe('The specific code smell, design pattern, or refactoring technique to lookup (e.g., "Long Method", "Factory Method", "Extract Method").'),
  }),
  outputSchema: z.string().describe('A summary of information found on refactoring.guru for the query.'),
},
async input => {
  // TODO: Implement actual lookup via scraping or searching refactoring.guru
  // This remains a placeholder.
  console.log(`[refactorGuruLookup Tool] Received query: ${input.query}`);
  // Simulate finding some information
  const baseUrl = "https://refactoring.guru";
  let foundInfo = `Placeholder information for '${input.query}' from refactoring.guru.`;
  if (input.query.toLowerCase().includes("smell")) {
      foundInfo += ` Code smells often indicate deeper problems in the code structure. Check ${baseUrl}/smells for details.`;
  } else if (input.query.toLowerCase().includes("pattern")) {
       foundInfo += ` Design patterns are reusable solutions to common problems. See ${baseUrl}/design-patterns for examples.`;
  } else if (input.query.toLowerCase().includes("refactoring")) {
       foundInfo += ` Refactoring improves code structure without changing external behavior. Explore techniques at ${baseUrl}/refactoring/techniques.`;
  }
  return foundInfo;
});

const prompt = ai.definePrompt({
  name: 'analyzeCodeAndProvideReportPrompt',
  tools: [refactorGuruTool],
  input: {
    schema: z.object({
      codeContext: z.string().describe('The Python code content fetched from the repository or ZIP file.'),
      sourceDescription: z.string().describe('Description of the source (e.g., GitHub URL or ZIP filename).') // Added source description
    }),
  },
  output: {
    // Use the existing schema, removing starterTemplate if not needed
    schema: AnalyzeCodeAndProvideReportOutputSchema.omit({ starterTemplate: true }),
  },
  prompt: `You are an expert Python software engineer specializing in code refactoring and identifying code quality issues.

  Analyze the following Python code provided below, sourced from '{{{sourceDescription}}}'.

  Your task is to provide a detailed refactoring report including:
  1.  **Detected Code Smells:** Identify specific code smells present (e.g., Long Method, Large Class, Duplicated Code, Data Clumps, Feature Envy). Be specific about *where* they might occur if possible, based on the provided code snippets.
  2.  **Identified Design Patterns:** Recognize any design patterns used (correctly or incorrectly) or suggest where patterns like Factory, Singleton, Strategy, Observer, etc., could be beneficially applied.
  3.  **Suggested Refactoring Steps:** Propose concrete refactoring steps (e.g., Extract Method, Move Method, Replace Conditional with Polymorphism, Introduce Parameter Object). Prioritize steps that address the most significant identified smells.

  Use the 'refactorGuruLookup' tool *only if necessary* to get concise definitions or brief examples for specific smells, patterns, or refactoring techniques you mention in your report to add clarity. Do not overuse the tool; rely on your expertise first.

  Code to Analyze:
  \`\`\`python
  {{{codeContext}}}
  \`\`\`

  Format your response strictly as a JSON object matching the expected output schema (report, codeSmells, designPatterns, suggestedRefactoringSteps). The 'report' field should contain a concise summary of your findings.
  `,
});

const analyzeCodeAndProvideReportFlow = ai.defineFlow<
  typeof AnalyzeCodeAndProvideReportInputSchema,
  typeof AnalyzeCodeAndProvideReportOutputSchema // Use the correct output schema
>(
  {
    name: 'analyzeCodeAndProvideReportFlow',
    inputSchema: AnalyzeCodeAndProvideReportInputSchema,
    outputSchema: AnalyzeCodeAndProvideReportOutputSchema, // Use the correct output schema
  },
  async input => {
    let codeContext = '';
    let sourceDescription = '';

    if (input.githubRepoUrl) {
      sourceDescription = `GitHub repository: ${input.githubRepoUrl}`;
      console.log(`Processing ${sourceDescription}`);
      try {
        const url = new URL(input.githubRepoUrl);
        const parts = url.pathname.split('/').filter(Boolean);

        if (parts.length < 2) { // Allow for URLs like github.com/owner/repo/tree/branch
          throw new Error('Invalid GitHub repository URL format. Expected owner/repo.');
        }

        const owner = parts[0];
        const repo = parts[1].replace('.git', ''); // Remove .git if present

        const repoInfo: GitHubRepository = {owner: owner, repo: repo};
        codeContext = await fetchRepositoryContent(repoInfo); // Use the updated service function

        if (!codeContext) {
            console.warn(`fetchRepositoryContent returned empty for ${input.githubRepoUrl}. Proceeding with empty context.`);
            // Optionally, throw an error or return a specific message
            // throw new Error("Failed to fetch any Python code from the repository.");
        } else {
             console.log(`Successfully fetched code content (length: ${codeContext.length}) from ${input.githubRepoUrl}`);
        }

      } catch (error: any) {
        console.error(`Error fetching or processing repository ${input.githubRepoUrl}:`, error);
        // Rethrow or handle appropriately - maybe return a structured error in the report?
        throw new Error(`Failed to process repository ${input.githubRepoUrl}: ${error.message}`);
        // Alternatively, set codeContext to an error message for the LLM:
        // codeContext = `Error: Could not fetch or process code from the repository ${input.githubRepoUrl}. Reason: ${error.message}`;
        // sourceDescription += " (Error during processing)";
      }
    } else if (input.zipFileBase64) {
       sourceDescription = `Uploaded ZIP file`; // TODO: Extract filename if possible later
       console.log(`Processing ${sourceDescription}`);
       try {
            codeContext = await processZipFileContent(input.zipFileBase64); // Use the new ZIP processing function
            if (!codeContext) {
                 console.warn(`processZipFileContent returned empty. Proceeding with empty context.`);
            } else {
                console.log(`Successfully processed code content (length: ${codeContext.length}) from ZIP file.`);
            }
       } catch (error: any) {
           console.error(`Error processing ZIP file:`, error);
           throw new Error(`Failed to process uploaded ZIP file: ${error.message}`);
           // codeContext = `Error: Could not process the uploaded ZIP file. Reason: ${error.message}`;
           // sourceDescription += " (Error during processing)";
       }
    } else {
      // This case should ideally be prevented by the refine check or earlier validation
      console.error("Flow started without githubRepoUrl or zipFileBase64.");
      throw new Error("Internal error: No code input provided to the flow.");
      // codeContext = 'Error: No code source provided.';
      // sourceDescription = 'Unknown source';
    }

    // Handle cases where fetching/processing resulted in an error message *within* codeContext
    // (if choosing not to throw errors earlier)
    if (codeContext.startsWith('Error:')) {
         console.error("Analysis skipped due to previous error:", codeContext);
         // Return a structured error response instead of calling the LLM
          return {
            report: `Analysis skipped. ${codeContext}`,
            codeSmells: [],
            designPatterns: [],
            suggestedRefactoringSteps: [],
          };
    }
     if (!codeContext.trim()) {
         console.warn("Code context is empty. Analysis might yield limited results.");
          return {
            report: `Analysis could not proceed. No Python code found in the provided source (${sourceDescription}). Please check the repository/ZIP file.`,
            codeSmells: [],
            designPatterns: [],
            suggestedRefactoringSteps: [],
          };
     }


    console.log(`Calling LLM prompt with code context (length: ${codeContext.length}) and source: ${sourceDescription}`);
    const {output} = await prompt({codeContext: codeContext, sourceDescription: sourceDescription});

    if (!output) {
        console.error("LLM prompt returned no output.");
        throw new Error("Analysis failed: The AI model did not return a response.");
    }

    console.log("LLM analysis successful.");
    // Ensure the output matches the flow's output schema (important if starterTemplate was removed from prompt but not flow)
    // If starterTemplate might exist in the output but shouldn't, delete it:
    // delete (output as any).starterTemplate;


    // Ensure all required fields are present, provide defaults if necessary (though zod schema should handle this)
    const finalOutput: AnalyzeCodeAndProvideReportOutput = {
        report: output.report ?? "No summary report provided.",
        codeSmells: output.codeSmells ?? [],
        designPatterns: output.designPatterns ?? [],
        suggestedRefactoringSteps: output.suggestedRefactoringSteps ?? [],
        // starterTemplate: output.starterTemplate // Include if starterTemplate is part of the flow output schema
    };

    return finalOutput; // Return the structured output
  }
);
