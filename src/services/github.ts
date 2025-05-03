
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';

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
    // Construct the URL - gitingest might handle URLs without .git, but let's stick to the format if possible
    const githubUrl = `https://github.com/${repository.owner}/${repository.repo}`;
    // Ensure the scripts directory and Python script exist
    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_repo_content.py');
    const pythonExecutable = 'python3'; // Explicitly use python3

    if (!fs.existsSync(scriptPath)) {
        return reject(new Error(`Python script not found at ${scriptPath}. Ensure 'scripts/fetch_repo_content.py' exists.`));
    }

    console.log(`Executing command: ${pythonExecutable} ${scriptPath} for URL: ${githubUrl}`);
    // Execute the Python script
    // Ensure the PATH includes the directory containing 'python3' when the Node server runs
    const pythonProcess = spawn(pythonExecutable, [scriptPath, githubUrl], {
        // cwd: process.cwd(), // Usually implied, but can be explicit
        // env: process.env // Inherit environment variables
    });

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
         resolve(''); // Resolve with empty if no stdout but script succeeded with warnings
      }
       else if (!stdoutData) {
         console.warn(`Python script produced no stdout output, though it exited successfully (code 0). No Python files might have been found.`);
         resolve(''); // Resolve with empty string if no content was fetched but script succeeded
       }
      else {
        resolve(stdoutData);
      }
    });

    // Handle errors during process spawning (like ENOENT)
    pythonProcess.on('error', (error: NodeJS.ErrnoException) => {
      console.error(`Failed to start Python script '${pythonExecutable}': ${error.message}`);
      if (error.code === 'ENOENT') {
           reject(new Error(`Failed to start Python script. '${pythonExecutable}' command not found. Make sure Python 3 is installed and available in the system's PATH.`));
      } else {
           reject(new Error(`Failed to start Python script: ${error.message}`));
      }
    });
  });
}

/**
 * Processes a base64 encoded ZIP file data URI, extracts Python files,
 * and returns their concatenated content.
 *
 * @param zipFileBase64 The ZIP file content as a base64 encoded data URI.
 * @returns A promise that resolves to the concatenated content of Python files within the ZIP.
 */
export async function processZipFileContent(zipFileBase64: string): Promise<string> {
  console.log("Processing ZIP file content...");
  try {
    // Basic check for data URI format
    if (!zipFileBase64.startsWith('data:application/zip;base64,') && !zipFileBase64.startsWith('data:application/x-zip-compressed;base64,')) {
        console.warn("Unexpected ZIP MIME type in data URI:", zipFileBase64.substring(0, 50));
        // Attempt to proceed anyway, assuming it's base64 after the comma
    }

    const base64Data = zipFileBase64.split(',')[1];
    if (!base64Data) {
         throw new Error('Could not extract base64 data from ZIP file URI.');
    }

    console.log(`Decoding base64 data (length: ${base64Data.length})...`);
    const buffer = Buffer.from(base64Data, 'base64');

    console.log("Loading ZIP data using JSZip...");
    const zip = await JSZip.loadAsync(buffer);
    let combinedContent = "";
    const separator = "\n\n--- FILE: {filepath} ---\n\n";
    let pythonFilesFound = 0;

    // Iterate through files in the ZIP asynchronously
    const filePromises = Object.keys(zip.files).map(async (filepath) => {
      // Filter for Python files and ignore directories/mac metadata
      if (filepath.endsWith('.py') && !filepath.startsWith('__MACOSX/') && !zip.files[filepath].dir) {
        const file = zip.files[filepath];
        console.log(`Extracting content from: ${filepath}`);
        try {
            const content = await file.async('string');
            pythonFilesFound++;
            return separator.format({ filepath: filepath }) + content;
        } catch (readError) {
            console.error(`Error reading file ${filepath} from ZIP:`, readError);
            return ""; // Skip faulty files
        }

      }
      return ""; // Return empty string for non-python files/dirs
    });

    // Wait for all file reads to complete and combine results
    const contents = await Promise.all(filePromises);
    combinedContent = contents.join('');


    if (pythonFilesFound === 0) {
      console.warn("No Python (.py) files found in the uploaded ZIP archive.");
      return ""; // Return empty if no Python files found
    }

    console.log(`Successfully extracted content from ${pythonFilesFound} Python files in ZIP.`);
    return combinedContent;

  } catch(error) {
      console.error("Error processing ZIP file:", error);
      throw new Error(`Failed to process ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


// Helper extension for String prototype - format method (similar to Python's)
// Usage: "Hello {name}".format({ name: "World" }) -> "Hello World"
declare global {
  interface String {
    format(values: Record<string, any>): string;
  }
}

if (!String.prototype.format) {
  String.prototype.format = function(values: Record<string, any>): string {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let str = this.toString();
    if (values) {
      Object.keys(values).forEach(key => {
        const regexp = new RegExp(`\\{${key}\\}`, 'gi');
        str = str.replace(regexp, values[key]);
      });
    }
    return str;
  };
}


    