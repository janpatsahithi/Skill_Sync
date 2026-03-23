import json
from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer
from app.core.config import settings

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "datasets" / "esco_rag_docs.json"

class RagIndex:
    def __init__(self):
        persist_dir = Path(settings.CHROMA_PERSIST_DIRECTORY)
        persist_dir.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(persist_dir))
        self.collection = self.client.get_or_create_collection("esco_rag")
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

    def build(self):
        docs = json.loads(DATA.read_text())
        if self.collection.count() > 0:
            return

        texts = [d["text"] for d in docs]
        ids = [f"{d['type']}_{i}" for i, d in enumerate(docs)]

        embeddings = self.embedder.encode(texts, convert_to_numpy=True).tolist()

        self.collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings
        )

        print("✅ RAG index built:", len(texts), "documents")

    def query(self, text: str, k: int = 3):
        emb = self.embedder.encode([text]).tolist()
        results = self.collection.query(
            query_embeddings=emb,
            n_results=k
        )
        return results["documents"][0]
