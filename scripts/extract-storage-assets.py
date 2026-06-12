"""보관함 페이지 PDF/목업에서 에셋 추출 (일반냉장고.pdf 401×800)"""
import os
import shutil

import fitz
from PIL import Image

SCALE = 2
DESIGN_W = 401

PDF_CANDIDATES = [
    r"c:\Users\a9308\OneDrive\여동식당 일반냉장고.zip",
]
OUT = r"c:\Users\a9308\yeodongsikdang\public\assets\storage"
REF = r"c:\Users\a9308\yeodongsikdang\public\assets\fridge-ref"

os.makedirs(os.path.join(OUT, "general"), exist_ok=True)

mockup_path = os.path.join(REF, "mockup.png")
if not os.path.exists(mockup_path):
    for root, _, files in os.walk(REF):
        for f in files:
            if f.lower().endswith(".pdf"):
                doc = fitz.open(os.path.join(root, f))
                page = doc[0]
                pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE))
                pix.save(mockup_path)
                break

if os.path.exists(os.path.join(REF, "FRIDGE.png")):
    shutil.copy(
        os.path.join(REF, "FRIDGE.png"),
        os.path.join(OUT, "general", "title.png"),
    )

print("storage assets ready under", OUT)
