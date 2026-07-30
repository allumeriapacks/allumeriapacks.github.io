"""
Procedural, original texture + icon generator for allumeriapacks.
No copyrighted/game assets are copied — everything here is generated
from scratch with simple noise + gradients so it's safe to ship.
"""
import random
import math
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont

random.seed(42)

OUT = "/home/claude/allumeriapacks/assets/img"


def clamp(v, lo=0, hi=255):
    return max(lo, min(hi, int(v)))


def wood_plank_tile(size=256, base=(61, 40, 26), grain=(38, 24, 15), plank_count=4, seam=(24, 15, 9)):
    """Seamless horizontal oak-plank style tile with vertical grain streaks."""
    img = Image.new("RGB", (size, size), base)
    px = img.load()
    plank_h = size // plank_count

    for y in range(size):
        plank_idx = y // plank_h
        local_y = y % plank_h
        for x in range(size):
            # base color with subtle per-plank variance
            variance = (plank_idx * 7) % 15 - 7
            r = base[0] + variance
            g = base[1] + variance
            b = base[2] + variance

            # vertical wood grain streaks (wrap x for seamlessness)
            streak = (math.sin((x * 0.19) + plank_idx * 3.1) * 0.5 + 0.5)
            streak *= (math.sin((x * 0.05) + 1.7) * 0.5 + 0.5)
            n = (random.random() - 0.5) * 10
            factor = streak * 22 + n

            r -= factor
            g -= factor * 0.9
            b -= factor * 0.8

            # seam line between planks (top + bottom edge of each plank)
            if local_y < 2 or local_y > plank_h - 3:
                r, g, b = seam
            px[x, y] = (clamp(r), clamp(g), clamp(b))

    img = img.filter(ImageFilter.GaussianBlur(0.4))
    return img


def dark_panel_tile(size=256, base=(31, 21, 15)):
    """Darker, subtler walnut panel texture for header/footer bars."""
    img = Image.new("RGB", (size, size), base)
    px = img.load()
    for y in range(size):
        for x in range(size):
            n = (random.random() - 0.5) * 8
            streak = (math.sin(x * 0.13 + y * 0.02) * 0.5 + 0.5) * 10
            r = clamp(base[0] - streak + n)
            g = clamp(base[1] - streak * 0.9 + n)
            b = clamp(base[2] - streak * 0.8 + n)
            px[x, y] = (r, g, b)
    return img.filter(ImageFilter.GaussianBlur(0.5))


def vignette(img, strength=110):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.ellipse([-w * 0.3, -h * 0.3, w * 1.3, h * 1.3], fill=strength)
    mask = mask.filter(ImageFilter.GaussianBlur(w * 0.15))
    black = Image.new("RGB", (w, h), (5, 3, 2))
    return Image.composite(img, black, ImageOps.invert(mask))


def flame_icon(size=256):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = size / 2
    # outer flame (amber)
    outer = [
        (cx, size * 0.06),
        (size * 0.78, size * 0.42),
        (size * 0.72, size * 0.9),
        (cx, size * 0.98),
        (size * 0.28, size * 0.9),
        (size * 0.22, size * 0.42),
    ]
    d.polygon(outer, fill=(224, 123, 57, 255))
    # inner flame (bright yellow-orange)
    inner = [
        (cx, size * 0.28),
        (size * 0.62, size * 0.5),
        (size * 0.58, size * 0.85),
        (cx, size * 0.92),
        (size * 0.42, size * 0.85),
        (size * 0.38, size * 0.5),
    ]
    d.polygon(inner, fill=(247, 181, 88, 255))
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    return img


def make_favicon():
    base = Image.new("RGBA", (256, 256), (43, 29, 20, 255))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([0, 0, 255, 255], radius=56, fill=(43, 29, 20, 255))
    flame = flame_icon(180)
    base.alpha_composite(flame, (38, 44))
    base.save(f"{OUT}/favicon.png")
    for s in (16, 32, 48, 180):
        base.resize((s, s), Image.LANCZOS).save(f"{OUT}/favicon-{s}.png")
    base.resize((32, 32), Image.LANCZOS).save(f"{OUT}/favicon.ico")


def make_og_image():
    w, h = 1200, 630
    tile = wood_plank_tile(256)
    bg = Image.new("RGB", (w, h))
    for y in range(0, h, 256):
        for x in range(0, w, 256):
            bg.paste(tile, (x, y))
    bg = vignette(bg, 140)
    d = ImageDraw.Draw(bg)
    try:
        f_title = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 74
        )
        f_sub = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32
        )
    except Exception:
        f_title = ImageFont.load_default()
        f_sub = ImageFont.load_default()

    flame = flame_icon(120)
    bg.paste(flame, (80, 210), flame)

    d.text((220, 235), "ALLUMERIA PACKS", font=f_title, fill=(245, 233, 217))
    d.text((222, 330), "Fanmade Download-Bereich \u2022 inoffiziell",
           font=f_sub, fill=(201, 168, 119))
    bg.save(f"{OUT}/og-image.png", quality=90)


def main():
    plank = wood_plank_tile(256)
    plank.save(f"{OUT}/wood-plank.png")

    panel = dark_panel_tile(256)
    panel.save(f"{OUT}/wood-panel.png")

    # hero background: bigger tiled plank with vignette for depth
    hero = Image.new("RGB", (1024, 768))
    for y in range(0, 768, 256):
        for x in range(0, 1024, 256):
            hero.paste(plank, (x, y))
    hero = vignette(hero, 130)
    hero.save(f"{OUT}/hero-bg.jpg", quality=88)

    make_favicon()
    make_og_image()
    print("done")


if __name__ == "__main__":
    main()
