# Solution Hotel Tools v2

## Modelo de objetos JavaScript

**Versión:** 0.1
**Estado:** Borrador inicial

---

# 1. Objetivo

Definir la estructura de objetos que utilizará la aplicación para representar la información obtenida del CSV.

El CSV es considerado la **fuente de datos externa**. La aplicación deberá transformarlo en un modelo interno más claro y coherente.

La aplicación no debería trabajar directamente con posiciones como:

```javascript
fields[2]
fields[6]
fields[13]
fields[17]
```

Una vez procesado el CSV, debería poder trabajar con propiedades semánticas:

```javascript
reserva.voucher
reserva.pax
reserva.habitaciones
reserva.estadia
reserva.pago
reserva.servicios
```

---

# 2. Principio general

El flujo de información será:

```text
CSV
 │
 ▼
Parser
 │
 ▼
Registro CSV
 │
 ▼
Normalizador
 │
 ▼
Agrupador
 │
 ▼
Modelo de Reserva
 │
 ├── PAX
 ├── Habitaciones
 ├── Estadía
 ├── Pago
 ├── Servicios
 ├── Paquete
 └── Transporte
 │
 ▼
Herramientas hoteleras
```

---

# 3. Objeto Reserva

La entidad principal será `Reserva`.

Una primera representación conceptual:

```javascript
const reserva = {
    voucher: "",
    sede: "",
    alojamiento: "",
    paquete: "",
    servicios: [],
    transporte: {},
    estadia: {},
    pago: {},
    habitaciones: [],
    pax: [],
    tipo: "",
    advertencias: [],
    estadoProcesamiento: ""
};
```

No todas las propiedades deberán estar necesariamente completas.

El modelo debe poder representar datos incompletos sin inventar información.

---

# 4. Voucher

```javascript
reserva.voucher
```

Identifica la contratación o reserva según el gestor de origen.

Ejemplo:

```javascript
voucher: "30183187"
```

El voucher constituye uno de los principales criterios de agrupación.

---

# 5. Alojamiento

```javascript
reserva.alojamiento
```

Representará el establecimiento asociado a la reserva.

Ejemplo:

```javascript
alojamiento: {
    codigo: "227",
    descripcion: "HOTEL 23 DE MAYO"
}
```

La estructura queda abierta a futuras configuraciones de diferentes establecimientos.

---

# 6. Sede

```javascript
reserva.sede
```

Ejemplo:

```javascript
sede: "20 - MERLO"
```

La sede identifica el origen administrativo de la reserva.

---

# 7. Estadía

La estadía representa el período de alojamiento.

```javascript
reserva.estadia = {
    ingreso: "2026-02-11",
    egreso: "2026-02-20",
    noches: 9
};
```

La cantidad de noches deberá calcularse a partir de las fechas normalizadas.

No deberá depender de un valor almacenado en el CSV si puede calcularse de forma segura.

---

# 8. PAX

Cada pasajero será representado como un objeto independiente.

```javascript
const pax = {
    documento: {
        tipo: "DNI",
        numero: "10414277"
    },

    nombre: "VETRI MABEL CONCEPCION",

    edad: 73,

    fechaNacimiento: "1952-06-29",

    entidad: "SUTEBA",

    contacto: {
        email: "",
        telefono: "",
        celular: ""
    },

    habitacion: null,

    esTitular: false
};
```

---

# 9. Titular

El modelo debe permitir identificar al titular:

```javascript
pax.esTitular
```

Para reservas individuales, la regla inicial será:

```text
Primer PAX del voucher
        ↓
Titular / solicitante
```

Los siguientes PAX serán considerados acompañantes salvo que una regla específica indique lo contrario.

### Importante

La edad no determina al titular.

No debe utilizarse:

```javascript
pax.edad
```

para seleccionar automáticamente al titular.

---

# 10. Acompañantes

Los acompañantes forman parte del mismo conjunto:

```javascript
reserva.pax
```

Ejemplo:

```javascript
pax: [
    {
        nombre: "METAYER JAVIER",
        esTitular: true
    },
    {
        nombre: "LATRIGLIA PAOLA SUSANA",
        esTitular: false
    }
]
```

---

# 11. Habitación

Cada habitación será representada independientemente.

