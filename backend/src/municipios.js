// Carga los departamentos y municipios de Colombia en la base de datos.
//
// Fuente: DIVIPOLA del DANE (datos.gov.co → «DIVIPOLA- Códigos municipios»).
// Uso, dentro de backend/:
//   npm run municipios -- --simular        → muestra qué haría, sin escribir nada
//   npm run municipios                     → carga los datos
//   npm run municipios -- ruta/al/archivo.csv   → usa otro archivo
//
// El archivo por defecto es backend/database/divipola.csv. Se puede ejecutar varias
// veces: lo que ya existe no se duplica, y las ciudades que ya tienen personas o
// eventos asociados no se tocan.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { pool } from "./db.js";

const ARCHIVO_POR_DEFECTO = new URL(
  "../database/divipola.csv",
  import.meta.url,
);

// ── Utilidades de texto ─────────────────────────────────────────────────────
const sinTildes = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
// Para comparar nombres sin importar mayúsculas, tildes ni espacios de más
const clave = (s) => sinTildes(s).toLowerCase().replace(/\s+/g, " ").trim();

// Los nombres vienen en MAYÚSCULAS: «EL CARMEN DE VIBORAL» → «El Carmen de Viboral»
const MINUSCULAS = new Set(["de", "del", "la", "las", "los", "el", "y", "e"]);
function nombreBonito(texto) {
  return texto
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((trozo, i) => {
      if (/^(\s+|-)$/.test(trozo) || trozo === "") return trozo;
      const palabra = trozo.replace(/[^\p{L}]/gu, "");
      if (i > 0 && MINUSCULAS.has(palabra)) return trozo;
      return trozo.charAt(0).toUpperCase() + trozo.slice(1);
    })
    .join("");
}

// ── Lectura del CSV (con comillas, BOM y coma o punto y coma) ───────────────
function leerCsv(texto) {
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);
  const primeraLinea = texto.split(/\r?\n/, 1)[0] ?? "";
  const separador =
    (primeraLinea.match(/;/g) ?? []).length >
    (primeraLinea.match(/,/g) ?? []).length
      ? ";"
      : ",";
  const filas = [];
  let fila = [];
  let campo = "";
  let entreComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else entreComillas = false;
      } else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === separador) {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo);
      campo = "";
      if (fila.length > 1 || fila[0] !== "") filas.push(fila);
      fila = [];
    } else campo += c;
  }
  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas;
}

// Acepta los encabezados de la API (cod_dpto...) y los del botón «Exportar» (Código Departamento...)
function columnas(encabezado) {
  const claves = encabezado.map((h) =>
    sinTildes(h)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, ""),
  );
  const buscar = (...nombres) => claves.findIndex((k) => nombres.includes(k));
  const idx = {
    codDpto: buscar("cod_dpto", "codigodepartamento"),
    dpto: buscar("dpto", "nombredepartamento"),
    codMpio: buscar("cod_mpio", "codigomunicipio"),
    mpio: buscar("nom_mpio", "nombremunicipio"),
    tipo: claves.findIndex((k) => k.startsWith("tipo")),
  };
  const faltan = Object.entries(idx)
    .filter(([k, v]) => v < 0 && k !== "tipo")
    .map(([k]) => k);
  if (faltan.length > 0) {
    throw new Error(
      `Al archivo le faltan columnas (${faltan.join(", ")}). ¿Es el CSV de «DIVIPOLA- Códigos municipios»?`,
    );
  }
  return idx;
}

function cargarArchivo(ARCHIVO) {
  let texto;
  try {
    texto = readFileSync(ARCHIVO, "utf8");
  } catch {
    throw new Error(
      `No se pudo leer el archivo: ${ARCHIVO instanceof URL ? ARCHIVO.pathname : ARCHIVO}. Descárgalo y guárdalo en backend/database/divipola.csv.`,
    );
  }
  const [encabezado, ...filas] = leerCsv(texto);
  if (!encabezado) throw new Error("El archivo está vacío.");
  const idx = columnas(encabezado);
  const datos = filas
    .map((f) => ({
      codDpto: (f[idx.codDpto] ?? "").trim().padStart(2, "0"),
      dpto: (f[idx.dpto] ?? "").trim(),
      codMpio: (f[idx.codMpio] ?? "").trim().padStart(5, "0"),
      mpio: (f[idx.mpio] ?? "").trim(),
      tipo: idx.tipo >= 0 ? (f[idx.tipo] ?? "").trim() : "Municipio",
    }))
    .filter((f) => f.dpto !== "" && f.mpio !== "");
  // Comprobación: que de verdad sea la DIVIPOLA y no otro archivo cualquiera
  const departamentos = new Set(datos.map((f) => f.codDpto));
  if (datos.length < 1000 || departamentos.size < 30) {
    throw new Error(
      `El archivo no parece completo: ${datos.length} filas y ${departamentos.size} departamentos (la DIVIPOLA trae unas 1.122 filas y 33 departamentos). No se cambió nada.`,
    );
  }
  return datos;
}

// ── Reglas de qué se carga ──────────────────────────────────────────────────
//  - Se omiten las «áreas no municipalizadas» (no son municipios).
//  - Bogotá D.C. (departamento 11) se omite: Bogotá ya existe dentro de Cundinamarca,
//    como en el modelo del equipo, y no se crea un departamento aparte.
const esArea = (f) => clave(f.tipo).startsWith("area");
const esBogota = (f) => f.codDpto === "11" || f.codMpio === "11001";

