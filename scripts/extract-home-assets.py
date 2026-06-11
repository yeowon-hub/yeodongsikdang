import os

import fitz
from PIL import Image

PDF = r"c:\Users\a9308\OneDrive\여동식당 홈화면.pdf"
OUT = r"c:\Users\a9308\yeodongsikdang\public\assets\home"
SCALE = 3

doc = fitz.open(PDF)
page = doc[0]
pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE))
os.makedirs(OUT, exist_ok=True)

mockup = os.path.join(OUT, "mockup.png")
pix.save(mockup)
img = Image.open(mockup)
print("mockup", img.size)

regions = {
    "header": (0, 0, 360, 72),
    "expiring-banner": (24, 78, 336, 205),
    "tile-fridge": (24, 218, 168, 398),
    "tile-kimchi": (192, 218, 336, 398),
    "tile-shelf": (24, 418, 168, 598),
    "tile-pantry": (192, 418, 336, 598),
    "tile-recipe": (24, 608, 336, 748),
    "logo": (24, 18, 150, 58),
}

for name, (x0, y0, x1, y1) in regions.items():
    box = (int(x0 * SCALE), int(y0 * SCALE), int(x1 * SCALE), int(y1 * SCALE))
    crop = img.crop(box)
    path = os.path.join(OUT, f"{name}.png")
    crop.save(path)
    print(name, crop.size)

for i, info in enumerate(page.get_images()):
    xref = info[0]
    base = doc.extract_image(xref)
    ext = base["ext"]
    path = os.path.join(OUT, f"embed-{i}.{ext}")
    with open(path, "wb") as f:
        f.write(base["image"])
    print("embed", i, base["width"], base["height"], ext)
