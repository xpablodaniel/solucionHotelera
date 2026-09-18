# Solucion Hotel Tools v2

## Modelo de datos CSV

**Versión:** 0.1
**Estado:** Borrador inicial
**Fuente:** archivo CSV generado por el gestor de reservas

---

# 1. Objetivo

Este documento describe la estructura del archivo CSV utilizado como fuente de datos para **Solucion Hotel Tools v2**.

El CSV contiene información relacionada con:

* alojamiento;
* habitaciones;
* reservas;
* vouchers;
* pasajeros;
* estadías;
* servicios;
* paquetes;
* transporte;
* estado de pago.

La aplicación debe procesar estos datos para generar diferentes herramientas operativas hoteleras.

El archivo de origen puede contener errores o inconsistencias producidas durante la carga manual de las reservas. Por este motivo, la aplicación no debe depender exclusivamente de un campo aislado para interpretar una reserva.

---

# 2. Estructura general

Los archivos analizados utilizan una estructura de **28 columnas**, numeradas desde `0` hasta `27`.

| Índice | Campo                  |
| -----: | ---------------------- |
|      0 | Código de alojamiento  |
|      1 | Descripción            |
|      2 | Nro. habitación        |
|      3 | Tipo habitación        |
|      4 | Observación habitación |
|      5 | Cantidad plazas        |
|      6 | Voucher                |
|      7 | Sede                   |
|      8 | Fecha de ingreso       |
|      9 | Fecha de egreso        |
|     10 | Plazas ocupadas        |
|     11 | Tipo documento         |
|     12 | Nro. documento         |
|     13 | Apellido y nombre      |
|     14 | Edad                   |
|     15 | Entidad                |
|     16 | Servicios              |
|     17 | Paquete                |
|     18 | Transporte             |
|     19 | Fecha viaje            |
|     20 | Hora viaje             |
|     21 | Parada                 |
|     22 | Email                  |
|     23 | Estado                 |
|     24 | Fecha de nacimiento    |
|     25 | Teléfono               |
|     26 | Celular                |
|     27 | Usuario                |

---

# 3. Principio de interpretación

Una fila del CSV representa información correspondiente a un pasajero y su alojamiento, pero **una fila no necesariamente representa una reserva completa**.

Una reserva puede estar compuesta por varias filas relacionadas mediante:

* voucher;
* habitación;
* paquete;
* fechas;
* otros datos coincidentes.

Por este motivo, el procesamiento debe contemplar dos niveles:

```text
FILA CSV
   ↓
REGISTRO DE PASAJERO
   ↓
AGRUPACIÓN
   ↓
RESERVA
```

---

# 4. Descripción de las columnas

## 4.1 Índice 0 — Código de alojamiento

Identifica el alojamiento o establecimiento correspondiente al registro.

Ejemplo:

```text
227
```

El código debe conservarse como dato original.

---

## 4.2 Índice 1 — Descripción

Contiene la descripción del alojamiento.

Ejemplo:

```text
HOTEL 23 DE MAYO
```

Puede utilizarse para identificar el establecimiento al que pertenece la reserva.

---

## 4.3 Índice 2 — Nro. habitación

Identifica la habitación asignada.

Ejemplos:

```text
104
107
227 A
227 B
```

El número o identificador de habitación debe conservarse como texto, ya que puede contener letras.

No debe asumirse que el valor siempre es exclusivamente numérico.

---

## 4.4 Índice 3 — Tipo habitación

Describe el tipo o modalidad de habitación.

Ejemplos:

```text
DOBLE INDIVIDUALES
DOBLE MATRIMONIAL
DOBLE A COMPARTIR
TRIPLE
TRIPLE INDIVIDUAL
DBL IND
```

El tipo de habitación describe la capacidad o modalidad prevista, pero **no determina por sí solo la cantidad real de PAX**.

---

## 4.5 Índice 4 — Observación habitación

