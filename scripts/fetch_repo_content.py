
# scripts/fetch_repo_content.py
import sys
import logging
from gitingest import ingest # Use the simpler ingest function

# Configure logging (optional, but helpful for debugging)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('fetch_repo_content')

def fetch_python_content(repo_url: str) -> str:
    """
    Fetches the content of all .py files from a Git repository URL using gitingest.ingest.

    Args:
        repo_url: The URL of the Git repository (e.g., https://github.com/owner/repo.git or https://github.com/owner/repo).

    Returns:
        A string containing the concatenated content of all Python files,
        separated by a specific marker, or an empty string if no Python files are found
        or an error occurs during ingestion.
    """
    try:
        logger.info(f"Starting ingestion for repository: {repo_url}")

        # Use gitingest.ingest directly
        # It returns summary, tree, content
        # We are interested in content, which is expected to be a dict {filepath: file_content}
        summary, tree, content_dict = ingest(repo_url)

        logger.info(f"Ingestion complete. Summary: {summary}. Found {len(content_dict)} total files.")

        if not content_dict:
            logger.warning(f"No files found or ingested from {repo_url}")
            return ""

        # Filter for Python files and combine their content
        combined_content = ""
        separator = "\n\n--- FILE: {filepath} ---\n\n"
        python_files_found = 0
        for filepath, file_content in content_dict.items():
            if filepath.endswith(".py"):
                combined_content += separator.format(filepath=filepath)
                combined_content += file_content
                python_files_found += 1

        if python_files_found == 0:
            logger.warning(f"No Python (.py) files found in the ingested content from {repo_url}")
            return ""

        logger.info(f"Extracted content from {python_files_found} Python files.")
        return combined_content

    except Exception as e:
        logger.error(f"Error during Git ingestion for {repo_url}: {e}", exc_info=True)
        # Print the error to stderr and return empty string
        print(f"Error fetching repository content: {e}", file=sys.stderr)
        return "" # Indicate failure

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python fetch_repo_content.py <repository_url>", file=sys.stderr)
        sys.exit(1)

    repository_url = sys.argv[1]
    # Basic validation - gitingest might handle various URL formats
    if not repository_url.startswith(("http://", "https://")):
         logger.warning(f"URL {repository_url} might not be a standard clone URL. Attempting anyway.")

    content = fetch_python_content(repository_url)

    if content:
        # Print the combined content to standard output
        print(content)
        logger.info("Successfully fetched and printed Python content.")
        sys.exit(0)
    else:
        # If content is empty (due to no files, no Python files, or an error logged)
        logger.error("Failed to fetch Python content or no Python files found.")
        sys.exit(1) # Exit with error code

    