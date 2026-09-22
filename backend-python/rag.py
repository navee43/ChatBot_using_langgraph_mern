"""
RAG (retrieval-augmented generation) support for the chatbot.

Uploaded files are split into chunks and stored in a local Chroma vector
store, tagged with the thread_id of the conversation they were uploaded
in. The `search_uploaded_documents` tool searches only within the calling
conversation's own files - it can't see another thread's documents.

No API key is needed here: embeddings run locally on CPU (a small
sentence-transformers model), and Chroma stores its data in a folder on
disk (./chroma_db) rather than a separate database service.
"""

from io import BytesIO

from pypdf import PdfReader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain.tools import tool, ToolRuntime

# Runs locally - no API calls, no rate limits. The first call downloads
# the model (roughly 90MB) and is slower; later calls are fast.
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

vector_store = Chroma(
    collection_name="chatbot_documents",
    embedding_function=embeddings,
    persist_directory="./chroma_db",
)

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)

SUPPORTED_EXTENSIONS = {"pdf", "txt"}


def _extract_text(filename: str, raw: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        reader = PdfReader(BytesIO(raw))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == "txt":
        return raw.decode("utf-8", errors="ignore")

    raise ValueError(
        f"Unsupported file type: .{ext or 'unknown'} "
        f"(supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))})"
    )


def ingest_file(filename: str, raw: bytes, thread_id: str) -> int:
    """Extract text from an uploaded file, split it into chunks, and store
    those chunks in the vector store tagged with this conversation's
    thread_id. Returns the number of chunks stored. Runs synchronously/
    CPU-bound - call it through a thread pool from async code."""
    text = _extract_text(filename, raw)
    if not text.strip():
        raise ValueError("No readable text was found in this file")

    chunks = splitter.split_text(text)
    docs = [
        Document(
            page_content=chunk,
            metadata={"thread_id": thread_id, "source": filename},
        )
        for chunk in chunks
    ]
    vector_store.add_documents(docs)
    return len(docs)


@tool
def search_uploaded_documents(query: str, runtime: ToolRuntime) -> str:
    """Search the file(s) the user has uploaded in this conversation for
    information relevant to the query. Use this whenever the user asks
    about "the file", "the document", "the PDF/text I uploaded", or
    anything that likely needs the content of an attached file."""
    thread_id = (runtime.config or {}).get("configurable", {}).get("thread_id")
    if not thread_id:
        return "No conversation thread is available to search."

    results = vector_store.similarity_search(
        query, k=4, filter={"thread_id": thread_id}
    )
    if not results:
        return (
            "No uploaded documents were found for this conversation, "
            "or nothing relevant matched the query."
        )

    return "\n\n---\n\n".join(
        f"(from {d.metadata.get('source', 'an uploaded file')}):\n{d.page_content}"
        for d in results
    )