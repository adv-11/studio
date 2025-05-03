
import { spawn, SpawnOptions } from 'child_process';
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
 * Attempts to execute a command and returns the process.
 * @param command The command executable (e.g., 'python3', 'python').
 * @param args Arguments for the command.
 * @param options Spawn options.
 * @returns The spawned process or null if the command is not found (ENOENT).
 */
function trySpawn(command: string, args: string[], options: SpawnOptions) {
    try {
        const process = spawn(command, args, options);
        process.on('error', (error: NodeJS.ErrnoException) => {
            // Only log if it's not an ENOENT error, as we handle that specifically
            if (error.code !== 'ENOENT') {
                console.error(`Error spawning command '${command}': ${error.message}`);
            }
        });
        return process;
    } catch (error: any) {
        // This catch block might be redundant if spawn itself throws, but included for safety
        console.error(`Unexpected error trying to spawn '${command}': ${error.message}`);
        return null;
    }
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
    const githubUrl = `https://github.com/${repository.owner}/${repository.repo}`;
    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_repo_content.py');
    const pythonExecutables = ['python3', 'python']; // Try 'python3' first, then 'python'

    if (!fs.existsSync(scriptPath)) {
        return reject(new Error(`Python script not found at ${scriptPath}. Ensure 'scripts/fetch_repo_content.py' exists.`));
    }

    let pythonProcess: ReturnType<typeof spawn> | null = null;
    let triedExecutables: string[] = [];

    for (const executable of pythonExecutables) {
        triedExecutables.push(executable);
        console.log(`Attempting to execute command: ${executable} ${scriptPath} for URL: ${githubUrl}`);
        pythonProcess = spawn(executable, [scriptPath, githubUrl]);

        let spawnFailedWithError: NodeJS.ErrnoException | null = null;

        // Temporarily listen for 'error' specifically for ENOENT check
        const errorListener = (error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') {
                console.warn(`Command '${executable}' not found. Trying next option...`);
                spawnFailedWithError = error;
                pythonProcess?.removeListener('error', errorListener); // Clean up listener
            } else {
                // For other errors, let the main error handler below catch them
                 spawnFailedWithError = error; // Store other errors too
                 pythonProcess?.removeListener('error', errorListener);
            }
        };
        pythonProcess.on('error', errorListener);


        // Need to wait briefly to see if the 'error' event fires for ENOENT
        // This is a bit hacky, ideally spawnSync or a more robust check would be better
        // Or refactor to use async/await with the error event. Let's try a slightly different structure.

         // Let's restructure to handle the error event more directly
         let stdoutData = '';
         let stderrData = '';
         let processExited = false;
         let processError: Error | null = null;

         const processPromise = new Promise<void>((procResolve, procReject) => {

             pythonProcess!.stdout.on('data', (data) => { stdoutData += data.toString(); });
             pythonProcess!.stderr.on('data', (data) => { stderrData += data.toString(); console.error(`[${executable}] script stderr: ${data}`); });

             pythonProcess!.on('close', (code) => {
                 processExited = true;
                 console.log(`[${executable}] script exited with code ${code}`);
                 if (code !== 0) {
                     processError = new Error(`Python script failed with code ${code}: ${stderrData || 'Unknown error'}`);
                 }
                 procResolve(); // Resolve even on error, we check processError later
             });

             pythonProcess!.on('error', (error: NodeJS.ErrnoException) => {
                  processExited = true;
                  console.error(`[${executable}] Failed to start script: ${error.message}`);
                  processError = error; // Store the error
                  procReject(error); // Reject the inner promise on spawn error
             });
         });


         return processPromise
             .then(() => {
                 // This block runs after 'close' or if 'error' occurred AND we caught it (which we don't here)
                 if (!processError) {
                     // Success with this executable
                     if (!stdoutData && stderrData) {
                         console.warn(`[${executable}] script finished successfully but produced only stderr warnings: ${stderrData}`);
                         resolve('');
                     } else if (!stdoutData) {
                          console.warn(`[${executable}] script produced no stdout output, though it exited successfully (code 0). No Python files might have been found.`);
                          resolve('');
                     } else {
                         console.log(`Successfully executed with '${executable}'.`);
                         resolve(stdoutData);
                     }
                     // IMPORTANT: Exit the loop and the main promise logic
                     return { success: true };
                 } else {
                      // Script failed for reasons other than ENOENT (handled by procReject)
                      console.error(`[${executable}] script failed during execution: ${processError.message}`);
                      // Continue loop to try next executable
                      return { success: false };
                 }

             })
             .catch((spawnError: NodeJS.ErrnoException) => {
                  // This block runs ONLY if the 'error' event fired during spawn (likely ENOENT)
                  if (spawnError.code === 'ENOENT') {
                       console.warn(`Command '${executable}' not found or failed to spawn. Trying next...`);
                       // Continue loop
                       return { success: false };
                  } else {
                       // Other spawn error, reject the main promise
                       reject(new Error(`Failed to start Python script '${executable}': ${spawnError.message}`));
                       return { success: true }; // Stop the loop
                  }
             })
             .then(({ success }) => {
                  if (success) {
                      // If resolved or rejected already, break the loop
                      return true; // Indicate loop should stop
                  }
                  // Otherwise, continue to next iteration
                  return false; // Indicate loop should continue
             });

    } // End of loop over executables

    // If loop finishes without resolving/rejecting, it means all executables failed (likely ENOENT)
    reject(new Error(`Failed to execute Python script. Tried: ${triedExecutables.join(', ')}. None were found or executable in the system's PATH. Please ensure Python 3 is installed and accessible.`));

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


    