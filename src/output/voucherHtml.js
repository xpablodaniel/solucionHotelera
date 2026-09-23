function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


function getVisualStayDays(voucher) {

    return voucher.diasEstadia === null
        ? 1
        : voucher.diasEstadia;
}


function renderMealChecks(voucher) {

    const meals = voucher.modo === "PC"
        ? ["Almuerzo", "Cena"]
        : ["Cena"];
    const days = getVisualStayDays(voucher);

    return meals
        .map(meal => {
            const checks = Array.from(
                { length: Math.max(0, days) },
                (_, index) => `
                    <div class="day-box">
                        <span class="day-label">Día ${index + 1}</span>
                        <span class="checkbox"></span>
                    </div>`
            ).join("");

            return `
                <section class="meal-section">
                    <h2 class="meal-title">${escapeHtml(meal)}</h2>
                    <div class="days-grid">${checks}
                    </div>
                </section>`;
        })
        .join("");
}


function renderVoucher(voucher) {

    const rooms = Array.isArray(voucher.habitaciones)
        ? voucher.habitaciones.join(", ")
        : "";

    return `
        <article class="container">
            <div class="logo-container">
                <img src="../assets/suteba_logo_3.jpg" alt="Logo SUTEBA">
            </div>
            <h1 class="h1-container">${voucher.modo === "PC"
                    ? "Voucher de Comidas PPJ"
                    : "Voucher de Comidas"}</h1>
            <p class="p-cena">${voucher.modo === "PC"
                ? "Favor de brindar servicio de Pensión Completa al siguiente afiliado:"
                : "Favor de brindar servicio de Cena al siguiente afiliado:"}</p>
            <div class="passengerName"><strong>Nombre:</strong> ${escapeHtml(voucher.representante)}</div>
            <div class="dni"><strong>Dni:</strong> ${escapeHtml(voucher.dni)}</div>
            <div class="hotel"><strong>U. Turística:</strong> ${escapeHtml(voucher.hotel)}</div>
            <div class="din"><strong>Ingreso:</strong> ${escapeHtml(voucher.fechaIngreso)}</div>
            <div class="dout"><strong>Egreso:</strong> ${escapeHtml(voucher.fechaEgreso)}</div>
            <div class="roomNumber"><strong>Habitación Nº:</strong> <span class="roomNumberContent">${escapeHtml(rooms)}</span></div>
            <div class="cantp"><strong>Cant. Pax:</strong> ${escapeHtml(voucher.cantidadPasajeros)}</div>
            <p class="p-servicios"><strong>Servicios a Tomar</strong></p>
            <div class="cantMap"><strong>Cant. Comidas:</strong> ${escapeHtml(voucher.cantidadComidas)}</div>
            <div class="check-container check-boxes-grid">
                ${renderMealChecks(voucher)}
            </div>
        </article>`;
}


function renderVouchersHtml(vouchers) {

    if (!Array.isArray(vouchers)) {
        throw new TypeError(
            "renderVouchersHtml espera un array de vouchers."
        );
    }

    const pages = [];

    for (let index = 0; index < vouchers.length; index += 4) {

        const pageVouchers = vouchers
            .slice(index, index + 4)
            .map(renderVoucher)
            .join("");

        pages.push(`
            <section class="voucher-page">
                ${pageVouchers}
            </section>`);
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Vouchers</title>
    <style>
        @page { size: A4; margin: 10mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; }
        .voucher-page {
            display: grid;
            grid-template-columns: 1fr;
            gap: 5mm;
        }
        .container {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            grid-template-rows: repeat(9, auto);
            gap: 2px;
            border: 1px solid #ccc;
            padding: 5mm;
            min-height: 62mm;
            margin: 5mm;
            background: #f4f4f4;
            font-size: 11px;
            page-break-inside: avoid;
        }
        .logo-container { grid-column: 4 / -1; grid-row: 1; text-align: right; }
        .logo-container img { width: 120px; }
        .h1-container { grid-column: 1 / span 4; grid-row: 1; font: 20px "Times New Roman", serif; text-align: center; text-transform: uppercase; }
        .p-cena { grid-column: 1 / span 6; grid-row: 2; margin: 0; }
        .passengerName { grid-column: 1 / span 4; grid-row: 3; font-weight: bold; }
        .dni { grid-column: 5 / -1; grid-row: 3; }
        .hotel { grid-column: 1 / span 6; grid-row: 4; }
        .din { grid-column: 3 / -2; grid-row: 5; }
        .dout { grid-column: 5 / -1; grid-row: 5; }
        .roomNumber { grid-column: 1 / span 2; grid-row: 5; }
        .roomNumberContent { font-size: 14px; font-weight: bold; }
        .cantp { grid-column: 5 / -1; grid-row: 6; }
        .p-servicios { grid-column: 1 / span 3; grid-row: 7; margin: 0; }
        .cantMap { grid-column: 5 / -1; grid-row: 7; }
        .check-container { grid-column: 1 / span 6; grid-row: 8; }
        .check-boxes-grid { display: flex; gap: 20px; padding: 8px 0; flex-wrap: wrap; }
        .meal-section { flex: 1; }
        .meal-title { font-size: 10px; text-align: center; text-decoration: underline; }
        .days-grid { display: flex; gap: 2mm; justify-content: center; }
        .day-box { display: flex; flex-direction: column; align-items: center; font-size: 8px; }
        .checkbox { width: 4mm; height: 4mm; border: 1px solid #333; }
        @media print {
            .voucher-page { break-after: page; }
            .voucher-page:last-child { break-after: auto; }
        }
    </style>
</head>
<body>
${pages.join("")}
</body>
</html>`;
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        escapeHtml,
        renderVoucher,
        renderVouchersHtml
    };
}