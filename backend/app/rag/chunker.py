import fitz  # PyMuPDF  lit les fichiers PDF et extrait le texte.
from typing import List


def extract_text_from_pdf(pdf_path: str) -> List[dict]:
    """Extrait le texte d'un PDF page par page."""
    
    # Ouvre le PDF avec PyMuPDF
    doc = fitz.open(pdf_path)
    pages = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()# Extrait le texte de la page
        if text.strip():  # Ignore les pages vides
            pages.append({
                "page_number": page_num + 1,
                "text": text.strip()# Ajoute le texte de la page à la liste
            })
    doc.close()
    return pages


def chunk_text(text: str,chunk_size: int = 500,overlap: int = 50) -> List[str]:
    """
    Découpe un texte en chunks avec overlap.
    chunk_size : nombre de mots par chunk
    overlap    : nombre de mots partagés entre chunks
    """
    words = text.split() # Divise en mots
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])# Rejoint les mots
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap # Avance avec overlap

    return chunks


def chunk_pdf(pdf_path: str) -> List[dict]:
    """
    Pipeline complet : PDF → pages → chunks.
    Retourne une liste de chunks avec métadonnées.
    """
    pages = extract_text_from_pdf(pdf_path)
    all_chunks = []
    chunk_index = 0

    for page in pages:
        chunks = chunk_text(page["text"])
        for chunk in chunks:
            all_chunks.append({
                "chunk_index": chunk_index,
                "page_number": page["page_number"],
                "text": chunk,
            })
            chunk_index += 1

    return all_chunks