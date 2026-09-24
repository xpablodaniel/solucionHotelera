function normalizeText(value) {

    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}


function parseDate(value) {

    const text = normalizeText(value);
    let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

        if (!match) {
            return null;
        }

        match = [match[0], match[3], match[2], match[1]];
    }

    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}


function validateMealVoucher(input) {

    if (!input || typeof input !== "object") {
        throw new TypeError(
            "validateMealVoucher espera un objeto."
        );
    }

    const nombre = normalizeText(input.nombre);
    const dni = normalizeText(input.dni);
    const hotel = normalizeText(input.hotel || "23 DE MAYO").toUpperCase();
    const fecha = parseDate(input.fecha);
    const habitacion = normalizeText(input.habitacion);
    const cantidadPersonas = Number(input.cantidadPersonas);
    const errors = [];

    if (!nombre) {
        errors.push("nombre obligatorio");
    }

    if (!["23 DE MAYO", "31 DE AGOSTO"].includes(hotel)) {
        errors.push("hotel invalido");
    }

    if (!/^\d+$/.test(dni)) {
        errors.push("DNI numerico obligatorio");
    }

    if (!fecha) {
        errors.push("fecha invalida");
    }

    if (!habitacion) {
        errors.push("habitacion obligatoria");
    }

    if (
        !Number.isInteger(cantidadPersonas) ||
        cantidadPersonas <= 0
    ) {
        errors.push("cantidadPersonas debe ser un entero mayor que cero");
    }

    if (errors.length > 0) {
        const error = new Error(errors.join("; "));
        error.code = "INVALID_MEAL_VOUCHER";
        error.errors = errors;
        throw error;
    }

    return {
        nombre: nombre.toUpperCase(),
        dni,
        hotel,
        fecha,
        habitacion,
        cantidadPersonas
    };
}


function mealVoucherFilename(data) {

    const voucher = validateMealVoucher(data);
    const safeDni = voucher.dni.replace(/[^0-9]/g, "");
    const safeDate = voucher.fecha.split("/").reverse().join("-");

    return `voucher_cena_${safeDni}_${safeDate}.pdf`;
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        mealVoucherFilename,
        normalizeText,
        parseDate,
        validateMealVoucher
    };
}