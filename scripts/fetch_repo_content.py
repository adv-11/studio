
# scripts/fetch_repo_content.py
import sys
import logging
from gitingest import GitIngestor, GitIngestionConfig

# Configure logging for gitingest (optional, but helpful for debugging)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('fetch_repo_content')

def fetch_python_content(repo_url: str) -> str:
    """
    Fetches the content of all .py files from a Git repository URL.

    Args:
        repo_url: The URL of the Git repository (e.g., https://github.com/owner/repo.git).

    Returns:
        A string containing the concatenated content of all Python files,
        separated by a specific marker, or an empty string if no Python files are found
        or an error occurs during ingestion.
    """
    try:
        # Configure gitingest to only include .py files
        config = GitIngestionConfig(
            include_patterns=["**/*.py"],  # Only include Python files
            # exclude_patterns=None,  # No specific exclusions needed for this case
            # branch=None, # Use default branch unless specified
        )

        # Create an ingestor instance
        ingestor = GitIngestor(config)

        logger.info(f"Starting ingestion for repository: {repo_url}")
        # Ingest the repository content based on the configuration
        ingested_content = ingestor.ingest(repo_url)
        logger.info(f"Ingestion complete. Found {len(ingested_content)} files matching criteria.")

        if not ingested_content:
            logger.warning(f"No Python files found or ingested from {repo_url}")
            return ""

        # Combine the content of all ingested Python files
        # Add a separator and file path information for clarity
        combined_content = ""
        separator = "\n\n--- FILE: {filepath} ---\n\n"
        for file_data in ingested_content:
            combined_content += separator.format(filepath=file_data.filepath)
            combined_content += file_data.content

        return combined_content

    except Exception as e:
        logger.error(f"Error during Git ingestion for {repo_url}: {e}", exc_info=True)
        # Optionally, raise the exception or return an error indicator
        # For this script, we'll print the error to stderr and return empty string
        print(f"Error fetching repository content: {e}", file=sys.stderr)
        return "" # Indicate failure by returning empty string


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python fetch_repo_content.py <repository_url>", file=sys.stderr)
        sys.exit(1)

    repository_url = sys.argv[1]
    # Validate URL basic format (optional but good practice)
    if not repository_url.startswith(("http://", "https://")) or not repository_url.endswith(".git"):
         # gitingest might handle non-.git URLs, but being explicit can help. Adjust if needed.
         logger.warning(f"URL {repository_url} might not be a standard clone URL. Attempting anyway.")
         # print(f"Error: Invalid repository URL format. Expected https://... .git", file=sys.stderr)
         # sys.exit(1)


    content = fetch_python_content(repository_url)

    if content:
        # Print the combined content to standard output
        print(content)
        logger.info("Successfully fetched and printed Python content.")
        sys.exit(0)
    else:
        # If content is empty (due to no files or an error logged in fetch_python_content)
        logger.error("Failed to fetch Python content or no Python files found.")
        sys.exit(1) # Exit with error code if no content was retrieved