Contiene observaciones relacionadas con la habitación.

Puede encontrarse vacío.

Cuando exista información, debe conservarse.

---

## 4.6 Índice 5 — Cantidad de plazas

Representa la cantidad de plazas asociadas a la habitación según la información proporcionada por el gestor.

Este campo puede presentar inconsistencias debido a errores de carga.

Por lo tanto:

> `Cantidad plazas` no debe utilizarse automáticamente como cantidad real de PAX.

Debe contrastarse con:

* PAX;
* habitación;
* voucher;
* plazas ocupadas;
* tipo de habitación.

---

## 4.7 Índice 6 — Voucher

Identifica la contratación o reserva.

Ejemplo:

```text
30243127
```

El voucher constituye uno de los principales elementos para agrupar las filas correspondientes a una misma contratación.

Una misma reserva puede contener:

* un voucher;
* varios PAX;
* una o varias habitaciones.

---

## 4.8 Índice 7 — Sede

Identifica la sede o seccional desde la cual se realizó la reserva.

Ejemplo:

```text
20 - MERLO
```

El dato debe conservarse y puede ser utilizado posteriormente para identificar el origen de la reserva.

---

## 4.9 Índice 8 — Fecha de ingreso

Indica la fecha de ingreso al establecimiento.

Ejemplos de formatos encontrados:

```text
12/7/2023
13/07/2023
```

El sistema debe aceptar diferentes representaciones equivalentes de la fecha y normalizarlas internamente.

Para la presentación podrá utilizarse el formato habitual:

```text
dd/mm/yyyy
```

---

## 4.10 Índice 9 — Fecha de egreso

Indica la fecha prevista de salida.

Se utiliza conjuntamente con la fecha de ingreso para determinar la estadía.

Ejemplo:

```text
Ingreso: 11/02/2026
Egreso: 20/02/2026
```

Resultado:

```text
9 noches
```

---

## 4.11 Índice 10 — Plazas ocupadas

Representa la cantidad de plazas ocupadas según la información proporcionada por el gestor.

Este campo debe distinguirse de `Cantidad plazas`.

Conceptualmente:

```text
Cantidad plazas
→ capacidad/plazas asignadas

Plazas ocupadas
→ ocupación declarada
```

Sin embargo, ambos valores pueden contener errores de carga.

La ocupación real debe contrastarse con los PAX efectivamente asociados.

---

## 4.12 Índice 11 — Tipo de documento

Indica el tipo de documento del pasajero.

Ejemplo:

```text
DNI
```

---

## 4.13 Índice 12 — Nro. documento

Contiene el número de documento del pasajero.

Este dato constituye un identificador importante del PAX.

En un repositorio público, los datos reales deben anonimizarse.

---

## 4.14 Índice 13 — Apellido y nombre

Contiene el nombre completo del pasajero.

Ejemplo:

```text
VETRI MABEL CONCEPCION
```

El campo puede presentar:

* mayúsculas;
* minúsculas;
* espacios adicionales;
* errores de escritura;
* comas introducidas accidentalmente.

El sistema podrá normalizar la presentación sin destruir el valor original.

---

## 4.15 Índice 14 — Edad

Contiene la edad del pasajero.

La edad es información del PAX.

No debe utilizarse para determinar automáticamente quién es el titular de una reserva.

### Regla

El titular de una reserva individual se determina por el **orden original de aparición dentro del voucher**, no por edad.

Esto evita situaciones como:

```text
PAX 1 → afiliado / solicitante, 32 años
PAX 2 → acompañante, 45 años
PAX 3 → hijo, 5 años
```

El PAX 1 continúa siendo el titular aunque sea menor que el PAX 2.

---

## 4.16 Índice 15 — Entidad

Identifica la entidad asociada al pasajero o reserva.

Ejemplo:

```text
SUTEBA
```

El significado concreto y las posibles variantes deberán documentarse a medida que se incorporen nuevos archivos.