```javascript
const habitacion = {
    numero: "107",
    tipo: "DOBLE MATRIMONIAL",

    capacidad: 2,

    ocupacionDeclarada: 2,

    pax: []
};
```

La propiedad:

```javascript
capacidad
```

corresponde a `Cantidad plazas`.

Mientras que:

```javascript
ocupacionDeclarada
```

corresponde a `Plazas ocupadas`.

---

# 12. Ocupación real

La ocupación real deberá calcularse a partir de los PAX asociados a la habitación.

Por ejemplo:

```javascript
habitacion.capacidad = 3;
habitacion.ocupacionDeclarada = 1;
habitacion.pax.length = 1;
```

Resultado:

```text
Capacidad:       3
Ocupación CSV:   1
PAX encontrados: 1
```

No deben crearse pasajeros adicionales para completar la capacidad.

---

# 13. Relación PAX ↔ Habitación

Un PAX deberá poder estar relacionado con una habitación.

Por ejemplo:

```javascript
habitacion.pax = [
    pax1,
    pax2
];
```

Esto permite representar:

```text
Habitación 107
│
├── METAYER JAVIER
└── LATRIGLIA PAOLA SUSANA
```

---

# 14. Paquete

El paquete será almacenado como información de la reserva:

```javascript
reserva.paquete = {
    nombre: "PPJ MAR DEL PLATA 11/03 (13)"
};
```

No debe interpretarse automáticamente como contingente únicamente por su texto.

La clasificación deberá realizarse mediante reglas de negocio.

---

# 15. Servicios

Los servicios contratados se representarán como una estructura propia.

Ejemplo:

```javascript
reserva.servicios = [
    "MEDIA PENSION"
];
```

O:

```javascript
reserva.servicios = [
    "PENSION COMPLETA"
];
```

La representación podrá evolucionar hacia objetos si posteriormente necesitamos almacenar más información.

---

# 16. Comidas

Las modalidades conocidas inicialmente son:

```text
MAP
→ Media Pensión
→ Cena

PC
→ Pensión Completa
→ Almuerzo + Cena
```

La cantidad total de comidas no deberá almacenarse como un dato fijo si puede calcularse a partir de:

```text
PAX
+
noches
+
servicio
```

Las excepciones deberán ser manejadas por reglas específicas.

---

# 17. Pago

El pago será representado mediante un objeto independiente.

```javascript
reserva.pago = {
    estado: "O",
    descripcion: "Pagada"
};
```

Estados conocidos:

```text
O → Pagada
T → Falta pagar
M → Descuento de Haberes
N → Pago parcial
```

---

# 18. Estado de pago versus estado de procesamiento

Son conceptos diferentes.

### Estado de pago

```javascript
reserva.pago.estado
```

Indica la situación económica de la reserva.

### Estado de procesamiento

```javascript
reserva.estadoProcesamiento
```

Indica si la aplicación pudo interpretar correctamente los datos.

Ejemplo:

```javascript
estadoProcesamiento: "REVISAR"
```

Una reserva puede tener:

```javascript
pago.estado === "T"
```

y al mismo tiempo:

```javascript
estadoProcesamiento === "OK"
```

porque una reserva con pago pendiente puede ser perfectamente válida.

---

# 19. Transporte

La información de transporte tendrá su propia estructura:

```javascript
reserva.transporte = {
    descripcion: "",
    fecha: null,
    hora: null,
    parada: null
};
```

Ejemplo:

```javascript
transporte: {
    descripcion: "PPJ MDQ BUS 2 - PPJ MDQ 2",
    fecha: "2026-03-11",
    hora: null,
    parada: null
}
```

Cuando no corresponda:

```javascript
transporte: {
    descripcion: "Sin Transporte"
}
```

---

# 20. Advertencias

Cada reserva podrá contener advertencias:

```javascript
reserva.advertencias = [];
```

Ejemplo:

```javascript
advertencias: [
    "La cantidad de plazas no coincide con los PAX encontrados",
    "Email no informado"
]
```

Las advertencias no necesariamente invalidan la reserva.

---

# 21. Estado de procesamiento

Se propone inicialmente:

```text
OK
REVISAR
ERROR
```

### OK