//  - Hay municipios que el DANE escribe con su nombre oficial y la base ya tiene con otro más corto.
//    Se listan aquí (por código DIVIPOLA) para que se reconozcan y no se cree una ciudad repetida.
//    Con la base de schema.sql, el único caso es Cali: el DANE la llama «Santiago de Cali».
const NOMBRE_EN_LA_BASE = { 76001: "Cali" };

const filasDe = (valores, columnasPorFila) => {
  // INSERT de varias filas a la vez: ($1,$2),($3,$4),...
  const marcas = valores.map(
    (_, i) =>
      "(" +
      Array.from(
        { length: columnasPorFila },
        (_, j) => `$${i * columnasPorFila + j + 1}`,
      ).join(",") +
      ")",
  );
  return marcas.join(",");
};

export async function cargarMunicipios({
  archivo = ARCHIVO_POR_DEFECTO,
  simular: SIMULAR = false,
} = {}) {
  const datos = cargarArchivo(archivo);
  const aCargar = datos.filter((f) => !esArea(f) && !esBogota(f));
  console.log(
    `Archivo leído: ${datos.length} filas (${datos.length - aCargar.length} omitidas: áreas no municipalizadas y Bogotá).`,
  );
  if (SIMULAR)
    console.log("MODO SIMULACIÓN: no se escribe nada en la base de datos.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // País
    let pais = (
      await client.query("SELECT id FROM pais WHERE LOWER(nombre) = 'colombia'")
    ).rows[0];
    if (!pais)
      pais = (
        await client.query(
          "INSERT INTO pais (nombre) VALUES ('Colombia') RETURNING id",
        )
      ).rows[0];

    // Departamentos: se reutilizan los que ya existen (aunque cambien mayúsculas o tildes)
    const existentes = new Map(
      (
        await client.query(
          "SELECT id, nombre FROM departamento WHERE pais_id = $1",
          [pais.id],
        )
      ).rows.map((d) => [clave(d.nombre), d.id]),
    );
    const departamentoDe = new Map(); // código DANE → id en la base
    let deptosNuevos = 0;
    const oficiales = new Map();
    for (const f of aCargar)
      if (!oficiales.has(f.codDpto)) oficiales.set(f.codDpto, f.dpto);
    for (const [codigo, nombre] of [...oficiales].sort()) {
      let id = existentes.get(clave(nombre));
      if (id === undefined) {
        id = (
          await client.query(
            "INSERT INTO departamento (nombre, pais_id) VALUES ($1, $2) RETURNING id",
            [nombreBonito(nombre), pais.id],
          )
        ).rows[0].id;
        existentes.set(clave(nombre), id);
        deptosNuevos++;
      }
      departamentoDe.set(codigo, id);
    }

    // Ciudades: solo las que no existen ya en ese departamento
    const yaHay = new Set(
      (
        await client.query(
          `SELECT c.departamento_id, c.nombre FROM ciudad c JOIN departamento d ON d.id = c.departamento_id WHERE d.pais_id = $1`,
          [pais.id],
        )
      ).rows.map((c) => `${c.departamento_id}|${clave(c.nombre)}`),
    );
    const nuevas = [];
    let yaExistian = 0;
    for (const f of aCargar) {
      const id = departamentoDe.get(f.codDpto);
      const nombre = NOMBRE_EN_LA_BASE[f.codMpio] ?? f.mpio;
      const llave = `${id}|${clave(nombre)}`;
      if (yaHay.has(llave)) {
        yaExistian++;
        continue;
      }
      yaHay.add(llave);
      nuevas.push([nombreBonito(nombre), id]);
    }
    if (nuevas.some(([nombre]) => nombre.length > 80))
      throw new Error(
        "Hay un nombre de más de 80 caracteres; no se cambió nada.",
      );
    for (let i = 0; i < nuevas.length; i += 400) {
      const lote = nuevas.slice(i, i + 400);
      await client.query(
        `INSERT INTO ciudad (nombre, departamento_id) VALUES ${filasDe(lote, 2)}`,
        lote.flat(),
      );
    }

    const totales = {
      departamentos: (
        await client.query(
          "SELECT COUNT(*)::int AS n FROM departamento WHERE pais_id = $1",
          [pais.id],
        )
      ).rows[0].n,
      ciudades: (
        await client.query(
          "SELECT COUNT(*)::int AS n FROM ciudad c JOIN departamento d ON d.id = c.departamento_id WHERE d.pais_id = $1",
          [pais.id],
        )
      ).rows[0].n,
    };
    await client.query(SIMULAR ? "ROLLBACK" : "COMMIT");

    console.log(
      `Departamentos: ${deptosNuevos} nuevos, ${oficiales.size - deptosNuevos} ya existían.`,
    );
    console.log(
      `Ciudades:      ${nuevas.length} nuevas, ${yaExistian} ya existían.`,
    );
    console.log(
      `${SIMULAR ? "Quedarían" : "Quedaron"} en la base: ${totales.departamentos} departamentos y ${totales.ciudades} ciudades de Colombia.`,
    );
    return {
      departamentosNuevos: deptosNuevos,
      ciudadesNuevas: nuevas.length,
      ciudadesExistentes: yaExistian,
      totales,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Cuando se ejecuta con «npm run municipios» (y no cuando otro archivo lo importa)
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  const argumentos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  cargarMunicipios({
    archivo: argumentos[0] ?? ARCHIVO_POR_DEFECTO,
    simular: process.argv.includes("--simular"),
  })
    .catch((error) => {
      console.error("No se cargaron los municipios:", error.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
