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


def color_dist(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> int:
    return sum(abs(a - b) for a, b in zip(c1, c2))


def sample_tile_bg(img: Image.Image) -> tuple[int, int, int]:
    w, h = img.size
    samples = [
        img.getpixel((x, y))
        for x in range(24, w - 24)
        for y in range(24, h - 24)
        if img.getpixel((x, y)) != (255, 255, 255)
    ]
    return Counter(samples).most_common(1)[0][0]


def sample_text_color(img: Image.Image, bg: tuple[int, int, int]) -> tuple[int, int, int]:
    w, h = img.size
    text_pixels: Counter[tuple[int, int, int]] = Counter()
    for x in range(w):
        for y in range(h):
            rgb = img.getpixel((x, y))
            if rgb == (255, 255, 255):
                continue
            if color_dist(rgb, bg) <= 35:
                continue
            r, g, b = rgb
            if max(rgb) - min(rgb) < 20 and min(rgb) > 165:
                continue
            text_pixels[rgb] += 1
    return text_pixels.most_common(1)[0][0]


def is_shadow(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    return max(rgb) - min(rgb) < 20 and min(rgb) > 165


def keep_pixel(rgb: tuple[int, int, int], bg: tuple[int, int, int], text: tuple[int, int, int]) -> bool:
    if rgb == (255, 255, 255) or all(c > 252 for c in rgb):
        return False
    if color_dist(rgb, bg) <= 38:
        return False
    if is_shadow(rgb):
        return False
    if color_dist(rgb, text) <= 72:
        return True
    return color_dist(rgb, bg) > 55 and not is_shadow(rgb)


def crop_to_widest_text_band(img: Image.Image) -> Image.Image:
    """아이콘·장식선 제외, 가로로 가장 넓은 글자 띠만 남김."""
    w, h = img.size
    px = img.load()
    spans: list[int] = []
    for y in range(h):
        xs = [x for x in range(w) if px[x, y][3] > 0]
        spans.append(xs[-1] - xs[0] if xs else 0)

    if not spans or max(spans) == 0:
        return img

    peak = max(spans)
    threshold = int(peak * 0.55)
    active = [i for i, span in enumerate(spans) if span >= threshold]
    if not active:
        return img

    # 연속 구간 중 가로 스팬 합이 가장 큰 띠 선택
    bands: list[tuple[int, int, int]] = []
    start = active[0]
    prev = active[0]
    for y in active[1:]:
        if y == prev + 1:
            prev = y
            continue
        bands.append((start, prev, sum(spans[start : prev + 1])))
        start = y
        prev = y
    bands.append((start, prev, sum(spans[start : prev + 1])))

    y0, y1, _ = max(bands, key=lambda band: band[2])
    pad_y = 2
    return img.crop((0, max(0, y0 - pad_y), w, min(h, y1 + pad_y + 1)))


def extract_wordmark(name: str, tile_file: str) -> None:
    src = TILES / tile_file
    if not src.exists():
        print(f"skip {name}: missing {src}")
        return

    rgb_img = Image.open(src).convert("RGB")
    bg = sample_tile_bg(rgb_img)
    text = sample_text_color(rgb_img, bg)

    out = Image.new("RGBA", rgb_img.size, (0, 0, 0, 0))
    src_px = rgb_img.load()
    out_px = out.load()
    w, h = rgb_img.size

    for y in range(h):
        for x in range(w):
            rgb = src_px[x, y]
            if keep_pixel(rgb, bg, text):
                out_px[x, y] = (*rgb, 255)

    bbox = out.getbbox()
    if not bbox:
        print(f"warn {name}: empty after extraction")
        return

    x0, y0, x1, y1 = bbox
    pad = 2
    cropped = out.crop(
        (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad))
    )
    cropped = crop_to_widest_text_band(cropped)

    dest = OUT / name / "title-word.png"
    dest.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(dest, optimize=True)
    print(f"wrote {dest} bg={bg} text={text} size={cropped.size}")


def main() -> None:
    for name, tile_file in TILE_FILES.items():
        extract_wordmark(name, tile_file)


if __name__ == "__main__":
    main()
