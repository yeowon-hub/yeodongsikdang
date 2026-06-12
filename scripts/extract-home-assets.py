import os

import fitz
from PIL import Image

PDF = r"c:\Users\a9308\OneDrive\여동식당 홈화면.pdf"
OUT = r"c:\Users\a9308\yeodongsikdang\public\assets"
SCALE = 4

# PDF artboard 360×800, header 0–72
BODY_TOP = 72
BODY_BOTTOM = 728

doc = fitz.open(PDF)
page = doc[0]
pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE))
os.makedirs(os.path.join(OUT, "home"), exist_ok=True)

home_dir = os.path.join(OUT, "home")
mockup_path = os.path.join(home_dir, "mockup.png")
pix.save(mockup_path)
img = Image.open(mockup_path).convert("RGB")

header_box = (0, 0, int(360 * SCALE), int(BODY_TOP * SCALE))
img.crop(header_box).save(os.path.join(home_dir, "header.png"))

body_box = (0, int(BODY_TOP * SCALE), int(360 * SCALE), int(BODY_BOTTOM * SCALE))
body = img.crop(body_box)

# 타일 영역만 (y=338~728)
TILE_TOP = 338
BANNER_PINK_TOP, BANNER_PINK_BOTTOM = 108, 315
BANNER_SCALE_Y = 0.4 * 1.2
BANNER_TOP_COVER_RATIO = 0.3
BANNER_BOTTOM_COVER_RATIO = 0.7
BANNER_SHADOW_H = 8
GAP_H = 14
tile_box = (0, int(TILE_TOP * SCALE), int(360 * SCALE), int(BODY_BOTTOM * SCALE))
body = img.crop(tile_box)

body_path = os.path.join(OUT, "home", "body.png")
body.save(body_path)
print("body", body.size, "->", body_path)

BODY_H = BODY_BOTTOM - TILE_TOP
BANNER_CUT_Y = BANNER_PINK_TOP + (BANNER_PINK_BOTTOM - BANNER_PINK_TOP) * BANNER_TOP_COVER_RATIO
top_src = img.crop(
    (int(26 * SCALE), int(BANNER_PINK_TOP * SCALE), int(334 * SCALE), int(BANNER_CUT_Y * SCALE))
)
top_out_h = round((BANNER_CUT_Y - BANNER_PINK_TOP) * BANNER_SCALE_Y * SCALE)
top_src.resize((int(308 * SCALE), top_out_h), Image.Resampling.LANCZOS).save(
    os.path.join(home_dir, "expiring-banner-top.png")
)
bottom_src = img.crop(
    (int(26 * SCALE), int(BANNER_CUT_Y * SCALE), int(334 * SCALE), int(BANNER_PINK_BOTTOM * SCALE))
)
bottom_out_h = round((BANNER_PINK_BOTTOM - BANNER_CUT_Y) * BANNER_SCALE_Y * SCALE)
bottom_src.resize((int(308 * SCALE), bottom_out_h), Image.Resampling.LANCZOS).save(
    os.path.join(home_dir, "expiring-banner-bottom.png")
)
BANNER_TOP_H = top_out_h / SCALE
BANNER_BOTTOM_H = bottom_out_h / SCALE
BANNER_H = BANNER_TOP_H + BANNER_BOTTOM_H + BANNER_SHADOW_H
CANVAS_H = BANNER_H + GAP_H + BODY_H
print(
    f"home canvas: 360×{CANVAS_H} "
    f"(top={BANNER_TOP_H:.1f} pink={BANNER_BOTTOM_H:.1f} shadow={BANNER_SHADOW_H} "
    f"gap={GAP_H} tiles={BODY_H})"
)

regions = {
    "expiring-banner": (26, 108, 334, 315),
    "fridge": (26, 338, 170, 464),
    "kimchi": (190, 338, 334, 464),
    "shelf": (26, 487, 170, 612),
    "pantry": (190, 487, 334, 612),
    "recipe": (26, 636, 334, 712),
}

os.makedirs(os.path.join(OUT, "tiles"), exist_ok=True)
for name, (x0, y0, x1, y1) in regions.items():
    box = (int(x0 * SCALE), int(y0 * SCALE), int(x1 * SCALE), int(y1 * SCALE))
    crop = img.crop(box)
    if name == "expiring-banner":
        out = os.path.join(OUT, "expiring-banner.png")
    else:
        out = os.path.join(OUT, "tiles", f"{name}.png")
    crop.save(out)

    # body-relative % for design spec
    rl = x0 / 360 * 100
    rt = (y0 - TILE_TOP) / BODY_H * 100
    rw = (x1 - x0) / 360 * 100
    rh = (y1 - y0) / BODY_H * 100
    print(f"{name}: left={rl:.3f}% top={rt:.3f}% w={rw:.3f}% h={rh:.3f}%")