---

## 4.17 Índice 16 — Servicios

Indica los servicios contratados.

Ejemplos:

```text
MEDIA PENSION
PENSIÓN COMPLETA
```

Este campo interviene en el procesamiento de las comidas.

### MAP

Media Pensión:

```text
MAP
→ Cena
```

### PC

Pensión Completa:

```text
PC
→ Almuerzo + Cena
```

La lógica exacta de cantidad de comidas se definirá en las reglas de negocio.

---

## 4.18 Índice 17 — Paquete

El campo `Paquete` contiene información relacionada con el paquete contratado.

Ejemplos:

```text
PPJ MAR DEL PLATA 11/03 (13)
MDP BAJA 2023
MDQ-SALUD [4493]
MDP FEBRERO 2026
```

Este campo es especialmente importante para identificar determinados contingentes.

Por ejemplo, los grupos PPJ pueden aparecer asociados a un paquete que identifica el contingente.

Sin embargo:

> La clasificación de una reserva como contingente no debe depender exclusivamente de una coincidencia textual en una única fila.

Debe considerarse el conjunto de registros relacionados.

---

## 4.19 Índice 18 — Transporte

Contiene información relacionada con el transporte.

Ejemplos:

```text
Sin Transporte
PPJ MDQ BUS 2 - PPJ MDQ 2
```

Puede ser utilizado para herramientas operativas relacionadas con viajes y traslados.

---

## 4.20 Índice 19 — Fecha viaje

Indica la fecha asociada al viaje/transporte.

Puede estar vacío cuando no corresponde.

---

## 4.21 Índice 20 — Hora viaje

Indica el horario relacionado con el viaje.

Puede estar vacío.

---

## 4.22 Índice 21 — Parada

Contiene información sobre la parada asociada al transporte.

Puede estar vacío.

---

## 4.23 Índice 22 — Email

Contiene el correo electrónico del pasajero.

Puede estar vacío.

El sistema no debe inventar un correo electrónico cuando el dato no esté presente.

En una futura versión podría evaluarse la recuperación de datos desde una fuente confiable.

---

# 5. Índice 23 — Estado

El campo `Estado` representa la **situación de pago de la reserva/estadía**.

Los códigos actualmente conocidos son:

| Código | Significado          |
| ------ | -------------------- |
| `O`    | Pagada               |
| `T`    | Falta pagar          |
| `M`    | Descuento de Haberes |
| `N`    | Pago parcial         |

---

## 5.1 Estado `O` — Pagada

Indica que la estadía se encuentra paga.

Es la situación esperada para una reserva normal al momento de presentarse el pasajero en el establecimiento.

---

## 5.2 Estado `T` — Falta pagar

Indica que la estadía todavía debe ser abonada.

Este estado **no debe considerarse automáticamente un error**.

Existen reservas realizadas por situaciones especiales, como:

* salud;
* emergencia.

En estos casos puede ocurrir que el usuario no haya podido concretar el pago previamente y deba realizarlo en el mostrador durante el check-in.

Por lo tanto:

```text
T
≠
Reserva inválida
```

Debe interpretarse como:

```text
Pago pendiente
```

---

## 5.3 Estado `M` — Descuento de Haberes

Indica que la estadía se abona mediante el sistema de **Descuento de Haberes**.

Debe tratarse como una modalidad válida de pago y no como un pago pendiente común.

---

## 5.4 Estado `N` — Pago parcial

Indica que el pasajero realizó un pago parcial de la estadía.

El saldo restante debe considerarse pendiente de acuerdo con las reglas operativas correspondientes.

---

## 5.5 Principio para el campo Estado

El estado de pago:

* debe conservarse;
* debe formar parte del modelo de reserva;
* puede utilizarse para generar advertencias operativas;
* no debe utilizarse por sí solo para determinar si una reserva es válida o inválida.

Por ejemplo:

