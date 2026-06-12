"""홈 타일 PNG에서 배경·그림자를 제거하고 글자(워드마크)만 추출."""
from __future__ import annotations

from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TILES = ROOT / "public" / "assets" / "tiles"
OUT = ROOT / "public" / "assets" / "storage"

TILE_FILES: dict[str, str] = {
    "general": "fridge.png",
    "kimchi": "kimchi.png",
    "shelf": "shelf.png",
    "pantry": "pantry.png",
}

# 타일 상단 제목 글자 영역 (타일 대비 비율)
TITLE_TILE_CROP = (0.06, 0.36, 0.94, 0.53)
# 홈 타일 표시 너비와 맞춰 다운스케일 → 둥근 상단 안티앨리어싱 보존
TITLE_TILE_DISPLAY_W = 144
TITLE_WORDMARK_SCALE = 4


def color_dist(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> int:
    return sum(abs(a - b) for a, b in zip(c1, c2))


def sample_title_bg(img: Image.Image) -> tuple[int, int, int]:
    w, h = img.size
    corners = [
        img.getpixel((4, 4)),
        img.getpixel((w - 5, 4)),
        img.getpixel((4, h - 5)),
        img.getpixel((w - 5, h - 5)),
    ]
    return Counter(corners).most_common(1)[0][0]


def sample_text_color(img: Image.Image, bg: tuple[int, int, int]) -> tuple[int, int, int]:
    w, h = img.size
    text_pixels: Counter[tuple[int, int, int]] = Counter()
    for x in range(w // 5, w - w // 5):
        for y in range(h // 5, h - h // 5):
            rgb = img.getpixel((x, y))
            if color_dist(rgb, bg) <= 45:
                continue
            if max(rgb) - min(rgb) < 18 and min(rgb) > 200:
                continue
            text_pixels[rgb] += 1
    if not text_pixels:
        raise ValueError("no text pixels sampled")
    return text_pixels.most_common(1)[0][0]


def keep_wordmark_pixel(
    rgb: tuple[int, int, int],
    bg: tuple[int, int, int],
    text: tuple[int, int, int],
) -> bool:
    """글자 본체 + 둥근 상단 안티앨리어싱 픽셀까지 보존."""
    if min(rgb) > 245:
        return False
    d_bg = color_dist(rgb, bg)
    if d_bg <= 18:
        return False
    d_text = color_dist(rgb, text)
    if d_text <= 88:
        return True
    # 배경↔글자 사이 그라데이션(둥근 윗부분)
    if 22 <= d_bg <= 155 and max(rgb) - min(rgb) <= 48:
        return True
    return False


def prepare_tile_for_title(img: Image.Image) -> Image.Image:
    w, h = img.size
    tw = TITLE_TILE_DISPLAY_W
    th = max(1, int(h * tw / w))
    return img.resize((tw, th), Image.Resampling.LANCZOS)


def crop_title_tile(img: Image.Image) -> Image.Image:
    w, h = img.size
    l, t, r, b = TITLE_TILE_CROP
    return img.crop((int(w * l), int(h * t), int(w * r), int(h * b)))


def trim_below_text_band(img: Image.Image) -> Image.Image:
    """아래 그림자만 제거하고 위쪽 둥근 마감은 유지."""
    w, h = img.size
    px = img.load()
    spans: list[int] = []
    for y in range(h):
        spans.append(sum(1 for x in range(w) if px[x, y][3] > 16))

    if not spans or max(spans) == 0:
        return img

    peak = max(spans)
    threshold = int(peak * 0.55)
    last_main = 0
    for y, span in enumerate(spans):
        if span >= threshold:
            last_main = y

    pad = 3
    return img.crop((0, 0, w, min(h, last_main + pad + 1)))


def finalize_wordmark(img: Image.Image) -> Image.Image:
    """글자 주변만 균등 여백을 두고, 상단이 잘리지 않게 타이트하게 맞춤."""
    bbox = img.getbbox()
    if not bbox:
        return img

    text = img.crop(bbox)
    pad = 4
    canvas = Image.new(
        "RGBA",
        (text.width + pad * 2, text.height + pad * 2),
        (0, 0, 0, 0),
    )
    canvas.paste(text, (pad, pad), text)
    cw, ch = canvas.size
    return canvas.resize(
        (cw * TITLE_WORDMARK_SCALE, ch * TITLE_WORDMARK_SCALE),
        Image.Resampling.LANCZOS,
    )


def extract_wordmark(name: str, tile_file: str) -> None:
    src = TILES / tile_file
    if not src.exists():
        print(f"skip {name}: missing {src}")
        return

    rgb_img = crop_title_tile(prepare_tile_for_title(Image.open(src).convert("RGB")))
    bg = sample_title_bg(rgb_img)
    text = sample_text_color(rgb_img, bg)

    out = Image.new("RGBA", rgb_img.size, (0, 0, 0, 0))
    src_px = rgb_img.load()
    out_px = out.load()
    w, h = rgb_img.size

    for y in range(h):
        for x in range(w):
            rgb = src_px[x, y]
            if keep_wordmark_pixel(rgb, bg, text):
                out_px[x, y] = (*rgb, 255)

    bbox = out.getbbox()
    if not bbox:
        print(f"warn {name}: empty after extraction")
        return

    cropped = out.crop(bbox)
    cropped = trim_below_text_band(cropped)
    cropped = finalize_wordmark(cropped)

    dest = OUT / name / "title-word.png"
    dest.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(dest, optimize=True)
    print(f"wrote {dest} bg={bg} text={text} size={cropped.size}")


def main() -> None:
    for name, tile_file in TILE_FILES.items():
        extract_wordmark(name, tile_file)


if __name__ == "__main__":
    main()
