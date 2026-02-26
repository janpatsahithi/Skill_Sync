# app/api/rag.py

from fastapi import APIRouter
from app.models.rag_retriever import RAGRetriever
from app.models.llm_client import gemini_generate_json

router = APIRouter(prefix="/rag", tags=["RAG"])

retriever = RAGRetriever()


@router.post("/ask")
def ask_rag(query: str):
    docs = retriever.retrieve(query)

    prompt = f"""
Answer the question using the context below.

Context:
{docs}

Question:
{query}

Return plain text.
"""

    return {
        "answer": gemini_generate_json(prompt)
    }
