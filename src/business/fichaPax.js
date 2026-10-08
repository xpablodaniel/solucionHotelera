const COMPANIONS_PER_PAGE = 3;


function normalizeSearchValue(value) {

    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim().toLocaleLowerCase();
}


function getDistinctRooms(rooms) {

    const seen = new Set();
    const result = [];

    for (const room of rooms) {

        if (!room || typeof room !== "object") {
            continue;
        }

        const key = JSON.stringify([
            room.alojamiento ?? null,
            room.numero ?? null
        ]);

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        result.push({
            alojamiento: room.alojamiento ?? null,
            numero: room.numero ?? null
        });
    }

    return result;
}


function projectPassenger(passenger) {

    if (!passenger || typeof passenger !== "object") {
        return passenger ?? null;
    }

    return {
        hotel: passenger.hotel ?? null,
        sede: passenger.sede ?? null,
        contacto: {
            email: passenger.contacto?.email ?? null,
            telefono: passenger.contacto?.telefono ?? null,
            celular: passenger.contacto?.celular ?? null
        },
        estadia: {
            ingreso: passenger.estadia?.ingreso ?? null,
            egreso: passenger.estadia?.egreso ?? null
        },
        servicios: passenger.servicios ?? null,
        pax: {
            tipoDocumento: passenger.pax?.tipoDocumento ?? null,
            numeroDocumento: passenger.pax?.numeroDocumento ?? null,
            nombre: passenger.pax?.nombre ?? null,
            fechaNacimiento: passenger.pax?.fechaNacimiento ?? null
        }
    };
}


function buildFichaPaxPages(reservation) {

    if (!reservation || typeof reservation !== "object") {
        throw new TypeError(
            "buildFichaPaxPages espera una reserva."
        );
    }

    if (!Array.isArray(reservation.pasajeros)) {
        throw new TypeError(
            "La reserva debe incluir un array de pasajeros."
        );
    }

    if (
        reservation.habitaciones !== undefined &&
        !Array.isArray(reservation.habitaciones)
    ) {
        throw new TypeError(
            "Las habitaciones de la reserva deben ser un array."
        );
    }

    if (reservation.pasajeros.length === 0) {
        return [];
    }

    const [sourceTitular, ...sourceCompanions] = reservation.pasajeros;
    const titular = projectPassenger(sourceTitular);
    const companions = sourceCompanions.map(projectPassenger);
    const titularStay = titular?.estadia ?? {
        ingreso: null,
        egreso: null
    };
    const habitaciones = getDistinctRooms(
        reservation.habitaciones || []
    );
    const pages = [];

    for (
        let start = 0;
        start < companions.length || start === 0;
        start += COMPANIONS_PER_PAGE
    ) {
        pages.push({
            voucher: reservation.voucher ?? null,
            titular,
            acompanantes: companions.slice(
                start,
                start + COMPANIONS_PER_PAGE
            ),
            estadia: {
                ingreso: titularStay.ingreso ?? null,
                egreso: titularStay.egreso ?? null
            },
            habitaciones: habitaciones.map(room => ({ ...room })),
            servicios: titular?.servicios ?? null
        });
    }

    return pages;
}


function searchFichaPax(reservations, query) {

    if (!Array.isArray(reservations)) {
        throw new TypeError(
            "searchFichaPax espera un array de reservas."
        );
    }

    const normalizedQuery = normalizeSearchValue(query);

    if (!normalizedQuery) {
        return [];
    }

    return reservations.filter(reservation => {

        if (!reservation || typeof reservation !== "object") {
            return false;
        }

        const voucher = normalizeSearchValue(reservation.voucher);

        if (voucher.includes(normalizedQuery)) {
            return true;
        }

        const passengers = Array.isArray(reservation.pasajeros)
            ? reservation.pasajeros
            : [];

        return passengers.some(passenger => {

            const pax = passenger?.pax;

            if (!pax || typeof pax !== "object") {
                return false;
            }

            return normalizeSearchValue(pax.numeroDocumento)
                    .includes(normalizedQuery) ||
                normalizeSearchValue(pax.nombre)
                    .includes(normalizedQuery);
        });
    });
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        buildFichaPaxPages,
        searchFichaPax
    };
}
