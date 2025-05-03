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
import {cloneRepository, GitHubRepository} from '@/services/github';

const AnalyzeCodeAndProvideReportInputSchema = z.object({
  githubRepoUrl: z
    .string()
    .optional()
    .describe('The URL of the GitHub repository to analyze.'),
  zipFileBase64: z
    .string()
    .optional()
    .describe(
      'The ZIP file containing the code to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
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
  starterTemplate: z.string().optional().describe('The generated starter template.'),
});
export type AnalyzeCodeAndProvideReportOutput = z.infer<
  typeof AnalyzeCodeAndProvideReportOutputSchema
>;

export async function analyzeCodeAndProvideReport(
  input: AnalyzeCodeAndProvideReportInput
): Promise<AnalyzeCodeAndProvideReportOutput> {
  return analyzeCodeAndProvideReportFlow(input);
}

const refactorGuruTool = ai.defineTool({
  name: 'refactorGuruLookup',
  description: 'Lookup information about refactoring techniques, design patterns, and code smells from refactoring.guru.',
  inputSchema: z.object({
    query: z.string().describe('The search query to lookup on refactoring.guru.'),
  }),
  outputSchema: z.string(),
},
async input => {
  // TODO: Implement the lookup of information from refactoring.guru based on the query.
  // This is a placeholder implementation.
  return `Information from refactoring.guru for query: ${input.query}`;
});

const prompt = ai.definePrompt({
  name: 'analyzeCodeAndProvideReportPrompt',
  tools: [refactorGuruTool],
  input: {
    schema: z.object({
      codeContext: z.string().describe('The code to be analyzed.'),
    }),
  },
  output: {
    schema: z.object({
      report: z.string().describe('The detailed refactoring report.'),
      codeSmells: z.array(z.string()).describe('The detected code smells.'),
      designPatterns: z.array(z.string()).describe('The identified design patterns.'),
      suggestedRefactoringSteps: z
        .array(z.string())
        .describe('The suggested refactoring steps.'),
      starterTemplate: z.string().optional().describe('The generated starter template.'),
    }),
  },
  prompt: `You are an expert software engineer specializing in code refactoring.

  Analyze the following code and provide a detailed refactoring report, including:

  - Detected code smells (e.g., Long Method, Large Class, Data Clumps).
  - Identified design patterns (e.g., Singleton, Factory, Observer).
  - Suggested refactoring steps (e.g., Extract Method, Move Method, Inline Class).

  Here is the code:
  \`\`\`
  {{{codeContext}}}
  \`\`\`

  Please use the refactorGuruLookup tool to get more information about specific refactoring techniques, design patterns, or code smells when needed.

  Format your response as a JSON object.
  `,
});

const analyzeCodeAndProvideReportFlow = ai.defineFlow<
  typeof AnalyzeCodeAndProvideReportInputSchema,
  typeof AnalyzeCodeAndProvideReportOutputSchema
>(
  {
    name: 'analyzeCodeAndProvideReportFlow',
    inputSchema: AnalyzeCodeAndProvideReportInputSchema,
    outputSchema: AnalyzeCodeAndProvideReportOutputSchema,
  },
  async input => {
    let codeContext = '';

    if (input.githubRepoUrl) {
      try {
        const url = new URL(input.githubRepoUrl);
        const parts = url.pathname.split('/').filter(Boolean);

        if (parts.length !== 2) {
          throw new Error('Invalid GitHub repository URL format.');
        }

        const owner = parts[0];
        const repo = parts[1];

        const repoInfo: GitHubRepository = {owner: owner, repo: repo};
        const clonedRepoPath = await cloneRepository(repoInfo);

        // TODO: Read the code from the cloned repository.
        codeContext = `Code from repository ${input.githubRepoUrl} at ${clonedRepoPath}`;
      } catch (error) {
        console.error('Error cloning repository:', error);
        codeContext = `Error: Could not process the repository ${input.githubRepoUrl}. ${error}`;
      }
    } else if (input.zipFileBase64) {
      // TODO: Implement the logic to handle ZIP file uploads.
      codeContext = `Code from uploaded ZIP file.`;
    } else {
      codeContext = 'No code provided.';
    }

    const {output} = await prompt({codeContext: codeContext});
    return output!;
  }
);

