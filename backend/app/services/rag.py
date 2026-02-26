import logging
from app.models.rag_retriever import RAGRetriever
from app.models.llm_client import generate

logger = logging.getLogger(__name__)
retriever = RAGRetriever()


def generate_rag_answer(question: str) -> dict:
    """
    RAG pipeline:
    1. Retrieve relevant ESCO docs from Chroma
    2. Send them + question to Gemini
    3. Return grounded answer
    """
    try:
        docs = retriever.retrieve(question, k=5)

        if not docs:
            logger.warning(f"No documents retrieved for question: {question}")
            return {
                "question": question,
                "answer": "I couldn't find relevant information to answer your question. Please try rephrasing.",
                "sources": []
            }

        context = "\n\n".join(docs)

        prompt = f"""
You are a career guidance assistant.

Use ONLY the context below to answer the question.

Context:
{context}

Question:
{question}

Answer clearly and concisely.
"""

        answer = generate(prompt)

        return {
            "question": question,
            "answer": answer,
            "sources": docs
        }
    except Exception as e:
        logger.error(f"Error generating RAG answer: {e}")
        return {
            "question": question,
            "answer": f"Error processing your question: {str(e)}",
            "sources": []
        }