La información pudo ser procesada sin inconsistencias relevantes.

### REVISAR

Existe una situación que requiere atención humana.

### ERROR

La información no puede ser procesada correctamente.

Ejemplo:

```javascript
estadoProcesamiento: "REVISAR"
```

---

# 22. Estructura completa inicial

Una reserva podría terminar representada de la siguiente manera:

```javascript
const reserva = {
    voucher: "30183187",

    alojamiento: {
        codigo: "227",
        descripcion: "HOTEL 23 DE MAYO"
    },

    sede: "20 - MERLO",

    paquete: {
        nombre: "MDP BAJA 2023"
    },

    servicios: [
        "MEDIA PENSION"
    ],

    transporte: {
        descripcion: "Sin Transporte",
        fecha: null,
        hora: null,
        parada: null
    },

    estadia: {
        ingreso: "2026-02-11",
        egreso: "2026-02-20",
        noches: 9
    },

    pago: {
        estado: "O",
        descripcion: "Pagada"
    },

    habitaciones: [
        {
            numero: "107",
            tipo: "DOBLE MATRIMONIAL",
            capacidad: 2,
            ocupacionDeclarada: 2,
            pax: []
        }
    ],

    pax: [
        {
            documento: {
                tipo: "DNI",
                numero: "12345678"
            },

            nombre: "APELLIDO NOMBRE",

            edad: 50,

            fechaNacimiento: "1976-01-01",

            entidad: "SUTEBA",

            contacto: {
                email: "",
                telefono: "",
                celular: ""
            },

            habitacion: "107",

            esTitular: true
        }
    ],

    advertencias: [],

    estadoProcesamiento: "OK"
};
```

Este ejemplo es conceptual y no representa datos reales.

---

# 23. Reserva individual

El modelo debe permitir representar:

```text
1 voucher
│
├── 1 titular
├── 1..N acompañantes
├── 1..N habitaciones
└── 1 estadía
```

---

# 24. Reserva de contingente

El mismo modelo debe poder representar un contingente:

```text
1 paquete / contingente
│
├── muchos PAX
├── muchas habitaciones
├── estadía común
├── servicios comunes
├── transporte
└── reglas específicas de contingente
```

La diferencia no debe obligarnos a utilizar estructuras de datos completamente diferentes.

La diferencia estará principalmente en las **reglas de negocio y herramientas de salida**.

---

# 25. Herramientas que consumirán el modelo

Una vez construido el modelo normalizado, las diferentes herramientas podrán utilizarlo.

```text
                 MODELO RESERVA
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
    ROOMING         VOUCHERS         COMIDAS
       │               │                │
       ▼               ▼                ▼
  habitaciones      documentos       cantidades
```

Para reservas individuales:

```text
MODELO
   ↓
Ficha PAX
Voucher
Rooming
Comidas
```

Para contingentes:

```text
MODELO
   ↓
Rooming de grupo
Vouchers correspondientes
Comidas de grupo
Transporte
```

No se generarán fichas PAX individuales para contingentes.

---

# 26. Principio fundamental

El modelo de objetos no debe contener lógica específica de presentación.

Por ejemplo, `Reserva` no debería saber:

```javascript
crearVoucherHTML()
```

ni:

```javascript
imprimirFicha()
```

El modelo representa datos.

Las herramientas de salida utilizarán esos datos:

```text
Modelo
   ↓
Generador de Voucher
   ↓
HTML

Modelo
   ↓
Generador de Rooming
   ↓
HTML

Modelo
   ↓
Generador de Comidas
   ↓
HTML
```

Esto permitirá modificar la presentación sin alterar la interpretación de las reservas.

---

# 27. Próxima etapa

Antes de implementar las clases o funciones definitivas, deberán definirse:

1. Parser del CSV.
2. Normalización de datos.
3. Agrupación por voucher.
4. Agrupación por habitación.
5. Identificación de reservas individuales.
6. Identificación de contingentes.
7. Reglas de titular y acompañantes.
8. Validaciones.
9. Reglas de comidas.
10. Reglas específicas de generación de documentos.

Este documento define el **modelo conceptual inicial** y podrá modificarse a medida que se incorporen nuevos casos reales.

**Versión actual: 0.1 — borrador inicial.**
