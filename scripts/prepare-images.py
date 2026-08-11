#!/usr/bin/env python3
"""
prepare-images.py — تجهيز صور المنتجات لموقع القابضة

يقرأ الصور الخام من ./raw-images/ ويكتب النتائج إلى ./assets/products/

لكل صورة يُنتج ثلاثة ملفات:
    <name>.png          صورة كاملة (شفافة في وضع القص)
    <name>.webp         نسخة WebP أخف للمتصفحات الحديثة
    <name>-thumb.webp   مصغّرة بعرض 400 بكسل

── وضعان ────────────────────────────────────────────────────────────────
  cutout  إزالة الخلفية باستخدام rembg ثم وضع المنتج على خلفية شفافة.
          يصلح فقط للصور الملتقطة أمام خلفية بيضاء أو فاتحة موحّدة.
  frame   بدون إزالة خلفية: قصّ إلى نسبة ثابتة وتصحيح بسيط للألوان.
          هذا هو الوضع المناسب لصور المعرض الملتقطة بالهاتف.

الوضع الافتراضي auto: يُستعمل القص للصور المدرجة في CUTOUT_FILES أدناه،
وإطار ثابت لِما عداها.

── الاستعمال ─────────────────────────────────────────────────────────────
    python3 scripts/prepare-images.py                 # auto (الموصى به)
    python3 scripts/prepare-images.py --frame-only    # بدون rembg إطلاقًا
    python3 scripts/prepare-images.py --cutout-only   # محاولة القص للكل
    python3 scripts/prepare-images.py --force         # إعادة توليد الموجود

── المتطلبات ─────────────────────────────────────────────────────────────
    pip install pillow            (إلزامي)
    pip install rembg             (اختياري — للقص فقط)

إن لم تكن rembg مثبّتة، يعمل السكربت في وضع frame تلقائيًا ويطبع تنبيهًا.
النتيجة تبقى نظيفة لأن كل بطاقة منتج تجلس على مربّع رملي اللون في الموقع.
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps, ImageEnhance
except ImportError:
    sys.exit("خطأ: مكتبة Pillow غير مثبّتة.  شغّل:  pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "raw-images"
OUT = ROOT / "assets" / "products"

# نسبة العرض إلى الارتفاع لبطاقات المنتجات (مربّع)
TILE = (1400, 1400)
THUMB_W = 400
# لون الحشو خلف صور الإطار — نفس --c-sand في css/tokens.css
SAND = (241, 234, 224)

# الصور الملتقطة أمام خلفية فاتحة موحّدة: القص ينجح معها.
# أضف اسم أي صورة جديدة هنا إذا كانت خلفيتها بيضاء.
CUTOUT_FILES = {
    "vanity-grey-stone-01.jpg",
    "vanity-grey-stone-02.jpg",
    "vanity-grey-stone-03.jpg",
}


def load_rembg():
    """ترجع دالة إزالة الخلفية، أو None إذا لم تكن rembg متاحة."""
    try:
        from rembg import remove, new_session
    except ImportError:
        return None
    try:
        session = new_session("isnet-general-use")
    except Exception as exc:  # نموذج غير قابل للتنزيل أو ما شابه
        print(f"  تنبيه: تعذّر تحميل نموذج rembg ({exc}) — سيُستعمل وضع الإطار.")
        return None
    return lambda im: remove(im, session=session)


def pad_tile(im, background):
    """يضع الصورة كاملةً داخل مربّع مع هوامش — للمنتجات المقصوصة فقط،
    حتى تبدو «طافية» فوق المربّع الرملي في الموقع."""
    im = ImageOps.exif_transpose(im)
    im.thumbnail(TILE, Image.LANCZOS)
    canvas = Image.new("RGBA", TILE, background)
    canvas.paste(im, ((TILE[0] - im.width) // 2, (TILE[1] - im.height) // 2),
                 im if im.mode == "RGBA" else None)
    return canvas


def crop_tile(im):
    """يقصّ الصورة من المنتصف لتملأ المربّع كاملًا — لصور المعرض.
    لا نضيف هوامش رملية داخل الصورة: المربّع الرملي موجود أصلًا في CSS،
    وتكراره داخل الملف يجعل التأطير يبدو مزدوجًا وغير متّسق."""
    im = ImageOps.exif_transpose(im)
    return ImageOps.fit(im, TILE, Image.LANCZOS, centering=(0.5, 0.5)).convert("RGBA")


def polish(im):
    """تصحيح خفيف: صور الهاتف تميل إلى الرمادية تحت إضاءة المعرض."""
    im = ImageEnhance.Color(im).enhance(1.06)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    return im


def process(path, mode, remover, force):
    stem = path.stem
    png = OUT / f"{stem}.png"
    webp = OUT / f"{stem}.webp"
    thumb = OUT / f"{stem}-thumb.webp"

    if png.exists() and not force:
        return "تخطّي"

    im = Image.open(path).convert("RGBA")
    im = ImageOps.exif_transpose(im)

    if mode == "cutout" and remover is not None:
        im = remover(im).convert("RGBA")
        tile = pad_tile(im, (0, 0, 0, 0))
        used = "قصّ"
    else:
        tile = crop_tile(im.convert("RGB"))
        tile = polish(tile.convert("RGB")).convert("RGBA")
        used = "إطار"

    tile.save(png, "PNG", optimize=True)
    tile.save(webp, "WEBP", quality=82, method=6)
    t = tile.copy()
    t.thumbnail((THUMB_W, THUMB_W), Image.LANCZOS)
    t.save(thumb, "WEBP", quality=80, method=6)
    return used


def main():
    ap = argparse.ArgumentParser(add_help=True)
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--frame-only", action="store_true",
                   help="لا تستعمل rembg إطلاقًا")
    g.add_argument("--cutout-only", action="store_true",
                   help="حاول قصّ الخلفية لكل الصور")
    ap.add_argument("--force", action="store_true",
                    help="أعد توليد الملفات الموجودة")
    args = ap.parse_args()

    if not RAW.is_dir():
        sys.exit(f"خطأ: المجلد {RAW} غير موجود.")
    OUT.mkdir(parents=True, exist_ok=True)

    remover = None
    if not args.frame_only:
        remover = load_rembg()
        if remover is None:
            print("تنبيه: rembg غير متاحة — كل الصور ستُعالج في وضع الإطار.")
            print("      للتفعيل:  pip install rembg\n")

    # _review/ يحتوي صورًا محجوزة (علامة مورّد أو وجوه) — لا تُنشر
    files = sorted(p for p in RAW.iterdir()
                   if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
    if not files:
        sys.exit(f"لا توجد صور في {RAW}")

    counts = {}
    for p in files:
        if args.cutout_only:
            mode = "cutout"
        elif args.frame_only:
            mode = "frame"
        else:
            mode = "cutout" if p.name in CUTOUT_FILES else "frame"
        result = process(p, mode, remover, args.force)
        counts[result] = counts.get(result, 0) + 1
        print(f"  {result:6}  {p.name}")

    print(f"\nتمّت معالجة {len(files)} صورة → {OUT.relative_to(ROOT)}")
    for k, v in sorted(counts.items()):
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
