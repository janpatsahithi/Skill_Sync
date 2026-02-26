# app/models/rag_retriever.py

from app.core.chroma_client import get_chroma_store


class RAGRetriever:
    """
    Thin wrapper around Chroma for RAG retrieval
    """

    def __init__(self):
        self.store = get_chroma_store()
        self.collection = self.store.collection

    def retrieve(self, query: str, top_k: int = 5) -> list[str]:
        """
        Retrieve relevant documents for a query
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )

        documents = results.get("documents", [[]])[0]
        return documents
