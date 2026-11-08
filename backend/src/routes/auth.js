import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

const router = Router();

// El administrador no se registra desde la página: lo crea el sistema
const ROLES_REGISTRABLES = ["cliente", "agente"];

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.identificacion, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );
}

const sha256 = (texto) =>
  crypto.createHash("sha256").update(texto).digest("hex");

// Respuesta única de /recuperar: es la misma exista o no el correo
const RESPUESTA = {
  mensaje:
    "Si el correo está registrado, te enviamos las instrucciones para recuperar tu contraseña.",
};

let transporte; // se crea la primera vez que se usa
function obtenerTransporte() {
  if (!process.env.MAIL_HOST) return null;
  transporte ??= nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 2525),
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
  return transporte;
}

async function enviarEnlace(correo, enlace) {
  const envio = obtenerTransporte();
  if (!envio) {
    // Sin servidor de correo configurado: el enlace se imprime en la consola
    console.log(`[recuperación] ${correo}: ${enlace}`);
    return;
  }
  try {
    await envio.sendMail({
      from:
        process.env.MAIL_FROM ?? "TicketFlow <no-responder@ticketflow.local>",
      to: correo,
      subject: "Recupera tu contraseña · TicketFlow",
      text:
        `Crea una contraseña nueva abriendo este enlace (vale 30 minutos y solo se puede usar una vez):\n${enlace}\n\n` +
        "Si no pediste este cambio, ignora este correo: tu contraseña seguirá igual.",
      html: `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background-color:#F3F4F6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:32px 12px;">
<tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#FFFFFF;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
    <tr><td style="background-color:#5B21B6;padding:24px 32px;">
      <div style="font-size:24px;font-weight:bold;color:#FFFFFF;letter-spacing:.5px;">TicketFlow</div>
      <div style="font-size:12px;color:#DDD6FE;margin-top:2px;">Boletería digital</div>
    </td></tr>
    <tr><td style="padding:32px 32px 8px 32px;">
      <h1 style="margin:0 0 12px 0;font-size:22px;line-height:28px;color:#111827;">Crea una contraseña nueva</h1>
      <p style="margin:0 0 24px 0;font-size:15px;line-height:23px;color:#374151;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Pulsa el botón para elegir una nueva.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;"><tr>
        <td style="background-color:#6D28D9;border-radius:8px;">
          <a href="${enlace}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">Crear contraseña nueva</a>
        </td></tr></table>
      <p style="margin:0 0 24px 0;font-size:13px;line-height:20px;color:#6B7280;">Este enlace vale <b>30 minutos</b> y solo se puede usar una vez.</p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 16px 0;">
      <p style="margin:0 0 6px 0;font-size:12px;line-height:18px;color:#6B7280;">¿El botón no funciona? Copia y pega este enlace en tu navegador:</p>
      <p style="margin:0 0 24px 0;font-size:12px;line-height:18px;color:#6D28D9;word-break:break-all;font-family:Consolas,'Courier New',monospace;">${enlace}</p>
    </td></tr>
    <tr><td style="background-color:#F9FAFB;padding:18px 32px;border-top:1px solid #E5E7EB;">
      <p style="margin:0 0 4px 0;font-size:12px;line-height:18px;color:#6B7280;">Si no pediste este cambio, ignora este correo: tu contraseña seguirá igual.</p>
      <p style="margin:0;font-size:12px;line-height:18px;color:#9CA3AF;">TicketFlow · Proyecto integrador</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`,
    });
  } catch (error) {
    // Un fallo del correo no debe tumbar la ruta ni delatar si el correo existe
    console.error(
      "No se pudo enviar el correo de recuperación:",
      error.message,
    );
  }
}

