const {
    selectOutputRecords
} = require("../business/outputSelection");

const {
    parseDateKey
} = require("../normalizer/dateKeys");

const {
    buildVoucherReport
} = require("./voucherReport");

const {
    renderVouchersHtml
} = require("./voucherHtml");


function normalizeService(value) {
    return String(value ?? "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function getVoucherRegime(reservation) {
    const passengers = Array.isArray(reservation?.pasajeros)
        ? reservation.pasajeros
        : [];

    if (passengers.length === 0) {
        return null;
    }

    let voucherRegime = null;

    for (const passenger of passengers) {
        const service = normalizeService(passenger?.servicios);
        const passengerRegime = service.includes("PENSION COMPLETA")
            ? "PC"
            : service.includes("MEDIA PENSION")
                ? "MAP"
                : service.includes("DESAYUNO")
                    ? "DESAYUNO"
                    : null;

        if (passengerRegime === null) {
            return null;
        }

        if (voucherRegime !== null && voucherRegime !== passengerRegime) {
            return null;
        }

        voucherRegime = passengerRegime;
    }

    return voucherRegime;
}


function getStayPeriodStatus(reservation) {
    const passengers = Array.isArray(reservation?.pasajeros)
        ? reservation.pasajeros
        : [];

    if (passengers.length === 0) {
        return "MISSING_OR_INVALID_DATES";
    }

    let groupArrival = null;
    let groupDeparture = null;

    for (const passenger of passengers) {
        const arrival = parseDateKey(passenger?.estadia?.ingreso);
        const departure = parseDateKey(passenger?.estadia?.egreso);

        if (arrival === null || departure === null || departure <= arrival) {
            return "MISSING_OR_INVALID_DATES";
        }

        if (groupArrival === null) {
            groupArrival = arrival;
            groupDeparture = departure;
            continue;
        }

        if (arrival !== groupArrival || departure !== groupDeparture) {
            return "DIVERGENT_STAY_PERIODS";
        }
    }

    return null;
}


function escapeAttribute(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


const PRINT_TOOLBAR = `
<style>
    .print-toolbar { padding: 12px 16px; background: #eef1f4; border-bottom: 1px solid #d7dce1; font-family: Arial, sans-serif; }
    .print-toolbar button { padding: 10px 18px; font-size: 15px; font-weight: 700; cursor: pointer; }
    @media print { .print-toolbar { display: none; } }
</style>
<div class="print-toolbar"><button type="button" onclick="window.print()">Imprimir</button></div>`;


function addPrintToolbar(html) {
    return html.replace("<body>", `<body>${PRINT_TOOLBAR}`);
}


function addDocumentBase(html, baseUrl) {
    if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
        throw new TypeError(
            "buildVoucherHtmlForDate espera una URL base valida."
        );
    }

    let parsedBaseUrl;
    try {
        parsedBaseUrl = new URL(baseUrl);
    } catch {
        throw new TypeError(
            "buildVoucherHtmlForDate espera una URL base absoluta."
        );
    }

    if (!["http:", "https:", "file:"].includes(parsedBaseUrl.protocol)) {
        throw new TypeError(
            "buildVoucherHtmlForDate espera una URL base http, https o file."
        );
    }

    return html.replace(
        "<head>",
        `<head>\n    <base href="${escapeAttribute(parsedBaseUrl.href)}">`
    );
}


/**
 * Builds printable voucher HTML for affected reservations of one meal regime.
 * The base URL preserves the renderer's relative CSS and logo paths in Blob
 * documents opened from the reservations page.
 */
function buildVoucherHtmlForDate(reservations, selectedDate, mode, baseUrl) {
    if (mode !== "MAP" && mode !== "PC") {
        throw new Error(
            "buildVoucherHtmlForDate espera el modo MAP o PC."
        );
    }

    const { affectedReservations } = selectOutputRecords(
        reservations,
        selectedDate
    );
    const eligibleReservations = affectedReservations.filter(
        reservation => getVoucherRegime(reservation) === mode
    );
    const reviewRequired = [];
    const reportableReservations = [];

    for (const reservation of eligibleReservations) {
        const reason = getStayPeriodStatus(reservation);

        if (reason) {
            reviewRequired.push({
                voucher: reservation.voucher ?? null,
                reason
            });
        } else {
            reportableReservations.push(reservation);
        }
    }

    const reportes = buildVoucherReport(reportableReservations, mode);

    if (reportes.length === 0) {
        return {
            reportes,
            html: null,
            reviewRequired
        };
    }

    return {
        reportes,
        reviewRequired,
        html: addDocumentBase(
            addPrintToolbar(renderVouchersHtml(reportes)),
            baseUrl
        )
    };
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        buildVoucherHtmlForDate,
        getVoucherRegime,
        getStayPeriodStatus
    };
}
