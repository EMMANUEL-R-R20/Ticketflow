import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";
import { verificarToken, exigirRol } from "../middleware/auth.js";

const router = Router();

const ESTADOS = [
  "Programado",
  "En Boletería",
  "En Vivo",
  "Finalizado",
  "Cancelado",
];

// Devuelve cada evento con la misma forma que usa el frontend, más "disponibles":
// la capacidad menos las entradas de reservas que no están canceladas.
const CONSULTA_EVENTOS = `
  SELECT e.id, e.codigo, e.nombre, e.descripcion, e.teatro,
         c.nombre AS ciudad, d.nombre AS departamento, p.nombre AS pais,
         to_char(e.fecha_hora_inicio, 'YYYY-MM-DD') AS fecha,
         to_char(e.fecha_hora_inicio, 'HH24:MI') AS "horaInicio",
         to_char(e.fecha_hora_fin, 'YYYY-MM-DD') AS "fechaFin",
         to_char(e.fecha_hora_fin, 'HH24:MI') AS "horaFin",
         e.capacidad,
         e.precio_base::float8 AS precio,
         ee.nombre AS estado,
         e.imagen,
         e.observacion AS observaciones,
         pa.nombre_completo AS agente,
         GREATEST(0, e.capacidad - COALESCE((
           SELECT SUM(r.num_entradas)
             FROM reserva r
             JOIN estado_reserva er ON er.id = r.estado_reserva_id
            WHERE r.evento_id = e.id AND er.nombre <> 'Cancelada'
         ), 0))::int AS disponibles
    FROM evento e
    JOIN ciudad c ON c.id = e.ciudad_id
    JOIN departamento d ON d.id = c.departamento_id
    JOIN pais p ON p.id = d.pais_id
    JOIN estado_evento ee ON ee.id = e.estado_evento_id
    JOIN persona pa ON pa.identificacion = e.agente_id`;

async function obtenerEvento(id) {
  const { rows } = await pool.query(`${CONSULTA_EVENTOS} WHERE e.id = $1`, [
    id,
  ]);
  return rows[0];
}

function faltante(valor) {
  return valor === undefined || valor === null || String(valor).trim() === "";
}

// Revisa los datos del formulario. Devuelve { error } o { datos } ya limpios.
function validarEvento(cuerpo, { exigirFuturo }) {
  const c = cuerpo ?? {};
  const nombre = String(c.nombre ?? "").trim();
  const teatro = String(c.teatro ?? "").trim();
  const estado = c.estado ?? "Programado";

  if (
    !nombre ||
    !teatro ||
    [c.ciudadId, c.fecha, c.horaInicio, c.horaFin, c.capacidad, c.precio].some(
      faltante,
    )
  ) {
    return { error: "Faltan campos obligatorios" };
  }
  if (nombre.length > 150 || teatro.length > 120) {
    return { error: "El nombre o el teatro son demasiado largos" };
  }
  const ciudadId = Number(c.ciudadId);
  if (!Number.isInteger(ciudadId)) {
    return { error: "La ciudad no es válida" };
  }
  const capacidad = Number(c.capacidad);
  if (!Number.isInteger(capacidad) || capacidad <= 0) {
    return { error: "La capacidad debe ser un número entero mayor que 0" };
  }
  const precio = Number(c.precio);
  if (!Number.isFinite(precio) || precio < 0) {
    return { error: "El precio no puede ser negativo" };
  }
  if (!ESTADOS.includes(estado)) {
    return { error: `El estado debe ser uno de: ${ESTADOS.join(", ")}` };
  }
  // Un evento cancelado necesita su motivo: se guarda en las observaciones y sale en el reporte
  if (
    estado === "Cancelado" &&
    String(c.observaciones ?? "").trim().length < 3
  ) {
    return { error: "Indica el motivo de la cancelación en las observaciones" };
  }
  // La fecha de fin es opcional: si no se envía, el evento termina el mismo día que empieza
  const fechaFin = faltante(c.fechaFin) ? c.fecha : c.fechaFin;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(c.fecha) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaFin) ||
    !/^\d{2}:\d{2}$/.test(c.horaInicio) ||
    !/^\d{2}:\d{2}$/.test(c.horaFin)
  ) {
    return { error: "Las fechas deben ser AAAA-MM-DD y las horas HH:MM" };
  }
  const inicio = new Date(`${c.fecha}T${c.horaInicio}:00`);
  const fin = new Date(`${fechaFin}T${c.horaFin}:00`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    return { error: "La fecha u hora no son válidas" };
  }
  if (fin <= inicio) {
    return {
      error: "La fecha y hora de fin deben ser posteriores a las de inicio",
    };
  }
  if (exigirFuturo && inicio <= new Date()) {
    return { error: "El evento debe empezar en una fecha y hora futuras" };
  }

  return {
    datos: {
      nombre,
      descripcion: String(c.descripcion ?? "").trim(),
      teatro,
      ciudadId,
      inicio: `${c.fecha} ${c.horaInicio}`,
      fin: `${fechaFin} ${c.horaFin}`,
      capacidad,
      precio,
      estado,
      imagen: faltante(c.imagen) ? null : String(c.imagen),
      observaciones: String(c.observaciones ?? "").trim(),
    },
  };
}

function idDeLaRuta(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) ? id : null;
}

// GET /api/eventos — cualquiera puede ver los eventos
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(`${CONSULTA_EVENTOS} ORDER BY e.id`);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron consultar los eventos" });
  }
});

