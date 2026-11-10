# TicketFlow

Plataforma web de boletería digital: explorar eventos, reservar entradas y gestionar toda la operación desde tres perfiles distintos (Cliente, Agente, Administrador).

**Proyecto Integrador — Programación en Ambiente Web I**

## Tecnologías

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express (API REST)
- **Base de datos:** PostgreSQL, alojada en [Neon](https://neon.com)
- **Pagos:** Stripe Checkout, en modo de prueba (guía en [PAGOS_STRIPE.md](PAGOS_STRIPE.md))
- **Correo:** Nodemailer, para enviar el enlace de recuperación de contraseña (guía en [CORREO_RECUPERACION.md](CORREO_RECUPERACION.md))

## Estructura del repositorio

```
Ticketflow/
├── package.json          → comandos para correr todo desde la raíz (npm run dev)
├── PAGOS_STRIPE.md       → guía de los pagos con Stripe
├── CORREO_RECUPERACION.md → guía del correo de recuperación de contraseña
├── frontend/             → la página (React)
│   └── src/
│       ├── models/
│       │   ├── api/      → único lugar que habla con el servidor (sesión, eventos, reservas, perfil, reportes...)
│       │   └── types/    → tipos de datos
│       ├── views/        → componentes reutilizables y layouts
│       ├── controllers/  → páginas y navegación (App.tsx)
│       └── utils/        → funciones de ayuda (formato, cupo, colores, animaciones)
└── backend/              → la API
    ├── database/
    │   ├── schema.sql    → estructura de la base de datos (DDL)
    │   └── divipola.csv  → departamentos y municipios de Colombia (fuente: DANE)
    ├── env.example       → plantilla de variables de entorno
    └── src/
        ├── index.js      → servidor Express
        ├── db.js         → conexión a PostgreSQL
        ├── seed.js       → carga de datos de ejemplo
        ├── municipios.js → carga de los municipios de Colombia
        ├── middleware/   → sesión (token) y permisos por rol
        └── routes/       → auth, catalogos, eventos, reservas, pagos, reportes, perfil, personas
```

El frontend sigue un patrón inspirado en MVC: los **modelos** piden los datos a la API, las **vistas** son componentes sin lógica de negocio, y los **controladores** (las páginas) conectan ambos. Las páginas nunca usan `fetch` directamente.

## Cómo correrlo

Requisito: instalar [Node.js](https://nodejs.org/) (versión LTS) y Git.

### 1. Instalar las dependencias

Desde la raíz del proyecto, un solo comando instala las de la raíz, el frontend y el backend:

```
npm run instalar
```

### 2. Configurar el backend

1. Copiar la plantilla de variables de entorno:

   ```
   cd backend
   copy env.example .env
   ```

2. Abrir `backend/.env` y completar los valores:
   - `DATABASE_URL`: la cadena de conexión de la base de datos en Neon. Se pide por mensaje privado a quien creó el proyecto. **El archivo `.env` no se sube a GitHub**, porque contiene claves privadas. Nunca la pegues en un chat grupal, un commit o una captura.
   - `JWT_SECRET`: cualquier texto largo y secreto, usado para firmar los tokens de sesión.
   - `PORT`: el puerto de la API (4000 por defecto).
   - Opcional, **pagos**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y `FRONTEND_URL`. Se explican en [PAGOS_STRIPE.md](PAGOS_STRIPE.md). Sin ellas todo lo demás funciona y solo los pagos avisan que no están configurados.
   - Opcional, **correo**: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` y `MAIL_FROM`. Se explican en [CORREO_RECUPERACION.md](CORREO_RECUPERACION.md). Sin `MAIL_HOST`, el enlace de recuperación de contraseña se imprime en la terminal del backend.

### 3. Correr el proyecto

Desde la raíz:

```
npm run dev
```

Levanta la API (`http://localhost:4000`) y la página (`http://localhost:8443`) a la vez, en una sola terminal. Cada línea lleva una etiqueta de color: `[backend]` o `[frontend]`.

| Comando (desde la raíz) | Qué hace                                                  |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Levanta el backend y el frontend juntos                   |
| `npm run dev:backend`   | Solo la API                                               |
| `npm run dev:frontend`  | Solo la página                                            |
| `npm run instalar`      | Instala las dependencias de la raíz y de las dos carpetas |
| `npm run build`         | Compila la página                                         |

- **Abre la página siempre por `http://localhost:8443`**: la API solo acepta esa dirección (no la de red, la que empieza con `192.168`).
- **Para detener:** `Ctrl+C` una sola vez y, si no vuelve el prompt, **Enter**. Los avisos de Windows «¿Desea terminar el trabajo por lotes (S/N)?» y `exited with code 1` son normales: se ignoran, y no hay que escribir `S` ni `N`.
- Si cambias `backend/.env`, detén y vuelve a arrancar: el backend solo vigila la carpeta `src`.
- Para comprobar que la API y la base funcionan, abre `http://localhost:4000/api/salud`.

> La base de datos de Neon se apaga cuando pasa un rato sin uso y tarda unos segundos en despertar. La página repite sola las consultas que fallan por eso (hasta tres intentos). Antes de una demostración, conviene abrir `/api/salud` unos minutos antes.

### Datos de ejemplo

Con la base ya creada, este comando carga el administrador, un agente, tres clientes, seis eventos y cinco reservas:

```
cd backend
npm run seed
```

**Atención:** este comando **borra** las personas, eventos y reservas que haya en la base y los vuelve a cargar. La base es compartida por todo el equipo, así que **hay que avisar antes de correrlo**. No toca países, departamentos, ciudades ni estados.

### Crear la base de datos desde cero (solo si hace falta)

La estructura completa está en `backend/database/schema.sql`. Para crearla en un proyecto nuevo de Neon, se pega el contenido de ese archivo en el **SQL Editor** de Neon y se ejecuta. Después se corre `npm run municipios` (para cargar los municipios de Colombia, ver abajo) y `npm run seed`.

### Cargar los municipios de Colombia

Con `schema.sql` la base trae solo tres ciudades (Bogotá, Medellín y Cali). Para cargar todos los departamentos y municipios de Colombia, se usa el archivo oficial del DANE (DIVIPOLA) que está en `backend/database/divipola.csv`:

```
cd backend
npm run municipios -- --simular
npm run municipios
```

El primer comando es una **simulación**: lee el archivo y dice qué haría, sin escribir nada. El segundo hace la carga.

- Es **solo Colombia**: se crea un único país.
- Se omiten las áreas no municipalizadas, y **Bogotá se mantiene dentro de Cundinamarca**, sin departamento aparte.
- Reconoce «Santiago de Cali» como la Cali que ya existe, así no se duplica.
- **Se puede ejecutar varias veces:** lo que ya está no se vuelve a agregar. Todo va en una transacción: o se carga todo o no se carga nada.
- Al terminar quedan **32 departamentos y 1.104 ciudades**. Solo agrega filas, no borra nada.
- `npm run seed` **no** borra los municipios.

Fuente de los datos: DANE, [DIVIPOLA – Códigos municipios](https://www.datos.gov.co/d/gdxc-w37w) (datos abiertos de Colombia, licencia CC BY-SA 4.0).

## Cuentas de ejemplo

Después de correr `npm run seed`, estas cuentas sirven para iniciar sesión en la página. Son solo de demostración.

| Rol           | Correo                | Contraseña |
| ------------- | --------------------- | ---------- |
| Administrador | admin@ticketflow.com  | admin123   |
| Agente        | agente@ticketflow.com | agente123  |
| Cliente       | maria@ejemplo.com     | cliente123 |
| Cliente       | carlos@ejemplo.com    | cliente123 |
| Cliente       | ana@ejemplo.com       | cliente123 |

Los clientes y agentes nuevos se crean desde «Crear cuenta», eligiendo el tipo. Los administradores los crea otro administrador desde la pantalla **Usuarios**.

## Qué puede hacer cada perfil

| Perfil            | Acciones                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cliente**       | Ver los eventos disponibles y su detalle, reservar entradas (con el cupo validado), ver sus reservas, **editarlas** (mientras estén «Reservada»), **cancelarlas con motivo**, **pagarlas** con tarjeta (Stripe, modo de prueba) y editar su perfil (dirección, ciudad y teléfonos)                                                                                                       |
| **Agente**        | Registrar, editar y eliminar eventos (con fecha de finalización, imagen y ubicación), ver todos los eventos, y administrar las reservas: confirmar, cancelar con motivo, reactivar, editar y eliminar las canceladas                                                                                                                                                                     |
| **Administrador** | Panel con los **9 reportes** (registros, ingresos por mes, reservas por evento y por mes, eventos por agente y ciudad, promedios de ingresos por agente y por cliente, cobertura geográfica, historial de reservas y cancelaciones con su causa), y las pantallas **Usuarios** (crear, editar y eliminar personas de cualquier rol) y **Ubicaciones** (países, departamentos y ciudades) |

Cualquier persona puede recuperar su contraseña desde «¿Olvidaste tu contraseña?» en el inicio de sesión: recibe un enlace de un solo uso que vale 30 minutos (ver [CORREO_RECUPERACION.md](CORREO_RECUPERACION.md)).

## Direcciones de la página

La página usa direcciones reales (URLs). Si alguien abre la de un perfil sin haber iniciado sesión, se lo lleva al inicio de sesión y, al entrar, se vuelve a la dirección que pidió.

| Perfil        | Direcciones                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Público       | `/` · `/login` · `/registro` · `/recuperar` · `/restablecer`                                                                         |
| Cliente       | `/cliente` · `/cliente/eventos` · `/cliente/eventos/:id` · `/cliente/eventos/:id/reservar` · `/cliente/reservas` · `/cliente/perfil` |
| Agente        | `/agente` · `/agente/eventos` · `/agente/eventos/nuevo` · `/agente/eventos/:id/editar` · `/agente/reservas` · `/agente/perfil`       |
| Administrador | `/admin` · `/admin/usuarios` · `/admin/ubicaciones` · `/admin/perfil`                                                                |

Para agregar una pantalla hay que sumarla al tipo `Screen` (`frontend/src/models/types/index.ts`) y a `frontend/src/utils/routes.ts`.

## La API

Todas las rutas responden en JSON. Las que no son públicas piden el token que se recibe al iniciar sesión, en el encabezado `Authorization: Bearer <token>`. El token dura 8 horas.

| Área      | Ruta                                                               | Quién puede usarla                                |
| --------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| Estado    | `GET /api/salud`                                                   | Público                                           |
| Sesión    | `POST /api/auth/registro`, `/login`, `/recuperar` y `/restablecer` | Público                                           |
| Ubicación | `GET /api/paises`, `/api/departamentos`, `/api/ciudades`           | Público                                           |
| Ubicación | `POST`, `PUT` y `DELETE` en esas tres rutas                        | Administrador                                     |
| Eventos   | `GET /api/eventos` y `GET /api/eventos/:id`                        | Público                                           |
| Eventos   | `POST`, `PUT` y `DELETE /api/eventos`                              | Agente                                            |
| Reservas  | `POST /api/reservas` y `GET /api/reservas/mias`                    | Cliente                                           |
| Reservas  | `GET /api/reservas` y `DELETE /api/reservas/:id` (solo canceladas) | Agente                                            |
| Reservas  | `PUT /api/reservas/:id` (entradas y observaciones)                 | Cliente (las suyas, en estado Reservada) y agente |
| Reservas  | `PATCH /api/reservas/:id/estado`                                   | Cliente (solo cancelar las suyas) y agente        |
| Pagos     | `POST /api/pagos/checkout` y `POST /api/pagos/confirmar`           | Cliente (dueño de la reserva)                     |
| Pagos     | `POST /api/pagos/webhook`                                          | Stripe (con la firma verificada)                  |
| Perfil    | `GET` y `PUT /api/perfil`                                          | Cualquier persona con sesión                      |
| Personas  | `GET`, `POST`, `PUT` y `DELETE /api/personas`                      | Administrador                                     |
| Reportes  | `GET /api/reportes/...` (9 reportes)                               | Administrador                                     |

Reglas principales:

- **Cupo:** nunca se vende más de la capacidad de un evento. La validación se hace en el servidor, dentro de una transacción con el evento bloqueado, para que dos personas no compren a la vez la última entrada. Las reservas canceladas liberan su cupo.
- **Contraseñas:** se guardan cifradas (bcrypt), nunca en texto plano.
- **Totales:** el valor de una reserva lo calcula el servidor (precio por entradas), no el navegador.
- **Cancelaciones:** una reserva cancelada se conserva con su motivo; solo el agente puede eliminarla. Un evento cancelado exige su motivo en las observaciones.
- **Protección de datos:** no se elimina a una persona con reservas o eventos, ni un evento con reservas, ni una ubicación en uso.
- **Reportes:** los ingresos cuentan solo las reservas confirmadas, agrupadas por la fecha de la reserva.
- **Pagos:** el monto lo calcula el servidor y una reserva solo pasa a «Confirmada» si Stripe confirma el pago. Los datos de la tarjeta nunca pasan por TicketFlow (detalle en [PAGOS_STRIPE.md](PAGOS_STRIPE.md)).
- **Recuperación de contraseña:** el enlace es de un solo uso y vence a los 30 minutos; en la base se guarda solo su huella (SHA-256), nunca el enlace. La respuesta es la misma exista o no el correo, para no revelar qué cuentas existen.

## Cómo usa la página la API

Todo el acceso al servidor está en `frontend/src/models/api/`:

- **Sesión:** al iniciar sesión se guarda el token en el navegador; la sesión se conserva al recargar la página. Si el token vence, se cierra la sesión y se lleva al inicio de sesión con un aviso.
- **Errores:** los mensajes del servidor llegan a la pantalla tal cual, en español.
- **Reintentos:** solo las consultas (GET) que fallan por un error del servidor o de red se repiten (hasta tres intentos). Crear, editar o eliminar no se repiten nunca por su cuenta.
- **Dirección de la API:** `http://localhost:4000` por defecto; se puede cambiar con la variable `VITE_API_URL` en `frontend/.env`.

## Base de datos

La base tiene 13 tablas: 12 basadas en el modelo entidad-relación del equipo y una para la recuperación de contraseña:

- **Ubicación:** `pais`, `departamento` y `ciudad`.
- **Estados:** `estado_evento` y `estado_reserva`.
- **Personas:** `persona`, con sus teléfonos en `telefono_persona`, y las tres especializaciones `cliente`, `agente` y `administrador`.
- **Negocio:** `evento` y `reserva` (esta última incluye `stripe_session_id` y `fecha_pago`, del pago con Stripe).
- **Recuperación de contraseña:** `recuperacion_contrasena`, que guarda la huella del enlace, cuándo vence y si ya se usó.

La estructura completa (DDL) está en `backend/database/schema.sql`. Con ese archivo la base trae tres ciudades (Bogotá, Medellín y Cali); al cargar los municipios (ver «Cargar los municipios de Colombia») quedan 32 departamentos y 1.104 ciudades. Más ubicaciones se agregan desde la pantalla **Ubicaciones**.

## Historial de desarrollo

El proyecto se construyó en ramas sucesivas, que se pueden revisar en el historial de commits:

1. Login, registro y validaciones
2. Reorganización de la estructura (MVC) y diseño responsive
3. Vista Cliente (reservas, perfil editable)
4. Vista Agente (registrar, editar y eliminar eventos)
5. Dashboard Administrador (reportes)
6. Ajustes finales (cancelar reserva, validaciones de fecha y hora)
7. Rediseño de la Landing Page (`Rediseno-landin-page`)
8. Validación de cupo de entradas (`Validacion-cupoboletas`)
9. Colores de las gráficas del administrador (`Colores-reportes-admindashboard`)
10. Reestructura en carpetas `frontend/` y `backend/` (`Reestructura-carpetas`)
11. Backend: base de datos en Neon y API (`Backend-api`)
12. Frontend conectado a la API (`Frontend-api`)
13. Navegación con URLs reales
14. Pagos con Stripe (`Stripe-pagos`)
15. Recuperación de contraseña (`Recuperacion-contrasena`)
16. Envío del enlace de recuperación por correo (`Recuperacion-correo`)
17. Carga de los municipios de Colombia (`Municipios-colombia`)
18. README y guía del correo de recuperación (`Readme-y-ajuste-de-diseno`)