// POST /api/auth/registro
router.post("/registro", async (req, res) => {
  const {
    identificacion,
    nombreCompleto,
    correo,
    contrasena,
    direccion,
    ciudadId,
    telefonos = [],
    rol,
  } = req.body ?? {};

  if (
    !identificacion ||
    !nombreCompleto ||
    !correo ||
    !contrasena ||
    !ciudadId ||
    !rol
  ) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  if (!ROLES_REGISTRABLES.includes(rol)) {
    return res.status(400).json({ error: "El rol debe ser cliente o agente" });
  }
  if (!/^\S+@\S+\.\S+$/.test(correo)) {
    return res.status(400).json({ error: "El correo no es válido" });
  }
  if (String(contrasena).length < 6) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }
  if (!Array.isArray(telefonos)) {
    return res
      .status(400)
      .json({ error: "Los teléfonos deben enviarse como una lista" });
  }

  const correoNormalizado = String(correo).toLowerCase();
  const hash = await bcrypt.hash(String(contrasena), 10);
  const client = await pool.connect();

  try {
    // Todo o nada: si algo falla, no queda una persona a medias
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO persona (identificacion, nombre_completo, correo, contrasena, direccion, ciudad_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        identificacion,
        nombreCompleto,
        correoNormalizado,
        hash,
        direccion ?? null,
        ciudadId,
      ],
    );
    for (const telefono of new Set(telefonos)) {
      await client.query(
        "INSERT INTO telefono_persona (persona_id, telefono) VALUES ($1, $2)",
        [identificacion, telefono],
      );
    }
    await client.query(
      rol === "cliente"
        ? "INSERT INTO cliente (persona_id) VALUES ($1)"
        : "INSERT INTO agente (persona_id) VALUES ($1)",
      [identificacion],
    );
    await client.query("COMMIT");

    const usuario = {
      identificacion,
      nombre: nombreCompleto,
      correo: correoNormalizado,
      rol,
    };
    res.status(201).json({ token: firmarToken(usuario), usuario });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Ya existe un usuario con esa identificación o ese correo",
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({ error: "La ciudad indicada no existe" });
    }
    console.error(error);
    res.status(500).json({ error: "No se pudo completar el registro" });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { correo, contrasena } = req.body ?? {};
  if (!correo || !contrasena) {
    return res
      .status(400)
      .json({ error: "Correo y contraseña son obligatorios" });
  }

  try {
    // El rol sale de en cuál tabla hija (administrador, agente, cliente) está la persona
    const { rows } = await pool.query(
      `SELECT p.identificacion, p.nombre_completo, p.correo, p.contrasena,
              CASE WHEN a.persona_id IS NOT NULL THEN 'administrador'
                   WHEN g.persona_id IS NOT NULL THEN 'agente'
                   WHEN c.persona_id IS NOT NULL THEN 'cliente' END AS rol
         FROM persona p
         LEFT JOIN administrador a ON a.persona_id = p.identificacion
         LEFT JOIN agente g ON g.persona_id = p.identificacion
         LEFT JOIN cliente c ON c.persona_id = p.identificacion
        WHERE p.correo = $1`,
      [String(correo).toLowerCase()],
    );
    const fila = rows[0];
    const valido =
      fila && (await bcrypt.compare(String(contrasena), fila.contrasena));
    // Mismo mensaje si el correo no existe o la contraseña está mal
    if (!valido) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    const usuario = {
      identificacion: fila.identificacion,
      nombre: fila.nombre_completo,
      correo: fila.correo,
      rol: fila.rol,
    };
    res.json({ token: firmarToken(usuario), usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo iniciar sesión" });
  }
});

// POST /api/auth/recuperar
router.post("/recuperar", async (req, res) => {
  const correo = String(req.body?.correo ?? "")
    .trim()
    .toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(correo)) {
    return res.status(400).json({ error: "Escribe un correo válido" });
  }
  try {
    // Solo clientes y agentes (el administrador lo restablece otro administrador)
    const { rows } = await pool.query(
      `SELECT p.identificacion FROM persona p
        WHERE p.correo = $1
          AND (EXISTS (SELECT 1 FROM cliente WHERE persona_id = p.identificacion)
            OR EXISTS (SELECT 1 FROM agente  WHERE persona_id = p.identificacion))`,
      [correo],
    );
    if (rows[0]) {
      const token = crypto.randomBytes(32).toString("hex"); // 64 caracteres
      await pool.query(
        "UPDATE recuperacion_contrasena SET usado = TRUE WHERE persona_id = $1 AND usado = FALSE",
        [rows[0].identificacion],
      );
      await pool.query(
        `INSERT INTO recuperacion_contrasena (persona_id, token_hash, expira)
         VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
        [rows[0].identificacion, sha256(token)],
      );
      const base = process.env.APP_URL ?? "http://localhost:8443";
      enviarEnlace(correo, `${base}/restablecer?token=${token}`);
    }
    res.json(RESPUESTA); // la misma respuesta exista o no el correo
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo procesar la solicitud" });
  }
});

// POST /api/auth/restablecer
router.post("/restablecer", async (req, res) => {
  const { token, contrasena } = req.body ?? {};
  const INVALIDO = "El enlace no es válido o ya expiró";
  if (typeof token !== "string" || token.length !== 64) {
    return res.status(400).json({ error: INVALIDO });
  }
  if (typeof contrasena !== "string" || contrasena.length < 6) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT persona_id FROM recuperacion_contrasena
        WHERE token_hash = $1 AND usado = FALSE AND expira > NOW()
          FOR UPDATE`,
      [sha256(token)],
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: INVALIDO });
    }
    const hash = await bcrypt.hash(contrasena, 10);
    await client.query(
      "UPDATE persona SET contrasena = $1 WHERE identificacion = $2",
      [hash, rows[0].persona_id],
    );
    await client.query(
      "UPDATE recuperacion_contrasena SET usado = TRUE WHERE persona_id = $1",
      [rows[0].persona_id],
    );
    await client.query("COMMIT");
    res.json({
      mensaje: "Tu contraseña se actualizó. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "No se pudo restablecer la contraseña" });
  } finally {
    client.release();
  }
});

export default router;
