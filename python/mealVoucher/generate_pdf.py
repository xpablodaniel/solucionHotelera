#!/usr/bin/env python3
"""Overlay validated daily meal voucher data on the historical template."""

import json
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import io


SCRIPT_DIR = Path(__file__).resolve().parent


def main() -> None:
    request = json.load(sys.stdin)
    template_path = Path(request["templatePath"])
    positions_path = Path(request["positionsPath"])
    output_path = Path(request["outputPath"])
    data = request["data"]

    if not template_path.is_file():
        raise FileNotFoundError(f"No existe la plantilla PDF: {template_path}")
    if not positions_path.is_file():
        raise FileNotFoundError(f"No existe positions.json: {positions_path}")

    positions = json.loads(positions_path.read_text(encoding="utf-8"))
    page_reader = PdfReader(str(template_path))
    if not page_reader.pages:
        raise ValueError("La plantilla PDF no contiene paginas")

    page = page_reader.pages[0]
    page_width = float(page.mediabox.width)
    page_height = float(page.mediabox.height)
    packet = io.BytesIO()
    overlay = canvas.Canvas(packet, pagesize=(page_width, page_height))
    overlay.setFont("Helvetica", 10)

    for field_name, value in data.items():
        field = positions["fields"].get(field_name)
        if not field or field.get("x_mm") is None or field.get("y_top_mm") is None:
            raise ValueError(f"Posicion no calibrada para el campo: {field_name}")

        x = float(field["x_mm"]) * mm
        y = page_height - float(field["y_top_mm"]) * mm
        font = "Helvetica-Bold" if field_name == "cantidadPersonas" else "Helvetica"
        overlay.setFont(font, 10)

        if field_name == "hotel":
            overlay.setFillColorRGB(1, 1, 1)
            overlay.rect(
                20.6 * mm,
                page_height - 54.0 * mm,
                128.0 * mm,
                8.5 * mm,
                stroke=0,
                fill=1,
            )
            overlay.setFillColorRGB(0, 0, 0)
            overlay.drawCentredString(x, y, str(value))
        else:
            overlay.drawString(x, y, str(value))

    overlay.save()
    packet.seek(0)
    page.merge_page(PdfReader(packet).pages[0])

    writer = PdfWriter()
    writer.add_page(page)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as handle:
        writer.write(handle)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