```text
Reserva
│
└── Pago
     ├── estado: T
     └── descripción: Pago pendiente
```

Esto permitirá que una futura herramienta muestre:

```text
⚠ Pago pendiente
```

sin clasificar la reserva como defectuosa.

---

# 6. Índice 24 — Fecha de nacimiento

Contiene la fecha de nacimiento del pasajero.

Ejemplo:

```text
29/06/1952
```

Es un dato relacionado directamente con el PAX.

Debe conservarse y normalizarse cuando sea necesario.

---

# 7. Índice 25 — Teléfono

Contiene el número telefónico informado.

Puede estar vacío.

---

# 8. Índice 26 — Celular

Contiene el número de teléfono celular informado.

Puede estar vacío.

---

# 9. Índice 27 — Usuario

Identifica al usuario que intervino en la carga o generación del registro dentro del sistema de origen.

Su significado exacto y utilización futura deberán confirmarse con más información del gestor.

---

# 10. Relación entre las filas

Una de las características fundamentales del CSV es que la información de una reserva puede estar distribuida en varias filas.

Por ejemplo:

```text
Voucher 30183187

Fila 1
    Habitación 107
    METAYER JAVIER

Fila 2
    Habitación 107
    LATRIGLIA PAOLA SUSANA
```

La interpretación resultante puede ser:

```text
Reserva
│
├── Voucher: 30183187
│
├── Habitación: 107
│
└── PAX
     ├── METAYER JAVIER
     └── LATRIGLIA PAOLA SUSANA
```

---

# 11. Reserva versus fila

No debe asumirse:

```text
1 fila = 1 reserva
```

La relación correcta puede ser:

```text
1 reserva
   ↓
1 voucher
   ↓
1..N habitaciones
   ↓
1..N PAX
```

Por lo tanto, la aplicación deberá construir una representación interna de la reserva a partir de varias filas cuando corresponda.

---

# 12. Voucher como elemento de agrupación

El voucher constituye una de las principales claves de agrupamiento.

Conceptualmente:

```text
CSV
│
├── Voucher A
│   ├── PAX 1
│   ├── PAX 2
│   └── PAX 3
│
├── Voucher B
│   └── PAX 1
│
└── Voucher C
    ├── PAX 1
    └── PAX 2
```

El procesamiento debe conservar el orden de aparición de los PAX.

---

# 13. Titular y acompañantes

Para reservas individuales:

```text
Primer PAX del voucher
        ↓
Titular / solicitante

PAX siguientes
        ↓
Acompañantes
```

Esta regla se basa en el funcionamiento operativo de la reserva:

> La persona que aparece primero es quien solicitó la reserva en la seccional y realizó la contratación/pago para sí misma y/o sus acompañantes.

La edad no modifica esta regla.

---

# 14. Habitación y capacidad

La aplicación debe distinguir:

```text
Tipo de habitación
        ↓
Capacidad/modalidad prevista

PAX asociados
        ↓
Ocupación real
```

Ejemplo:

```text
TRIPLE INDIVIDUAL

Cantidad plazas: 3
Plazas ocupadas: 1

PAX reales: 1
```

El sistema no debe generar tres pasajeros basándose únicamente en el valor `3`.

---

# 15. Reserva individual y contingente

Una reserva individual puede tener:

```text
1 voucher
+
1 o varios PAX
+
1 o varias habitaciones
```

Un contingente puede tener una cantidad considerablemente mayor de:

```text
PAX
habitaciones
filas
```

La clasificación debe considerar especialmente el `Paquete` y el contexto del conjunto de registros.

---

# 16. Contingentes

Entre los contingentes conocidos se encuentran:

* PPJ / jubilados;
* egresados;
* Juegos Bonaerenses;
* otros grupos organizados.

El procesamiento de contingentes es diferente al de reservas individuales.

Particularmente:

