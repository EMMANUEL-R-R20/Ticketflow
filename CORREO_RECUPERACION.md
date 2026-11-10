# Correo de recuperación de contraseña — guía para el equipo

Esta guía explica cómo se envía el enlace para recuperar la contraseña y cómo dejarlo andando en tu computador. Se usa un **buzón de pruebas (Mailtrap)**: los correos no llegan a ninguna persona real, quedan guardados en una bandeja a la que entras desde el navegador.

## 1. Qué hace

- En el inicio de sesión, **«¿Olvidaste tu contraseña?»** pide el correo de la cuenta.
- El servidor crea un enlace de **un solo uso** que vale **30 minutos** y lo envía por correo con un botón **«Crear contraseña nueva»**.
- El botón abre `/restablecer?token=...`, donde la persona escribe su contraseña nueva.
- La página responde **lo mismo exista o no el correo**, para no revelar qué cuentas existen. Si el correo no existe, simplemente no se envía nada.

## 2. Cómo funciona por dentro

1. `POST /api/auth/recuperar` recibe el correo y, si existe una cuenta con ese correo, genera un token al azar.
2. En la tabla `recuperacion_contrasena` se guarda **solo la huella (SHA-256) del token**, nunca el token, junto con su vencimiento y si ya se usó.
3. La función `enviarEnlace` (en `backend/src/routes/auth.js`) arma el enlace y lo manda con Nodemailer.
4. `POST /api/auth/restablecer` recibe el token y la contraseña nueva, comprueba que el enlace exista, no esté vencido ni usado, guarda la contraseña nueva (cifrada con bcrypt) y marca el enlace como usado.

### Qué pasa según la configuración

| Situación                                                          | Resultado                                                                                                                                                             |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No hay** `MAIL_HOST` en `backend/.env`                           | No se envía correo: el enlace se imprime en la terminal del backend, en una línea que empieza por `[recuperación]`. Así funciona quien no configuró el correo         |
| Hay `MAIL_HOST` y los datos son correctos                          | El correo llega al buzón de Mailtrap y en la terminal **no** sale el enlace                                                                                           |
| Hay `MAIL_HOST` pero un dato está mal (por ejemplo, la contraseña) | El correo **no** llega, **tampoco** sale el enlace en la terminal, y aparece `No se pudo enviar el correo de recuperación: ...`. La página responde igual que siempre |

> El último caso es el que más confunde: si pones `MAIL_HOST` y algo falla, no verás el enlace en ningún lado. Para volver al modo de la terminal, **borra o comenta** las líneas `MAIL_...` y reinicia el backend.

## 3. Qué archivos se tocaron

| Archivo                                              | Qué hace                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `backend/src/routes/auth.js`                         | Importa Nodemailer y envía el enlace en `enviarEnlace`. Incluye el diseño del correo |
| `backend/package.json` y `backend/package-lock.json` | Agregan la librería `nodemailer`                                                     |
| `backend/env.example`                                | Nombres de las variables del correo                                                  |

## 4. Dejarlo andando en tu computador

### 4.1 Trae el código e instala

Desde la raíz del proyecto, en la rama donde vayas a trabajar:

```
git fetch origin
git merge origin/main
npm run instalar
```

### 4.2 Crea el buzón de pruebas en Mailtrap

Cada integrante usa **su propio** buzón y sus propias claves. Nunca las subas a GitHub ni las pegues en un chat grupal.

