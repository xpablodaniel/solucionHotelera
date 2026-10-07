function normalizeDocumentType(value) {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim().toUpperCase();
    return normalized === "" ? null : normalized;
}


function normalizeDocumentNumber(value) {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();
    return normalized === "" ? null : normalized;
}


/**
 * Finds possible duplicate passengers within each reservation.
 *
 * Results identify the first passenger with a document identity and each
 * later passenger sharing that identity. Input reservations are not modified.
 */
function findPotentialPassengerDuplicates(reservations) {
    if (!Array.isArray(reservations)) {
        throw new TypeError(
            "findPotentialPassengerDuplicates espera un array de reservas."
        );
    }

    const duplicates = [];

    for (const reservation of reservations) {
        const passengers = Array.isArray(reservation?.pasajeros)
            ? reservation.pasajeros
            : [];
        const firstPassengerByIdentity = new Map();

        for (const [index, passenger] of passengers.entries()) {
            const documentType = normalizeDocumentType(
                passenger?.pax?.tipoDocumento
            );
            const documentNumber = normalizeDocumentNumber(
                passenger?.pax?.numeroDocumento
            );

            if (documentType === null || documentNumber === null) {
                continue;
            }

            const identity = JSON.stringify([
                documentType,
                documentNumber
            ]);

            if (!firstPassengerByIdentity.has(identity)) {
                firstPassengerByIdentity.set(identity, index);
                continue;
            }

            duplicates.push({
                voucher: reservation?.voucher ?? null,
                firstPassengerIndex: firstPassengerByIdentity.get(identity),
                duplicatePassengerIndex: index,
                tipoDocumento: documentType,
                numeroDocumento: documentNumber
            });
        }
    }

    return duplicates;
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        findPotentialPassengerDuplicates
    };
}
