#!/usr/bin/env python3
"""Build the daily meal voucher PDF template from the supplied historical image."""

from pathlib import Path

from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


SCRIPT_DIR = Path(__file__).resolve().parent
SOURCE_IMAGE = SCRIPT_DIR / "source" / "voucherDiario.jpg"
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

    pdf.showPage()
    pdf.save()
    print(f"Created {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
