import json
from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "datasets" / "esco_rag_docs.json"

class RagIndex:
    def __init__(self):
        self.client = chromadb.Client()
        self.collection = self.client.get_or_create_collection("esco_rag")
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

    def build(self):
        docs = json.loads(DATA.read_text())

        texts = [d["text"] for d in docs]
        ids = [f"{d['type']}_{i}" for i, d in enumerate(docs)]

        embeddings = self.embedder.encode(texts).tolist()

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