```text
CONTINGENTE
→ Rooming específico
→ tratamiento de comidas correspondiente
→ no generar fichas PAX individuales
```

---

# 17. Fichas PAX

Las fichas PAX se generan únicamente para pasajeros fuera de contingentes.

Esto evita duplicar el trabajo administrativo realizado previamente en las seccionales.

Para contingentes numerosos, generar e imprimir decenas de fichas durante el check-in resulta contraproducente.

---

# 18. Problemas conocidos del CSV

El sistema debe contemplar que el archivo pueda presentar:

### 18.1 Campos vacíos

Ejemplos:

```text
Email vacío
Teléfono vacío
Celular vacío
Parada vacía
```

---

### 18.2 Diferencias de mayúsculas

Ejemplos:

```text
GOMEZ JUAN
Gomez Juan
gomez juan
```

---

### 18.3 Espacios adicionales

Ejemplo:

```text
GOMEZ    JUAN
```

---

### 18.4 Comas dentro de nombres

Una coma introducida accidentalmente puede provocar que un nombre sea interpretado como más de una columna si el CSV no está correctamente escapado.

Esto debe ser tratado como un problema de parsing y validación.

---

### 18.5 Cantidades de plazas inconsistentes

Los valores de:

```text
Cantidad plazas
Plazas ocupadas
```

pueden no coincidir con los PAX efectivamente registrados.

---

### 18.6 Datos incompletos

Algunos registros pueden carecer de información que sería útil para la documentación.

El sistema debe diferenciar:

```text
dato faltante
```

de:

```text
dato incorrecto
```

cuando sea posible.

---

# 19. Datos RAW, normalizados e interpretados

El procesamiento interno deberá diferenciar tres niveles.

## RAW

Información recibida directamente del CSV.

```text
original
```

---

## NORMALIZADO

Información adaptada a un formato uniforme.

```text
normalizado
```

Ejemplo:

```text
gomez juan
```

→

```text
GOMEZ JUAN
```

---

## INTERPRETADO

Información obtenida a partir del análisis de varios registros.

Ejemplo:

```text
3 filas
+
mismo voucher
+
misma habitación
```

pueden permitir determinar:

```text
1 reserva
3 PAX
1 habitación
1 titular
2 acompañantes
```

---

# 20. Advertencias

El sistema deberá poder registrar situaciones que requieran atención.

Ejemplos:

```text
⚠ Voucher con datos inconsistentes
⚠ Cantidad de plazas no coincide con PAX
⚠ Plazas ocupadas no coinciden con PAX
⚠ Habitación sin PAX
⚠ PAX sin habitación
⚠ Campo obligatorio vacío
⚠ CSV con cantidad incorrecta de columnas
⚠ Posible coma dentro del nombre
⚠ Reserva pendiente de pago
```

No todas las advertencias representan errores.

Debe diferenciarse entre:

```text
ERROR
```

y:

```text
ADVERTENCIA OPERATIVA
```

---

# 21. Estado de procesamiento

Además del estado de pago de la reserva, la aplicación podrá manejar un estado propio de procesamiento.

Estos conceptos no deben confundirse.

### Estado del CSV

Describe la información recibida.

### Estado de pago

Describe la situación económica de la reserva:

```text
O
T
M
N
```

### Estado de procesamiento

Describe si la aplicación pudo interpretar correctamente los datos.

Por ejemplo:

```text
OK
INTERPRETADO
REVISAR
```

---

# 22. Modelo conceptual inicial

A partir del CSV, la aplicación deberá construir progresivamente una representación conceptual similar a:

```text
RESERVA
│
├── voucher
├── sede
├── paquete
├── servicios
├── transporte
│
├── estadía
│   ├── fecha ingreso
│   ├── fecha egreso
│   └── noches
│
├── pago
│   └── estado
│       ├── O
│       ├── T
│       ├── M
│       └── N
│
├── habitaciones
│   │
│   ├── habitación
│   │   ├── número
│   │   ├── tipo
│   │   ├── capacidad
│   │   └── ocupación
│   │
│   └── ...
│
└── PAX
    │
    ├── titular
    │   ├── documento
    │   ├── nombre
    │   ├── edad
    │   └── contacto
    │
    └── acompañantes
        ├── PAX
        ├── PAX
        └── ...
```

