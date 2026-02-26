# app/models/rag_retriever.py

from app.db.chroma_store import ChromaStore


class RAGRetriever:
    def __init__(self):
        self.store = ChromaStore()

    def retrieve(self, query: str, k: int = 4) -> list[str]:
        return self.store.query(query, k)


# Backward-compatible helper
def retrieve_docs(query: str, k: int = 4) -> list[str]:
    return RAGRetriever().retrieve(query, k)
