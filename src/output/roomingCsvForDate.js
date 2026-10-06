const {
    selectOutputRecords
} = require("../business/outputSelection");

const {
    parseDateKey
} = require("../normalizer/dateKeys");

const {
    buildRoomingReport
} = require("./roomingReport");

const {
    buildPcRoomingReport,
    normalizeService
} = require("./roomingPcReport");

const {
    exportRoomingCsv
} = require("./roomingCsv");

const {
    exportPcRoomingCsv
} = require("./roomingPcCsv");


function getMealRegime(service) {
    const normalized = normalizeService(service);

    if (normalized.includes("PENSION COMPLETA")) {
        return "PC";
    }

    if (normalized.includes("MEDIA PENSION")) {
        return "MAP";
    }

    return null;
}


function countSelectedPassengers(passengers) {
    const counts = new Map();

    for (const passenger of passengers) {
        counts.set(passenger, (counts.get(passenger) || 0) + 1);
    }

    return counts;
}


function buildRoomingCsvForDate(reservations, selectedDate, mode) {
    if (mode !== "MAP" && mode !== "PC") {
        throw new Error(
            "buildRoomingCsvForDate espera el modo MAP o PC."
        );
    }

    const selection = selectOutputRecords(reservations, selectedDate);
    const selectedPassengerCounts = countSelectedPassengers(
        selection.roomingPassengers
    );
    const selectedDateKey = parseDateKey(selectedDate);
    const filteredReservations = [];

    for (const reservation of selection.affectedReservations) {
        const passengers = [];

        for (const passenger of reservation.pasajeros || []) {
            const remainingOccurrences = selectedPassengerCounts.get(passenger) || 0;

            if (remainingOccurrences === 0) {
                continue;
            }

            selectedPassengerCounts.set(passenger, remainingOccurrences - 1);

            const arrivalDateKey = parseDateKey(passenger?.estadia?.ingreso);
            if (
                arrivalDateKey === selectedDateKey &&
                getMealRegime(passenger?.servicios) === mode
            ) {
                passengers.push(passenger);
            }
        }

        if (passengers.length > 0) {
            filteredReservations.push({
                ...reservation,
                pasajeros: passengers
            });
        }
    }

    const report = mode === "MAP"
        ? buildRoomingReport(filteredReservations)
        : buildPcRoomingReport(filteredReservations);
    const csv = report.filas.length === 0
        ? null
        : mode === "MAP"
            ? exportRoomingCsv(report.filas)
            : exportPcRoomingCsv(report.filas);

    return {
        ...report,
        csv
    };
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        buildRoomingCsvForDate,
        getMealRegime
    };
}
