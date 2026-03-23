from typing import List

from app.core.chroma_client import get_chroma_store


class ChromaStore:
    """Central vector store wrapper for RAG."""

    def __init__(self):
        shared = get_chroma_store()
        self.client = shared.client
        self.embedder = shared.embedder
        self.collection = shared.collection

    def add_documents(
        self,
        texts: List[str],
        metadatas: List[dict] | None = None,
        ids: List[str] | None = None,
    ):
        if not texts:
            return

        if not ids:
            ids = [str(i) for i in range(len(texts))]

        embeddings = self.embedder.encode(texts, convert_to_numpy=True)
        self.collection.add(
            documents=texts,
            metadatas=metadatas,
            ids=ids,
            embeddings=embeddings,
        )

    def query(self, query: str, k: int = 4):
        query_embedding = self.embedder.encode([query], convert_to_numpy=True)
        results = self.collection.query(query_embeddings=query_embedding, n_results=k)
        return results.get("documents", [[]])[0]

    def clear(self):
        self.client.delete_collection(self.collection.name)
        self.collection = self.client.get_or_create_collection(name=self.collection.name)