1. Crea una cuenta gratis en [mailtrap.io](https://mailtrap.io). Revisa los límites del plan gratuito en su página.
2. Entra a **Email Testing** (o **Email Sandbox**) y crea un buzón, por ejemplo `ticketflow`.
3. Abre el buzón y entra a la pestaña **Integration**. Elige **SMTP** (no pulses «Integrate» ni «Nodemailer» en la lista de integraciones: ese enlace lleva a una página de GitHub).
4. Verás el servidor, el puerto, el **usuario** y la **contraseña**. Si la contraseña aparece tapada con asteriscos, revélala o baja a **Code Samples**, elige **Node.js → Nodemailer** y copia el valor que está entre las comillas de `pass`.

Los datos que necesitas son:

| Dato                 | Valor                                            |
| -------------------- | ------------------------------------------------ |
| Servidor (host)      | `sandbox.smtp.mailtrap.io`                       |
| Puerto               | `2525` (también sirven 25, 465 y 587)            |
| Usuario y contraseña | Los de **tu** buzón (cambian de un buzón a otro) |

Las credenciales de **Email Sandbox** no son las de **Email Sending** (el envío real): si el servidor que ves no empieza por `sandbox`, estás en la sección equivocada.

### 4.3 Agrega las variables a `backend/.env`

Al final del archivo, sin comillas y sin espacios alrededor del `=`:

```
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=el-usuario-de-tu-buzon
MAIL_PASS=la-contraseña-completa-de-tu-buzon
MAIL_FROM=TicketFlow <no-responder@ticketflow.local>
```

> **Importante:** el backend solo vigila la carpeta `src`. **Cada vez que cambies el `.env`, detén `npm run dev` (`Ctrl + C`, y Enter si no vuelve el prompt) y vuelve a correrlo.**

## 5. Cómo probar

1. Corre `npm run dev` y abre `http://localhost:8443`.
2. Crea una cuenta de prueba desde **Crear cuenta** (por ejemplo `prueba.correo@ejemplo.com`). No uses una cuenta de verdad: al usar el enlace, la contraseña cambia.
3. En el inicio de sesión pulsa **«¿Olvidaste tu contraseña?»** y escribe ese correo.

| Qué haces                                              | Qué debe pasar                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Pides el enlace con la cuenta que existe               | La página responde con el aviso de siempre y, en la terminal, **no** sale el enlace |
| Abres tu buzón en Mailtrap                             | En unos segundos llega «Recupera tu contraseña · TicketFlow», con un botón          |
| Pulsas el botón                                        | Abre `/restablecer?token=...` con la pantalla de contraseña nueva                   |
| Guardas una contraseña nueva e inicias sesión con ella | Funciona                                                                            |
| Usas el mismo enlace otra vez                          | El servidor lo rechaza (es de un solo uso)                                          |
| Pides el enlace con un correo que no existe            | Misma respuesta de la página, pero **no llega ningún correo**                       |
| Comentas las líneas `MAIL_...` y reinicias el backend  | El enlace vuelve a salir en la terminal                                             |

Cuando termines, borra la cuenta de prueba desde **Usuarios**, como administrador.

## 6. Problemas comunes

| Qué pasa                                       | Qué hacer                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Invalid login: 535 5.7.0 Invalid credentials` | Mailtrap rechaza el usuario o la contraseña: casi siempre quedó **tapada o cortada** al copiarla, o hay espacios o comillas pegados. Vuelve a copiarla (sección 4.2) o usa **Reset Credentials** en la pestaña Integration del buzón. Después, guarda el `.env` y **reinicia el backend** |
| No llega ningún correo y no sale error         | Revisa que `MAIL_HOST` esté en `backend/.env` (no en el `.env` de la raíz) y que reiniciaste el backend. Mira también si estás en el buzón correcto de Mailtrap                                                                                                                           |
| No sale el enlace en la terminal               | Tienes `MAIL_HOST` puesto y algo falla: busca el mensaje `No se pudo enviar el correo...`. Para ver el enlace en la terminal, comenta las líneas `MAIL_...`                                                                                                                               |
| `ECONNREFUSED` o `ETIMEDOUT`                   | La red bloquea ese puerto. Prueba con `MAIL_PORT=587`, o con otra red (por ejemplo, el hotspot del celular)                                                                                                                                                                               |
| El correo llega pero el enlace no abre         | En desarrollo el enlace apunta a `http://localhost:8443/...`, que solo abre en el computador donde corre la página                                                                                                                                                                        |

> No uses `npm audit fix` para quitar los avisos de «vulnerabilities»: puede cambiar versiones y romper el proyecto.

## 7. Lo que todavía no hace (pendiente)

- **Correos reales:** Mailtrap solo guarda los correos de prueba; nadie los recibe en su bandeja. Para enviar a correos de verdad hace falta un proveedor de correo (por ejemplo, un servidor SMTP propio o un servicio de envío) y, normalmente, un dominio o remitente verificado.
- **Enlace público:** el enlace del correo apunta a `localhost`. Para que funcione desde otro dispositivo, la página tiene que estar publicada en internet.
- **Otros correos:** hoy solo se envía este. No hay correo de bienvenida ni de confirmación de reserva o de pago.

## 8. Seguridad

- `MAIL_USER` y `MAIL_PASS` solo van en `backend/.env`. El `.gitignore` ya ignora los archivos `.env`; antes de cada commit confirma con `git status` que el `.env` **no** aparezca.
- Si copiaste las credenciales en un lugar que no debías (un chat, una captura), usa **Reset Credentials** en Mailtrap para que dejen de servir.
- El enlace de recuperación es de un solo uso, vence a los 30 minutos y en la base solo se guarda su huella, nunca el enlace.
- La respuesta de la página es la misma exista o no el correo, para no revelar qué cuentas existen.