// GET /api/eventos/mios — los ids de los eventos que creó el agente que inició sesión.
// La identificación del agente no viaja con cada evento (el listado es público y es un dato
// personal): cada agente pregunta aquí cuáles son suyos. Va antes de «/:id».
router.get("/mios", verificarToken, exigirRol("agente"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id FROM evento WHERE agente_id = $1 ORDER BY id",
      [req.usuario.id],
    );
    res.json(rows.map((r) => r.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron consultar tus eventos" });
  }
});

// GET /api/eventos/:id
router.get("/:id", async (req, res) => {
  const id = idDeLaRuta(req);
  if (id === null)
    return res.status(400).json({ error: "El id del evento no es válido" });
  try {
    const evento = await obtenerEvento(id);
    if (!evento) return res.status(404).json({ error: "El evento no existe" });
    res.json(evento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo consultar el evento" });
  }
});

// POST /api/eventos — solo agentes
router.post("/", verificarToken, exigirRol("agente"), async (req, res) => {
  const { error, datos } = validarEvento(req.body, { exigirFuturo: true });
  if (error) return res.status(400).json({ error });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const estado = await client.query(
      "SELECT id FROM estado_evento WHERE nombre = $1",
      [datos.estado],
    );
    // El código EVT-001 se arma con el id; mientras tanto se inserta uno temporal único
    // (la columna codigo admite máximo 20 caracteres)
    const { rows } = await client.query(
      `INSERT INTO evento (codigo, nombre, descripcion, teatro, capacidad, precio_base,
                           fecha_hora_inicio, fecha_hora_fin, observacion, imagen,
                           ciudad_id, estado_evento_id, agente_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        `TMP-${randomUUID().slice(0, 8)}`,
        datos.nombre,
        datos.descripcion,
        datos.teatro,
        datos.capacidad,
        datos.precio,
        datos.inicio,
        datos.fin,
        datos.observaciones,
        datos.imagen,
        datos.ciudadId,
        estado.rows[0].id,
        req.usuario.id,
      ],
    );
    const id = rows[0].id;
    await client.query("UPDATE evento SET codigo = $1 WHERE id = $2", [
      `EVT-${String(id).padStart(3, "0")}`,
      id,
    ]);
    await client.query("COMMIT");
    res.status(201).json(await obtenerEvento(id));
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503")
      return res.status(400).json({ error: "La ciudad indicada no existe" });
    console.error(err);
    res.status(500).json({ error: "No se pudo crear el evento" });
  } finally {
    client.release();
  }
});

// PUT /api/eventos/:id — solo agentes
router.put("/:id", verificarToken, exigirRol("agente"), async (req, res) => {
  const id = idDeLaRuta(req);
  if (id === null)
    return res.status(400).json({ error: "El id del evento no es válido" });
  const { error, datos } = validarEvento(req.body, { exigirFuturo: false });
  if (error) return res.status(400).json({ error });

  try {
    const existente = await obtenerEvento(id);
    if (!existente)
      return res.status(404).json({ error: "El evento no existe" });

    // Un agente solo puede modificar los eventos que él creó
    const dueno = await pool.query(
      "SELECT agente_id FROM evento WHERE id = $1",
      [id],
    );
    if (dueno.rows[0].agente_id !== req.usuario.id) {
      return res.status(403).json({
        error: "Ese evento es de otro agente: solo puedes modificar los tuyos",
      });
    }

    const reservadas = existente.capacidad - existente.disponibles;
    if (datos.capacidad < reservadas) {
      return res.status(400).json({
        error: `La capacidad no puede ser menor que las entradas ya reservadas (${reservadas})`,
      });
    }

    await pool.query(
      `UPDATE evento
          SET nombre = $1, descripcion = $2, teatro = $3, capacidad = $4, precio_base = $5,
              fecha_hora_inicio = $6, fecha_hora_fin = $7, observacion = $8,
              imagen = COALESCE($9, imagen), ciudad_id = $10,
              estado_evento_id = (SELECT id FROM estado_evento WHERE nombre = $11)
        WHERE id = $12`,
      [
        datos.nombre,
        datos.descripcion,
        datos.teatro,
        datos.capacidad,
        datos.precio,
        datos.inicio,
        datos.fin,
        datos.observaciones,
        datos.imagen,
        datos.ciudadId,
        datos.estado,
        id,
      ],
    );
    res.json(await obtenerEvento(id));
  } catch (err) {
    if (err.code === "23503")
      return res.status(400).json({ error: "La ciudad indicada no existe" });
    console.error(err);
    res.status(500).json({ error: "No se pudo actualizar el evento" });
  }
});

// DELETE /api/eventos/:id — solo agentes
router.delete("/:id", verificarToken, exigirRol("agente"), async (req, res) => {
  const id = idDeLaRuta(req);
  if (id === null)
    return res.status(400).json({ error: "El id del evento no es válido" });
  try {
    const dueno = await pool.query(
      "SELECT agente_id FROM evento WHERE id = $1",
      [id],
    );
    if (!dueno.rows[0])
      return res.status(404).json({ error: "El evento no existe" });
    // Un agente solo puede eliminar los eventos que él creó
    if (dueno.rows[0].agente_id !== req.usuario.id) {
      return res.status(403).json({
        error: "Ese evento es de otro agente: solo puedes eliminar los tuyos",
      });
    }
    const { rows } = await pool.query(
      "DELETE FROM evento WHERE id = $1 RETURNING id",
      [id],
    );
    if (!rows[0]) return res.status(404).json({ error: "El evento no existe" });
    res.json({ mensaje: "Evento eliminado" });
  } catch (err) {
    // La base no deja borrar un evento que tiene reservas
    if (err.code === "23503") {
      return res
        .status(409)
        .json({
          error: "No se puede eliminar: el evento tiene reservas asociadas",
        });
    }
    console.error(err);
    res.status(500).json({ error: "No se pudo eliminar el evento" });
  }
});

export default router;
