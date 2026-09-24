#!/usr/bin/env python3
"""Genera vouchers Alicante por overlay sobre la plantilla historica."""

from __future__ import annotations

import io
import json
import sys
from copy import deepcopy
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


def require_report_fields(report: dict) -> None:
    required = {
        "voucher",
        "titular",
        "habitaciones",
        "fechaIngreso",
        "fechaEgreso",
        "cantidadPasajeros",
    }

    missing = sorted(required.difference(report))
    if missing:
        raise ValueError(
            "Reporte Alicante incompleto: faltan " + ", ".join(missing)
        )


def draw_report(overlay: canvas.Canvas, report: dict, slot: dict) -> None:
    require_report_fields(report)

    titular = report["titular"] or {}
    values = {
        "nombre": titular.get("nombre") or "",
        "dni": titular.get("dni") or "",
        "habitaciones": ", ".join(report.get("habitaciones") or []),
        "fechaIngreso": report.get("fechaIngreso") or "",
        "fechaEgreso": report.get("fechaEgreso") or "",
        "cantidadPersonas": str(report.get("cantidadPasajeros") or ""),
    }

    for field_name in ("nombre", "dni", "habitaciones", "fechaIngreso", "fechaEgreso"):
        position = slot[field_name]
        overlay.setFont("Helvetica-Bold" if field_name == "nombre" else "Helvetica", 9)
        overlay.drawString(
            float(position["x_mm"]) * mm,
            float(position["y_from_bottom_mm"]) * mm,
            str(values[field_name]),
        )

    quantity_position = slot["cantidadPersonas"]
    overlay.setFont("Helvetica", 9)
    overlay.drawString(
        float(quantity_position["x_mm"]) * mm,
        float(quantity_position["y_from_bottom_mm"]) * mm,
        values["cantidadPersonas"],
    )


def generate_pdf(template_path: Path, positions_path: Path, output_path: Path, reports: list[dict]) -> None:
    if not template_path.is_file():
        raise FileNotFoundError(f"No existe la plantilla PDF: {template_path}")
    if not positions_path.is_file():
        raise FileNotFoundError(f"No existe positions.json: {positions_path}")
    if not reports:
        raise ValueError("Se necesita al menos un reporte Alicante")

    positions = json.loads(positions_path.read_text(encoding="utf-8"))
    slots = positions["slots"]
    template_reader = PdfReader(str(template_path))
    if not template_reader.pages:
        raise ValueError("La plantilla PDF no contiene paginas")

    template_page = template_reader.pages[0]
    page_width = float(template_page.mediabox.width)
    page_height = float(template_page.mediabox.height)
    writer = PdfWriter()

    for start in range(0, len(reports), len(slots)):
        report_chunk = reports[start : start + len(slots)]
        packet = io.BytesIO()
        overlay = canvas.Canvas(packet, pagesize=(page_width, page_height))

        for slot_index, report in enumerate(report_chunk):
            draw_report(
                overlay,
                report,
                slots[slot_index],
            )

        overlay.save()
        packet.seek(0)
        page = deepcopy(template_page)
        page.merge_page(PdfReader(packet).pages[0])
        writer.add_page(page)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as handle:
        writer.write(handle)


def main() -> None:
    request = json.load(sys.stdin)
    generate_pdf(
        Path(request["templatePath"]),
        Path(request["positionsPath"]),
        Path(request["outputPath"]),
        request["reports"],
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)