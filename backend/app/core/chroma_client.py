import json
from pathlib import Path
from sentence_transformers import SentenceTransformer
import chromadb

DATA = Path(__file__).resolve().parents[1] / "datasets" / "esco_rag_docs.json"
BATCH_SIZE = 1000

_chroma_store = None  # singleton


class ChromaStore:
    def __init__(self):
        self.client = chromadb.Client()
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.collection = self.client.get_or_create_collection("esco-rag")
        self._load()

    def _load(self):
        docs = json.loads(DATA.read_text(encoding="utf-8"))

        texts = [d["text"] for d in docs]
        ids = [d["id"] for d in docs]

        embeddings = self.embedder.encode(
            texts,
            convert_to_numpy=True,
            show_progress_bar=True
        )

        for i in range(0, len(texts), BATCH_SIZE):
            self.collection.add(
                documents=texts[i:i + BATCH_SIZE],
                ids=ids[i:i + BATCH_SIZE],
                embeddings=embeddings[i:i + BATCH_SIZE]
            )

        print(f"✅ Loaded {len(texts)} ESCO docs into Chroma")


def get_chroma_store() -> ChromaStore:
    global _chroma_store
    if _chroma_store is None:
        _chroma_store = ChromaStore()
    return _chroma_store
