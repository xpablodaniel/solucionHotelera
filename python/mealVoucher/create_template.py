#!/usr/bin/env python3
"""Build the daily meal voucher PDF template from the supplied historical image."""

from pathlib import Path

from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
SOURCE_IMAGE = PROJECT_ROOT / "voucherDiario.jpg"
LOGO_IMAGE = PROJECT_ROOT / "assets" / "suteba_logo_3.jpg"
OUTPUT_PDF = SCRIPT_DIR / "VOUCHER_DE_COMIDAS_DIARIO.pdf"


def main() -> None:
    image = Image.open(SOURCE_IMAGE)
    width_px, height_px = image.size
    points_per_pixel = 72 / 96
    page_width = width_px * points_per_pixel
    page_height = height_px * points_per_pixel

    pdf = canvas.Canvas(str(OUTPUT_PDF), pagesize=(page_width, page_height))
    pdf.drawImage(
        ImageReader(image),
        0,
        0,
        width=page_width,
        height=page_height,
        preserveAspectRatio=False,
        mask="auto",
    )

    # The supplied historical screenshot has a broken-image box in this area.
    logo_box = (681, 8, 895, 92)
    x_px, top_px, right_px, bottom_px = logo_box
    pdf.setFillColorRGB(1, 1, 1)
    pdf.rect(
        x_px * points_per_pixel,
        page_height - bottom_px * points_per_pixel,
        (right_px - x_px) * points_per_pixel,
        (bottom_px - top_px) * points_per_pixel,
        stroke=0,
        fill=1,
    )

    logo = Image.open(LOGO_IMAGE)
    pdf.drawImage(
        ImageReader(logo),
        x_px * points_per_pixel,
        page_height - bottom_px * points_per_pixel,
        width=(right_px - x_px) * points_per_pixel,
        height=(bottom_px - top_px) * points_per_pixel,
        preserveAspectRatio=True,
        anchor="sw",
        mask="auto",
    )

    pdf.showPage()
    pdf.save()
    print(f"Created {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
