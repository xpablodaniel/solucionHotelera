var ReservationsCore = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/parser/csvParser.js
  var require_csvParser = __commonJS({
    "src/parser/csvParser.js"(exports, module) {
      function cleanText(value) {
        if (value === void 0 || value === null) {
          return null;
        }
        const text = String(value).trim();
        return text === "" ? null : text;
      }
      function parseInteger(value) {
        const text = cleanText(value);
        if (text === null) {
          return null;
        }
        const number = Number.parseInt(text, 10);
        return Number.isNaN(number) ? null : number;
      }
      function parseRoom(value) {
        const original = cleanText(value);
        if (original === null) {
          return {
            original: null,
            numero: null,
            asignacion: null
          };
        }
        const match = original.match(/^(\d+)\s*([A-Za-z])?$/);
        if (!match) {
          return {
            original,
            numero: original,
            asignacion: null
          };
        }
        return {
          original,
          numero: match[1],
          asignacion: match[2] ? match[2].toUpperCase() : null
        };
      }
      function parseRow(fields) {
        if (!Array.isArray(fields)) {
          throw new TypeError("parseRow espera un array de columnas.");
        }
        if (fields.length !== 28) {
          throw new Error(
            `Cantidad de columnas inesperada: ${fields.length}. Se esperaban 28.`
          );
        }
        return {
          alojamiento: cleanText(fields[0]),
          hotel: cleanText(fields[1]),
          habitacion: parseRoom(fields[2]),
          tipoHabitacion: cleanText(fields[3]),
          observacionHabitacion: cleanText(fields[4]),
          plazas: {
            cantidad: parseInteger(fields[5]),
            ocupadas: parseInteger(fields[10])
          },
          voucher: cleanText(fields[6]),
          sede: cleanText(fields[7]),
          estadia: {
            ingreso: cleanText(fields[8]),
            egreso: cleanText(fields[9])
          },
          pax: {
            tipoDocumento: cleanText(fields[11]),
            numeroDocumento: cleanText(fields[12]),
            nombre: cleanText(fields[13]),
            edad: parseInteger(fields[14]),
            fechaNacimiento: cleanText(fields[24])
          },
          entidad: cleanText(fields[15]),
          servicios: cleanText(fields[16]),
          paquete: cleanText(fields[17]),
          transporte: cleanText(fields[18]),
          viaje: {
            fecha: cleanText(fields[19]),
            hora: cleanText(fields[20]),
            parada: cleanText(fields[21])
          },
          contacto: {
            email: cleanText(fields[22]),
            telefono: cleanText(fields[25]),
            celular: cleanText(fields[26])
          },
          estado: cleanText(fields[23]),
          usuario: cleanText(fields[27])
        };
      }
      function parseCSVLine(line) {
        const fields = [];
        let field = "";
        let insideQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              insideQuotes = !insideQuotes;
            }
            continue;
          }
          if (char === "," && !insideQuotes) {
            fields.push(field);
            field = "";
            continue;
          }
          field += char;
        }
        fields.push(field);
        return fields;
      }
      function parseCSV(csvText) {
        if (typeof csvText !== "string") {
          throw new TypeError(
            "parseCSV espera un texto CSV."
          );
        }
        const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "");
        if (lines.length === 0) {
          return [];
        }
        const header = parseCSVLine(lines[0]);
        const dataRows = lines.slice(1);
        return dataRows.map((line) => parseCSVLine(line)).filter((fields) => fields.length === 28).map((fields) => parseRow(fields));
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          cleanText,
          parseInteger,
          parseRoom,
          parseRow,
          parseCSV,
          parseCSVLine
        };
      }
    }
  });

  // src/hotel/rooms.js
  var require_rooms = __commonJS({
    "src/hotel/rooms.js"(exports, module) {
      var ROOM_TYPES = Object.freeze({
        II: Object.freeze({
          codigo: "II",
          tipo: "DOBLE INDIVIDUAL",
          capacidad: 2
        }),
        X: Object.freeze({
          codigo: "X",
          tipo: "DOBLE MATRIMONIAL",
          capacidad: 2
        }),
        III: Object.freeze({
          codigo: "III",
          tipo: "TRIPLE INDIVIDUAL",
          capacidad: 3
        }),
        XI: Object.freeze({
          codigo: "XI",
          tipo: "TRIPLE MATRIMONIAL",
          capacidad: 3
        }),
        XII: Object.freeze({
          codigo: "XII",
          tipo: "CUADRUPLE",
          capacidad: 4
        })
      });
      var ROOMS_DATA = [
        // -----------------------------------------------------
        // PRIMER PISO
        // -----------------------------------------------------
        ["101", 1, "X"],
        ["102", 1, "X"],
        ["103", 1, "X"],
        ["104", 1, "II"],
        ["105", 1, "X"],
        ["106", 1, "X"],
        ["107", 1, "X"],
        ["108", 1, "II"],
        ["109", 1, "X"],
        ["110", 1, "X"],
        ["111", 1, "X"],
        ["112", 1, "X"],
        ["113", 1, "X"],
        ["114", 1, "II"],
        ["115", 1, "X"],
        ["116", 1, "III"],
        ["117", 1, "III"],
        ["118", 1, "X"],
        ["119", 1, "X"],
        ["120", 1, "X"],
        ["121", 1, "X"],
        // -----------------------------------------------------
        // SEGUNDO PISO
        // -----------------------------------------------------
        ["222", 2, "X"],
        ["223", 2, "II"],
        ["224", 2, "II"],
        ["225", 2, "X"],
        ["226", 2, "X"],
        ["227", 2, "X"],
        ["228", 2, "X"],
        ["229", 2, "X"],
        ["230", 2, "X"],
        ["231", 2, "II"],
        ["232", 2, "II"],
        ["233", 2, "X"],
        ["234", 2, "X"],
        ["235", 2, "X"],
        ["236", 2, "X"],
        ["237", 2, "III"],
        ["238", 2, "III"],
        ["239", 2, "X"],
        ["240", 2, "XII"],
        ["241", 2, "X"],
        ["242", 2, "X"],
        // -----------------------------------------------------
        // TERCER PISO
        // -----------------------------------------------------
        ["343", 3, "X"],
        ["344", 3, "X"],
        ["345", 3, "X"],
        ["346", 3, "X"],
        ["347", 3, "X"],
        ["348", 3, "X"],
        ["349", 3, "II"],
        ["350", 3, "II"],
        ["351", 3, "X"],
        ["352", 3, "X"],
        ["353", 3, "II"]
      ];
      var ROOMS = Object.freeze(
        ROOMS_DATA.map(([numero, piso, codigo]) => {
          const type = ROOM_TYPES[codigo];
          if (!type) {
            throw new Error(
              `C\xF3digo de habitaci\xF3n desconocido: ${codigo}`
            );
          }
          return Object.freeze({
            numero,
            piso,
            codigoTipo: type.codigo,
            tipo: type.tipo,
            capacidad: type.capacidad
          });
        })
      );
      var HOTEL_31_AGOSTO_ROOM_TYPES = Object.freeze({
        II: Object.freeze({
          codigo: "II",
          tipo: "DOBLE INDIVIDUAL",
          capacidad: 2
        }),
        X: Object.freeze({
          codigo: "X",
          tipo: "DOBLE MATRIMONIAL",
          capacidad: 2
        }),
        III: Object.freeze({
          codigo: "III",
          tipo: "TRIPLE INDIVIDUAL",
          capacidad: 3
        }),
        XI: Object.freeze({
          codigo: "XI",
          tipo: "TRIPLE MIXTA",
          capacidad: 3
        }),
        XIII: Object.freeze({
          codigo: "XIII",
          tipo: "QUINTUPLE FAMILIAR GRANDE",
          capacidad: 5
        })
      });
      var HOTEL_31_AGOSTO_ROOMS_DATA = [
        ["5", 0, "X"],
        ["6", 0, "X"],
        ["7", 0, "XI"],
        ["8", 0, "X"],
        ["9", 1, "X"],
        ["10", 1, "X"],
        ["11", 1, "XI"],
        ["12", 1, "XI"],
        ["13", 1, "III"],
        ["14", 1, "II"],
        ["15", 1, "X"],
        ["16", 1, "X"],
        ["17", 1, "X"],
        ["18", 2, "X"],
        ["19", 2, "X"],
        ["20", 2, "XI"],
        ["21", 2, "XI"],
        ["22", 2, "XI"],
        ["23", 2, "II"],
        ["24", 2, "X"],
        ["25", 2, "X"],
        ["26", 2, "X"],
        ["27", 3, "XIII"],
        ["28", 3, "XI"]
      ];
      var HOTEL_31_AGOSTO_ROOMS = Object.freeze(
        HOTEL_31_AGOSTO_ROOMS_DATA.map(([numero, piso, codigo]) => {
          const type = HOTEL_31_AGOSTO_ROOM_TYPES[codigo];
          if (!type) {
            throw new Error(
              `C\xF3digo de habitaci\xF3n desconocido para Hotel 31 de Agosto: ${codigo}`
            );
          }
          return Object.freeze({
            numero,
            piso,
            codigoTipo: type.codigo,
            tipo: type.tipo,
            capacidad: type.capacidad
          });
        })
      );
      var HOTEL_INVENTORIES = Object.freeze({
        "900": Object.freeze({
          alojamiento: "900",
          hotel: "HOTEL 23 DE MAYO",
          roomTypes: ROOM_TYPES,
          rooms: ROOMS
        }),
        "901": Object.freeze({
          alojamiento: "901",
          hotel: "HOTEL 31 DE AGOSTO",
          roomTypes: HOTEL_31_AGOSTO_ROOM_TYPES,
          rooms: HOTEL_31_AGOSTO_ROOMS
        })
      });
      function getHotelInventory(alojamiento) {
        return HOTEL_INVENTORIES[String(alojamiento).trim()] || null;
      }
      function getRoom(alojamientoOrNumero, numero) {
        const hasAccommodation = numero !== void 0;
        const inventory = getHotelInventory(
          hasAccommodation ? alojamientoOrNumero : "900"
        );
        if (!inventory) {
          return null;
        }
        const roomNumber = String(
          hasAccommodation ? numero : alojamientoOrNumero
        ).trim();
        return inventory.rooms.find(
          (room) => room.numero === roomNumber
        ) || null;
      }
      function getAllRooms(alojamiento = "900") {
        const inventory = getHotelInventory(alojamiento);
        return inventory ? inventory.rooms : [];
      }
      function getRoomsByFloor(alojamientoOrFloor, floor) {
        const hasAccommodation = floor !== void 0;
        const inventory = getHotelInventory(
          hasAccommodation ? alojamientoOrFloor : "900"
        );
        const targetFloor = hasAccommodation ? floor : alojamientoOrFloor;
        return (inventory ? inventory.rooms : []).filter(
          (room) => room.piso === targetFloor
        );
      }
      function getRoomsByType(alojamientoOrCode, code) {
        const hasAccommodation = code !== void 0;
        const inventory = getHotelInventory(
          hasAccommodation ? alojamientoOrCode : "900"
        );
        const targetCode = hasAccommodation ? code : alojamientoOrCode;
        return (inventory ? inventory.rooms : []).filter(
          (room) => room.codigoTipo === targetCode
        );
      }
      function getTotalCapacity(alojamiento = "900") {
        const inventory = getHotelInventory(alojamiento);
        if (!inventory) {
          return 0;
        }
        return inventory.rooms.reduce(
          (total, room) => total + room.capacidad,
          0
        );
      }
      function getRoomCount(alojamiento = "900") {
        const inventory = getHotelInventory(alojamiento);
        return inventory ? inventory.rooms.length : 0;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          ROOM_TYPES,
          ROOMS,
          HOTEL_31_AGOSTO_ROOM_TYPES,
          HOTEL_31_AGOSTO_ROOMS,
          HOTEL_INVENTORIES,
          getRoom,
          getAllRooms,
          getRoomsByFloor,
          getRoomsByType,
          getTotalCapacity,
          getRoomCount
        };
      }
    }
  });

  // src/business/reservation.js
  var require_reservation = __commonJS({
    "src/business/reservation.js"(exports, module) {
      var {
        getRoom
      } = require_rooms();
      function groupByVoucher(records) {
        if (!Array.isArray(records)) {
          throw new TypeError(
            "groupByVoucher espera un array de registros."
          );
        }
        const reservations = /* @__PURE__ */ new Map();
        for (const record of records) {
          const voucher = record.voucher;
          if (!voucher) {
            continue;
          }
          if (!reservations.has(voucher)) {
            reservations.set(voucher, {
              voucher,
              pasajeros: []
            });
          }
          reservations.get(voucher).pasajeros.push(record);
        }
        return Array.from(reservations.values());
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          groupByVoucher
        };
      }
      function groupByRoom(records, esContingente = false) {
        if (!Array.isArray(records)) {
          throw new TypeError(
            "groupByRoom espera un array de registros."
          );
        }
        const rooms = /* @__PURE__ */ new Map();
        for (const record of records) {
          if (!record.habitacion) {
            continue;
          }
          const numero = record.habitacion.numero;
          if (!numero) {
            continue;
          }
          const alojamiento = record.alojamiento || null;
          const roomKey = JSON.stringify([alojamiento, numero]);
          if (!rooms.has(roomKey)) {
            rooms.set(roomKey, {
              alojamiento,
              numero,
              inventario: alojamiento ? getRoom(alojamiento, numero) : getRoom(numero),
              capacidad: record.plazas ? record.plazas.cantidad : null,
              ocupadasInformadas: record.plazas ? record.plazas.ocupadas : null,
              pasajeros: [],
              asignaciones: []
            });
          }
          const room = rooms.get(roomKey);
          room.pasajeros.push(record);
          if (esContingente && record.habitacion.asignacion) {
            room.asignaciones.push(
              record.habitacion.asignacion
            );
          }
        }
        return Array.from(rooms.values());
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          groupByVoucher,
          groupByRoom
        };
      }
    }
  });

  // src/business/classification.js
  var require_classification = __commonJS({
    "src/business/classification.js"(exports, module) {
      function normalizeText(value) {
        if (value === void 0 || value === null) {
          return "";
        }
        return String(value).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }
      function hasTransport(record) {
        const transporte = normalizeText(
          record?.transporte
        );
        if (!transporte) {
          return false;
        }
        return !(transporte === "SIN TRANSPORTE" || transporte === "SIN TRANSPORTE ");
      }
      function hasFullBoard(record) {
        const servicios = normalizeText(
          record?.servicios
        );
        return servicios.includes("PENSION COMPLETA");
      }
      function hasLunchAndDinner(record) {
        const servicios = normalizeText(
          record?.servicios
        );
        return servicios.includes("ALMUERZO Y CENA") || servicios.includes("ALMUERZO-CENA") || servicios.includes("ALMUERZO - CENA");
      }
      function hasGroupPackage(record) {
        const paquete = normalizeText(
          record?.paquete
        );
        if (!paquete) {
          return false;
        }
        return paquete.includes("PPJ") || paquete.includes("EGRESADO") || paquete.includes("JUEGOS BONAERENSES");
      }
      function analyzeRecord(record) {
        if (!record || typeof record !== "object") {
          throw new TypeError(
            "analyzeRecord espera un registro."
          );
        }
        const transporte = hasTransport(record);
        const pensionCompleta = hasFullBoard(record);
        const almuerzoCena = hasLunchAndDinner(record);
        const paqueteContingente = hasGroupPackage(record);
        return {
          transporte,
          servicios: {
            pensionCompleta,
            almuerzoCena
          },
          paquete: {
            contingente: paqueteContingente
          }
        };
      }
      function classifyRecord(record) {
        const evidencias = analyzeRecord(record);
        const transporte = normalizeText(record.transporte);
        const razones = [];
        let puntosContingente = 0;
        let puntosIndividual = 0;
        if (evidencias.transporte) {
          puntosContingente++;
          razones.push(
            "Tiene transporte"
          );
        } else if (transporte === "SIN TRANSPORTE") {
          puntosIndividual++;
          razones.push(
            "Sin transporte"
          );
        } else {
          razones.push(
            "Transporte no informado"
          );
        }
        if (evidencias.servicios.pensionCompleta) {
          puntosContingente++;
          razones.push(
            "Tiene pensi\xF3n completa"
          );
        }
        if (evidencias.servicios.almuerzoCena) {
          puntosContingente++;
          razones.push(
            "Tiene almuerzo y cena"
          );
        }
        if (evidencias.paquete.contingente) {
          puntosContingente++;
          razones.push(
            "El paquete contiene indicador de contingente"
          );
        }
        let tipo;
        if (puntosContingente >= 2 && puntosContingente > puntosIndividual) {
          tipo = "CONTINGENTE";
        } else if (puntosIndividual > puntosContingente) {
          tipo = "INDIVIDUAL";
        } else {
          tipo = "NO_CLASIFICADA";
        }
        return {
          tipo,
          puntos: {
            contingente: puntosContingente,
            individual: puntosIndividual
          },
          razones,
          evidencias
        };
      }
      function classifyReservation(records) {
        if (!Array.isArray(records)) {
          throw new TypeError(
            "classifyReservation espera un array de registros."
          );
        }
        if (records.length === 0) {
          return {
            tipo: "NO_CLASIFICADA",
            consistente: true,
            pasajeros: 0,
            resultados: [],
            advertencias: [
              "La reserva no contiene registros."
            ]
          };
        }
        const resultados = records.map(
          (record) => classifyRecord(record)
        );
        const tipos = new Set(
          resultados.map((resultado) => resultado.tipo)
        );
        const advertencias = [];
        if (tipos.size > 1) {
          advertencias.push(
            "Los pasajeros de la reserva presentan clasificaciones diferentes."
          );
        }
        let tipo;
        if (tipos.has("CONTINGENTE")) {
          tipo = "CONTINGENTE";
        } else if (tipos.has("NO_CLASIFICADA")) {
          tipo = "NO_CLASIFICADA";
        } else {
          tipo = "INDIVIDUAL";
        }
        return {
          tipo,
          consistente: tipos.size === 1,
          pasajeros: records.length,
          resultados,
          advertencias
        };
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          normalizeText,
          hasTransport,
          hasFullBoard,
          hasLunchAndDinner,
          hasGroupPackage,
          analyzeRecord,
          classifyRecord,
          classifyReservation
        };
      }
    }
  });

  // src/business/processReservations.js
  var require_processReservations = __commonJS({
    "src/business/processReservations.js"(exports, module) {
      var {
        groupByVoucher,
        groupByRoom
      } = require_reservation();
      var {
        classifyReservation
      } = require_classification();
      function processReservations(records) {
        if (!Array.isArray(records)) {
          throw new TypeError(
            "processReservations espera un array de registros."
          );
        }
        const grouped = groupByVoucher(records);
        return grouped.map((group) => {
          const pasajeros = group.pasajeros;
          const clasificacion = classifyReservation(pasajeros);
          const esContingente = clasificacion.tipo === "CONTINGENTE";
          const habitaciones = groupByRoom(pasajeros, esContingente);
          return {
            voucher: group.voucher,
            pasajeros,
            cantidadPasajeros: pasajeros.length,
            clasificacion: {
              tipo: clasificacion.tipo,
              consistente: clasificacion.consistente,
              advertencias: clasificacion.advertencias
            },
            habitaciones
          };
        });
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          processReservations
        };
      }
    }
  });

  // src/browser/reservations.js
  var require_reservations = __commonJS({
    "src/browser/reservations.js"(exports, module) {
      var {
        parseCSV,
        parseCSVLine
      } = require_csvParser();
      var {
        processReservations
      } = require_processReservations();
      var {
        classifyRecord,
        classifyReservation
      } = require_classification();
      module.exports = {
        parseCSV,
        parseCSVLine,
        processReservations,
        classifyRecord,
        classifyReservation
      };
    }
  });
  return require_reservations();
})();
