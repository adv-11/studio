// Use server directive is required for Genkit flows.
'use server';
/**
 * @fileOverview Generates a starter template with a README based on refactoring suggestions.
 *
 * - generateStarterTemplate - A function that generates the starter template.
 * - GenerateStarterTemplateInput - The input type for the generateStarterTemplate function.
 * - GenerateStarterTemplateOutput - The return type for the generateStarterTemplate function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateStarterTemplateInputSchema = z.object({
  refactoringSteps: z
    .string()
    .describe('The refactoring steps suggested by the analysis.'),
  language: z
    .string()
    .describe('The programming language for the starter template (e.g., Python, JavaScript).'),
  framework: z.string().describe('The framework to use (e.g., FastAPI, React)'),
});
export type GenerateStarterTemplateInput = z.infer<
  typeof GenerateStarterTemplateInputSchema
>;

const GenerateStarterTemplateOutputSchema = z.object({
  templateZip: z
    .string()
    .describe(
      'A zip file containing the starter template, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  readmeContent: z.string().describe('The content of the README file.'),
});
export type GenerateStarterTemplateOutput = z.infer<
  typeof GenerateStarterTemplateOutputSchema
>;

export async function generateStarterTemplate(
  input: GenerateStarterTemplateInput
): Promise<GenerateStarterTemplateOutput> {
  return generateStarterTemplateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStarterTemplatePrompt',
  input: {
    schema: z.object({
      refactoringSteps: z
        .string()
        .describe('The refactoring steps suggested by the analysis.'),
      language: z
        .string()
        .describe(
          'The programming language for the starter template (e.g., Python, JavaScript).'
        ),
      framework: z.string().describe('The framework to use (e.g., FastAPI, React)'),
    }),
  },
  output: {
    schema: z.object({
      templateZip: z
        .string()
        .describe(
          'A zip file containing the starter template, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
        ),
      readmeContent: z.string().describe('The content of the README file.'),
    }),
  },
  prompt: `You are an expert software architect who helps developers get started with refactoring their code.

  Based on the following refactoring steps, generate a starter template ZIP file and a README file.

  Refactoring Steps: {{{refactoringSteps}}}
  Language: {{{language}}}
  Framework: {{{framework}}}

  The templateZip should be a zip file containing the basic structure for the project.
  The readmeContent should contain instructions and best practices for the developer to follow when implementing the refactoring steps.
  Ensure the zip file is returned as a data URI, and the README content is plain text.
  `,
});

const generateStarterTemplateFlow = ai.defineFlow<
  typeof GenerateStarterTemplateInputSchema,
  typeof GenerateStarterTemplateOutputSchema
>(
  {
    name: 'generateStarterTemplateFlow',
    inputSchema: GenerateStarterTemplateInputSchema,
    outputSchema: GenerateStarterTemplateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