Este modelo es conceptual y podrá evolucionar durante el desarrollo.

---

# 23. Reglas confirmadas

Hasta la versión 0.1 quedan confirmadas las siguientes reglas:

1. El CSV posee 28 columnas en los archivos analizados.
2. Una fila representa información de un PAX y su alojamiento, pero no necesariamente una reserva completa.
3. El voucher es una clave fundamental para agrupar registros.
4. Una reserva puede contener varios PAX.
5. Una reserva puede contener varias habitaciones.
6. El primer PAX de una reserva individual es el titular/solicitante.
7. Los PAX siguientes son acompañantes.
8. La edad no determina al titular.
9. La capacidad de una habitación no equivale necesariamente a su ocupación real.
10. `Cantidad plazas` y `Plazas ocupadas` deben tratarse como campos independientes.
11. La ocupación real debe contrastarse con los PAX.
12. `Paquete` es un dato importante para identificar contingentes.
13. Las reservas individuales y los contingentes requieren tratamientos diferentes.
14. Las fichas PAX se generan para reservas individuales.
15. Las fichas PAX no se generan para contingentes.
16. MAP corresponde a Media Pensión.
17. PC corresponde a Pensión Completa.
18. MAP contempla cena.
19. PC contempla almuerzo y cena.
20. `Estado` representa la situación de pago.
21. `O` significa pagada.
22. `T` significa falta pagar.
23. `M` significa descuento de haberes.
24. `N` significa pago parcial.
25. `T` no implica necesariamente una reserva inválida.
26. Los datos faltantes no deben ser inventados.
27. Los datos originales deben conservarse.
28. Las diferencias de formato deben poder normalizarse.
29. Las inconsistencias deben poder detectarse.
30. Los datos personales reales no deben publicarse en el repositorio público.

---

# 24. Reglas pendientes de confirmar

Algunas cuestiones requieren más ejemplos reales antes de convertirse en reglas definitivas.

Entre ellas:

* significado exacto de algunos valores de `Estado` en todos los contextos;
* reglas completas de identificación de contingentes;
* reglas detalladas de PPJ;
* tratamiento de diferentes tipos de habitaciones;
* relación exacta entre cantidad de plazas y plazas ocupadas;
* excepciones de comidas;
* reglas de transporte;
* significado completo del campo `Usuario`;
* tratamiento de CSV estructuralmente dañados;
* recuperación automática de datos faltantes.

Estas cuestiones deberán resolverse mediante nuevos casos reales y documentarse antes de incorporarlas definitivamente al núcleo de la aplicación.

---

# 25. Privacidad y repositorio público

El repositorio `solucionHotelera` es público.

Los archivos reales utilizados durante el desarrollo pueden contener datos personales.

Por lo tanto:

> Los CSV reales no deben incorporarse al repositorio público.

Para las pruebas públicas deberán utilizarse:

* datos ficticios;
* datos anonimizados;
* documentos de ejemplo sin información personal real.

Los archivos reales pueden mantenerse fuera del repositorio y utilizarse únicamente en el entorno local de desarrollo.

---

# 26. Evolución del documento

Este documento representa la versión inicial del modelo de datos.

A medida que se analicen nuevos archivos CSV y se descubran nuevas situaciones reales, deberán incorporarse:

* nuevas columnas;
* nuevos valores;
* nuevas reglas;
* nuevos casos especiales;
* nuevas validaciones.

Las modificaciones importantes del modelo deberán documentarse antes de implementarse en el código.

**Versión actual: 0.1 — borrador inicial.**
