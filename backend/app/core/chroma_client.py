import json
import logging
from pathlib import Path

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = logging.getLogger(__name__)

DATA = Path(__file__).resolve().parents[1] / "datasets" / "esco_rag_docs.json"
BATCH_SIZE = 1000

_chroma_store = None


class ChromaStore:
    def __init__(self):
        persist_dir = Path(settings.CHROMA_PERSIST_DIRECTORY)
        persist_dir.mkdir(parents=True, exist_ok=True)

        self.client = chromadb.PersistentClient(
            path=str(persist_dir),
            settings=Settings(anonymized_telemetry=False),
        )
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.collection = self.client.get_or_create_collection("esco-rag")
        self._ensure_loaded()

    def _ensure_loaded(self):
        try:
            current_count = self.collection.count()
        except Exception:
            current_count = 0

        if current_count > 0:
            logger.info("Chroma store already initialized with %s documents.", current_count)
            return

        docs = json.loads(DATA.read_text(encoding="utf-8"))
        texts = [d.get("text", "") for d in docs if d.get("text")]
        ids = [str(d.get("id")) for d in docs if d.get("text") and d.get("id")]

        if not texts or not ids:
            logger.warning("No RAG documents found to seed Chroma store.")
            return

        logger.info("Chroma store empty. Rebuilding embeddings into %s", settings.CHROMA_PERSIST_DIRECTORY)
        embeddings = self.embedder.encode(texts, convert_to_numpy=True, show_progress_bar=True)

        for i in range(0, len(texts), BATCH_SIZE):
            self.collection.add(
                documents=texts[i:i + BATCH_SIZE],
                ids=ids[i:i + BATCH_SIZE],
                embeddings=embeddings[i:i + BATCH_SIZE],
            )

        logger.info("Loaded %s ESCO docs into Chroma.", len(texts))


def get_chroma_store() -> ChromaStore:
    global _chroma_store
    if _chroma_store is None:
        _chroma_store = ChromaStore()
    return _chroma_store
