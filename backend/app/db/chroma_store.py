# app/db/chroma_store.py

from typing import List
import chromadb
from chromadb.config import Settings


class ChromaStore:
    """
    Central vector store wrapper for RAG.
    """

    def __init__(
        self,
        persist_dir: str = "chroma_db",
        collection_name: str = "rag_documents",
    ):
        self.client = chromadb.Client(
            Settings(
                persist_directory=persist_dir,
                anonymized_telemetry=False,
            )
        )

        self.collection = self.client.get_or_create_collection(
            name=collection_name
        )

    # -------------------------
    # ADD DOCUMENTS
    # -------------------------
    def add_documents(
        self,
        texts: List[str],
        metadatas: List[dict] | None = None,
        ids: List[str] | None = None,
    ):
        if not ids:
            ids = [str(i) for i in range(len(texts))]

        self.collection.add(
            documents=texts,
            metadatas=metadatas,
            ids=ids,
        )

    # -------------------------
    # QUERY DOCUMENTS
    # -------------------------
    def query(self, query: str, k: int = 4):
        results = self.collection.query(
            query_texts=[query],
            n_results=k
        )
        return results.get("documents", [[]])[0]


    # -------------------------
    # CLEAR COLLECTION (DEV USE)
    # -------------------------
    def clear(self):
        self.client.delete_collection(self.collection.name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection.name
        )
