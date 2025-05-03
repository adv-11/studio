
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Represents a GitHub repository.
 */
export interface GitHubRepository {
  /**
   * The owner of the repository.
   */
  owner: string;
  /**
   * The name of the repository.
   */
  repo: string;
}

/**
 * Fetches the content of Python files from a GitHub repository using a Python script
 * that utilizes the 'gitingest' library.
 *
 * @param repository The GitHub repository details.
 * @returns A promise that resolves to the concatenated content of Python files or rejects with an error.
 */
export async function fetchRepositoryContent(repository: GitHubRepository): Promise<string> {
  return new Promise((resolve, reject) => {
    const githubUrl = `https://github.com/${repository.owner}/${repository.repo}.git`;
    // Ensure the scripts directory and Python script exist
    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_repo_content.py');

    if (!fs.existsSync(scriptPath)) {
        return reject(new Error(`Python script not found at ${scriptPath}. Ensure 'scripts/fetch_repo_content.py' exists.`));
    }

    console.log(`Executing Python script: ${scriptPath} for URL: ${githubUrl}`);
    // Execute the Python script
    const pythonProcess = spawn('python3', [scriptPath, githubUrl]);

    let stdoutData = '';
    let stderrData = '';

    // Capture standard output
    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    // Capture standard error
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`Python script stderr: ${data}`); // Log stderr immediately
    });

    // Handle script exit
    pythonProcess.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);
      if (code !== 0) {
        console.error(`Python script failed. Stderr: ${stderrData}`);
        reject(new Error(`Python script failed with code ${code}: ${stderrData || 'Unknown error'}`));
      } else if (stderrData && !stdoutData) {
        // Sometimes gitingest might log warnings to stderr but still succeed
        console.warn(`Python script finished with warnings: ${stderrData}`);
        // Attempt to resolve with empty string if no stdout, but log warning
         resolve(''); // Or reject depending on expected behavior for warnings
         // reject(new Error(`Python script finished with warnings: ${stderrData}`));
      }
       else if (!stdoutData) {
         console.warn(`Python script produced no output (stdout).`);
         resolve(''); // Resolve with empty string if no content was fetched but script succeeded
       }
      else {
        resolve(stdoutData);
      }
    });

    // Handle errors during process spawning
    pythonProcess.on('error', (error) => {
      console.error(`Failed to start Python script: ${error.message}`);
      reject(new Error(`Failed to start Python script: ${error.message}`));
    });
  });
}

// Placeholder for ZIP file processing - implement if needed
export async function processZipFileContent(zipFileBase64: string): Promise<string> {
  console.warn("ZIP file processing is not yet implemented.");
  // TODO: Implement logic to decode base64, extract ZIP, read relevant files
  try {
    // Basic check for data URI format
    if (!zipFileBase64.startsWith('data:')) {
        throw new Error('Invalid data URI format for ZIP file.');
    }
    // Placeholder: Decode base64 (actual extraction/reading needed)
    const base64Data = zipFileBase64.split(',')[1];
    if (!base64Data) {
         throw new Error('Could not extract base64 data from ZIP file URI.');
    }
    // const buffer = Buffer.from(base64Data, 'base64');
    // Use a library like 'jszip' to process the buffer
    // Example:
    // const JSZip = require('jszip');
    // const zip = await JSZip.loadAsync(buffer);
    // let combinedContent = '';
    // for (const filename of Object.keys(zip.files)) {
    //   if (filename.endsWith('.py')) { // Filter for Python files
    //     const file = zip.files[filename];
    //     if (!file.dir) {
    //       combinedContent += await file.async('string') + '\n\n---\n\n'; // Add separator
    //     }
    //   }
    // }
    // return combinedContent;
     return `Content from uploaded ZIP file (processing not fully implemented). Length: ${base64Data.length}`;

  } catch(error) {
      console.error("Error processing ZIP file:", error);
      throw new Error(`Failed to process ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
