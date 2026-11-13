// Agrega datos de demostración a la base de datos: completa 20 clientes, 20 agentes, 20 eventos y 20 reservas
// (el administrador sigue siendo uno solo). Las filas nuevas se suman a las que trae el seed.
//
// Uso, dentro de backend/:
//   npm run datos-demo -- --simular    → muestra qué agregaría, sin escribir nada
//   npm run datos-demo                 → agrega los datos
//
// Solo AGREGA: nunca borra ni modifica lo que ya existe, y se puede ejecutar varias veces sin duplicar nada.
// Antes hay que haber corrido «npm run municipios» (las ciudades) y «npm run seed» (los estados y las cuentas de ejemplo).
// Las cuentas nuevas tienen la contraseña «agente123» (agentes) o «cliente123» (clientes), como las de ejemplo.
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { pool } from "./db.js";

const sinTildes = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const clave = (s) => sinTildes(s).toLowerCase().replace(/\s+/g, " ").trim();

// ── Los datos: 36 personas nuevas (19 agentes y 17 clientes), 14 eventos y 15 reservas ──
const PERSONAS = [
  {
    id: "40.600.300",
    nombre: "Laura Mejía Restrepo",
    correo: "laura.mejia@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cra. 24 # 18-45",
    ciudad: "Medellín",
    departamento: "Antioquia",
    rol: "agente",
    telefonos: ["+57 310 200 1000"],
    comision: 8.0,
    experiencia: 6,
  },
  {
    id: "41.619.323",
    nombre: "Andrés Felipe Cárdenas Ruiz",
    correo: "andres.cardenas@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cl. 5 # 28-12",
    ciudad: "Pereira",
    departamento: "Risaralda",
    rol: "agente",
    telefonos: ["+57 311 203 1037"],
    comision: 7.5,
    experiencia: 4,
  },
  {
    id: "42.638.346",
    nombre: "Diana Marcela Ospina Gómez",
    correo: "diana.ospina@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Av. 3N # 21-60",
    ciudad: "Medellín",
    departamento: "Antioquia",
    rol: "agente",
    telefonos: ["+57 312 206 1074"],
    comision: 9.0,
    experiencia: 8,
  },
  {
    id: "43.657.369",
    nombre: "Camilo Torres Bermúdez",
    correo: "camilo.torres@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Dg. 10 # 5-33",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    rol: "agente",
    telefonos: ["+57 313 209 1111"],
    comision: 6.5,
    experiencia: 3,
  },
  {
    id: "44.676.392",
    nombre: "Valentina Rojas Pardo",
    correo: "valentina.rojas@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cra. 9 # 14-20",
    ciudad: "Barranquilla",
    departamento: "Atlántico",
    rol: "agente",
    telefonos: ["+57 314 212 1148"],
    comision: 10.0,
    experiencia: 9,
  },
  {
    id: "45.695.415",
    nombre: "Julián David Hernández Ortiz",
    correo: "julian.hernandez@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cl. 33 # 41-07",
    ciudad: "Bucaramanga",
    departamento: "Santander",
    rol: "agente",
    telefonos: ["+57 315 215 1185"],
    comision: 7.0,
    experiencia: 5,
  },
  {
    id: "46.714.438",
    nombre: "Sofía Alejandra Vargas Peña",
    correo: "sofia.vargas@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Av. 6 # 12-85",
    ciudad: "Ibagué",
    departamento: "Tolima",
    rol: "agente",
    telefonos: ["+57 316 218 1222"],
    comision: 8.5,
    experiencia: 7,
  },
  {
    id: "47.733.461",
    nombre: "Santiago Londoño Arango",
    correo: "santiago.londono@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cra. 15 # 7-64",
    ciudad: "Armenia",
    departamento: "Quindío",
    rol: "agente",
    telefonos: ["+57 317 221 1259"],
    comision: 6.0,
    experiencia: 2,
  },
  {
    id: "48.752.484",
    nombre: "Natalia Cifuentes Duque",
    correo: "natalia.cifuentes@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cl. 70 # 23-18",
    ciudad: "Villavicencio",
    departamento: "Meta",
    rol: "agente",
    telefonos: ["+57 318 224 1296"],
    comision: 7.5,
    experiencia: 5,
  },
  {
    id: "49.771.507",
    nombre: "Mauricio Salazar Giraldo",
    correo: "mauricio.salazar@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cra. 50 # 30-11",
    ciudad: "Santa Marta",
    departamento: "Magdalena",
    rol: "agente",
    telefonos: ["+57 319 227 1333"],
    comision: 9.5,
    experiencia: 11,
  },
  {
    id: "50.790.530",
    nombre: "Paola Andrea Muñoz Casas",
    correo: "paola.munoz@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cl. 12 # 8-90",
    ciudad: "Neiva",
    departamento: "Huila",
    rol: "agente",
    telefonos: ["+57 310 230 1370"],
    comision: 8.0,
    experiencia: 6,
  },
  {
    id: "51.809.553",
    nombre: "Esteban Quintero Zapata",
    correo: "esteban.quintero@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Av. 5N # 30-14",
    ciudad: "Manizales",
    departamento: "Caldas",
    rol: "agente",
    telefonos: ["+57 311 233 1407"],
    comision: 7.0,
    experiencia: 4,
  },
  {
    id: "52.828.576",
    nombre: "Carolina Betancur Ríos",
    correo: "carolina.betancur@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cra. 4 # 17-26",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    rol: "agente",
    telefonos: ["+57 312 236 1444"],
    comision: 10.5,
    experiencia: 12,
  },
  {
    id: "53.847.599",
    nombre: "Felipe Arboleda Vélez",
    correo: "felipe.arboleda@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cl. 19 # 10-35",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    rol: "agente",
    telefonos: ["+57 313 239 1481"],
    comision: 6.5,
    experiencia: 3,
  },
  {
    id: "54.866.622",
    nombre: "Marcela Fonseca Duarte",
    correo: "marcela.fonseca@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Dg. 45 # 12-08",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    rol: "agente",
    telefonos: ["+57 314 242 1518"],
    comision: 8.0,
    experiencia: 7,
  },
  {
    id: "55.885.645",
    nombre: "Ricardo Pineda Sánchez",
    correo: "ricardo.pineda@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cra. 33 # 52-40",
    ciudad: "Cartagena de Indias",
    departamento: "Bolívar",
    rol: "agente",
    telefonos: ["+57 315 245 1555"],
    comision: 9.0,
    experiencia: 10,
  },
  {
    id: "56.904.668",
    nombre: "Isabel Cristina Naranjo Ocampo",
    correo: "isabel.naranjo@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cl. 8 # 3-17",
    ciudad: "Tuluá",
    departamento: "Valle del Cauca",
    rol: "agente",
    telefonos: ["+57 316 248 1592"],
    comision: 7.5,
    experiencia: 5,
  },
  {
    id: "57.923.691",
    nombre: "Héctor Fabio Mora Cuéllar",
    correo: "hector.mora@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Av. Circunvalar # 9-52",
    ciudad: "Palmira",
    departamento: "Valle del Cauca",
    rol: "agente",
    telefonos: ["+57 317 251 1629"],
    comision: 6.0,
    experiencia: 2,
  },
  {
    id: "58.942.714",
    nombre: "Lucía Fernanda Peláez Marín",
    correo: "lucia.pelaez@ejemplo.com",
    hash: "$2b$10$CAsl8sLygCngWAPlg7FC2ufwbrlxZWoXnXUV6br3hyQ6GSGUII8sG",
    direccion: "Cra. 27 # 36-14",
    ciudad: "Montería",
    departamento: "Córdoba",
    rol: "agente",
    telefonos: ["+57 318 254 1666"],
    comision: 8.5,
    experiencia: 8,
  },
  {
    id: "1.001.510.200",
    nombre: "Daniela Cortés Navarro",
    correo: "daniela.cortes@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cl. 22 # 15-61",
    ciudad: "Tuluá",
    departamento: "Valle del Cauca",
    rol: "cliente",
    telefonos: ["+57 320 300 2000", "+57 602 400 5000"],
    publicidad: true,
  },
  {
    id: "1.002.523.217",
    nombre: "Sebastián Aguirre Montoya",
    correo: "sebastian.aguirre@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cra. 11 # 66-09",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    rol: "cliente",
    telefonos: ["+57 321 305 2041"],
    publicidad: true,
  },
  {
    id: "1.003.536.234",
    nombre: "Mariana Lozano Pérez",
    correo: "mariana.lozano@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cl. 100 # 19-30",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    rol: "cliente",
    telefonos: ["+57 322 310 2082"],
    publicidad: false,
  },
  {
    id: "1.004.549.251",
    nombre: "Juan Pablo Henao Soto",
    correo: "juan.henao@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Av. 30 # 8-47",
    ciudad: "Medellín",
    departamento: "Antioquia",
    rol: "cliente",
    telefonos: ["+57 323 315 2123", "+57 605 403 5300"],
    publicidad: true,
  },
  {
    id: "1.005.562.268",
    nombre: "Karen Johana Díaz Ramos",
    correo: "karen.diaz@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cra. 19 # 24-73",
    ciudad: "Barranquilla",
    departamento: "Atlántico",
    rol: "cliente",
    telefonos: ["+57 324 320 2164"],
    publicidad: true,
  },
  {
    id: "1.006.575.285",
    nombre: "Óscar Iván Beltrán Vera",
    correo: "oscar.beltran@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cl. 14 # 6-25",
    ciudad: "Bucaramanga",
    departamento: "Santander",
    rol: "cliente",
    telefonos: ["+57 325 325 2205"],
    publicidad: false,
  },
  {
    id: "1.007.588.302",
    nombre: "Luisa Fernanda Acosta Gil",
    correo: "luisa.acosta@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cra. 8 # 31-16",
    ciudad: "Pereira",
    departamento: "Risaralda",
    rol: "cliente",
    telefonos: ["+57 326 330 2246", "+57 602 406 5600"],
    publicidad: true,
  },
  {
    id: "1.008.601.319",
    nombre: "David Alejandro Cuesta Rey",
    correo: "david.cuesta@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cl. 41 # 27-80",
    ciudad: "Cartagena de Indias",
    departamento: "Bolívar",
    rol: "cliente",
    telefonos: ["+57 327 335 2287"],
    publicidad: true,
  },
  {
    id: "1.009.614.336",
    nombre: "Gabriela Montes Camargo",
    correo: "gabriela.montes@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Av. 2 # 44-19",
    ciudad: "Manizales",
    departamento: "Caldas",
    rol: "cliente",
    telefonos: ["+57 328 340 2328"],
    publicidad: true,
  },
  {
    id: "1.001.627.353",
    nombre: "Brayan Stiven Ríos Valencia",
    correo: "brayan.rios@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cra. 36 # 10-05",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    rol: "cliente",
    telefonos: ["+57 329 345 2369", "+57 605 409 5900"],
    publicidad: false,
  },
  {
    id: "1.002.640.370",
    nombre: "Natalia Ibarra Campos",
    correo: "natalia.ibarra@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cl. 60 # 14-22",
    ciudad: "Ibagué",
    departamento: "Tolima",
    rol: "cliente",
    telefonos: ["+57 320 350 2410"],
    publicidad: true,
  },
  {
    id: "1.003.653.387",
    nombre: "Jorge Eliécer Tamayo Pino",
    correo: "jorge.tamayo@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cra. 6 # 20-48",
    ciudad: "Armenia",
    departamento: "Quindío",
    rol: "cliente",
    telefonos: ["+57 321 355 2451"],
    publicidad: true,
  },
  {
    id: "1.004.666.404",
    nombre: "Andrea Carolina Silva Mora",
    correo: "andrea.silva@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cl. 27 # 9-31",
    ciudad: "Tuluá",
    departamento: "Valle del Cauca",
    rol: "cliente",
    telefonos: ["+57 322 360 2492", "+57 602 412 6200"],
    publicidad: true,
  },
  {
    id: "1.005.679.421",
    nombre: "Miguel Ángel Reyes Cano",
    correo: "miguel.reyes@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Av. 4N # 18-70",
    ciudad: "Popayán",
    departamento: "Cauca",
    rol: "cliente",
    telefonos: ["+57 323 365 2533"],
    publicidad: false,
  },
  {
    id: "1.006.692.438",
    nombre: "Laura Sofía Pacheco Bernal",
    correo: "laura.pacheco@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cra. 21 # 41-13",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    rol: "cliente",
    telefonos: ["+57 324 370 2574"],
    publicidad: true,
  },
  {
    id: "1.007.705.455",
    nombre: "Cristian Camilo Duarte Lara",
    correo: "cristian.duarte@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cl. 9 # 12-56",
    ciudad: "Villavicencio",
    departamento: "Meta",
    rol: "cliente",
    telefonos: ["+57 325 375 2615", "+57 605 415 6500"],
    publicidad: true,
  },
  {
    id: "1.008.718.472",
    nombre: "Paula Andrea Jiménez Roldán",
    correo: "paula.jimenez@ejemplo.com",
    hash: "$2b$10$Mp/sbb1CRhyY6j8sdk5y9.jjWcEPYzELTigMyBZWyMNf/BsR7oHWq",
    direccion: "Cra. 14 # 33-02",
    ciudad: "Palmira",
    departamento: "Valle del Cauca",
    rol: "cliente",
    telefonos: ["+57 326 380 2656"],
    publicidad: true,
  },
];

const EVENTOS = [
  {
    codigo: "EVT-007",
    nombre: "Noche de Salsa — Orquesta del Pacífico",
    descripcion:
      "Una noche de salsa en vivo con la orquesta más querida del Pacífico colombiano, para bailar de principio a fin.",
    teatro: "Teatro Municipal",
    capacidad: 600,
    precio: 70000,
    inicio: "2026-03-14 20:00",
    fin: "2026-03-14 23:30",
    observacion: "Función única.",
    imagen: "photo-1575448913281-98e9e5d3f193",
    ciudad: "Cali",
    departamento: "Valle del Cauca",
    estado: "Finalizado",
    agente: "40.600.300",
  },
  {
    codigo: "EVT-008",
    nombre: "Festival Gastronómico del Eje Cafetero",
    descripcion:
      "Un día completo de cocina regional, café de origen y degustaciones con chefs invitados de toda la región.",
    teatro: "Plaza de Eventos",
    capacidad: 1200,
    precio: 30000,
    inicio: "2026-05-23 11:00",
    fin: "2026-05-23 20:00",
    observacion: "Incluye degustaciones.",
    imagen: "photo-1714523479594-13c0bb72fcf3",
    ciudad: "Pereira",
    departamento: "Risaralda",
    estado: "Finalizado",
    agente: "41.619.323",
  },
  {
    codigo: "EVT-009",
    nombre: "Orquesta Sinfónica — Gran Gala de Aniversario",
    descripcion:
      "La sinfónica celebra su aniversario con un programa de obras clásicas y populares dirigido por un maestro invitado.",
    teatro: "Teatro Metropolitano",
    capacidad: 900,
    precio: 95000,
    inicio: "2026-07-18 19:30",
    fin: "2026-07-18 22:00",
    observacion: "Vestuario formal recomendado.",
    imagen: "photo-1770101516568-f6a11a26219c",
    ciudad: "Medellín",
    departamento: "Antioquia",
    estado: "Finalizado",
    agente: "42.638.346",
  },
  {
    codigo: "EVT-010",
    nombre: "La Casa de los Espejos — Obra de Teatro",
    descripcion:
      "Un drama contemporáneo sobre una familia y sus secretos, interpretado por un elenco de actores bogotanos.",
    teatro: "Teatro Nacional",
    capacidad: 350,
    precio: 55000,
    inicio: "2026-09-26 18:00",
    fin: "2026-09-26 20:30",
    observacion: "Mayores de 14 años.",
    imagen: "photo-1785057687748-40331d6acf7c",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    estado: "Finalizado",
    agente: "43.657.369",
  },
  {
    codigo: "EVT-011",
    nombre: "Concierto de Navidad — Coro de Cámara",
    descripcion:
      "Villancicos y música coral navideña interpretados por el coro de cámara de la ciudad.",
    teatro: "Auditorio Principal",
    capacidad: 400,
    precio: 45000,
    inicio: "2026-12-12 19:00",
    fin: "2026-12-12 21:00",
    observacion: "Entrada con boleta numerada.",
    imagen: "photo-1759502418494-bee52af25972",
    ciudad: "Manizales",
    departamento: "Caldas",
    estado: "En Boletería",
    agente: "41.619.323",
  },
  {
    codigo: "EVT-012",
    nombre: "Carnaval de las Artes — Show Familiar",
    descripcion:
      "Comparsas, música y danza para toda la familia en el cierre de año del carnaval de las artes.",
    teatro: "Coliseo Cubierto",
    capacidad: 1500,
    precio: 50000,
    inicio: "2026-12-19 17:00",
    fin: "2026-12-19 22:00",
    observacion: "Niños menores de 5 años no pagan.",
    imagen: "photo-1785835394980-8c395e26ebdb",
    ciudad: "Barranquilla",
    departamento: "Atlántico",
    estado: "En Boletería",
    agente: "44.676.392",
  },
  {
    codigo: "EVT-013",
    nombre: "Maratón de Comedia — Cinco Comediantes",
    descripcion:
      "Cinco comediantes se turnan el escenario en una noche de humor sin pausa.",
    teatro: "Teatro del Centro",
    capacidad: 500,
    precio: 40000,
    inicio: "2027-01-22 20:00",
    fin: "2027-01-22 22:30",
    observacion: "Contenido para mayores de 16 años.",
    imagen: "photo-1507676184212-d03ab07a01bf",
    ciudad: "Bucaramanga",
    departamento: "Santander",
    estado: "En Boletería",
    agente: "45.695.415",
  },
  {
    codigo: "EVT-014",
    nombre: "Festival de Rock Regional",
    descripcion:
      "Siete bandas del centro del país en una jornada de rock al aire libre.",
    teatro: "Parque Deportivo",
    capacidad: 2500,
    precio: 80000,
    inicio: "2027-02-13 15:00",
    fin: "2027-02-13 23:00",
    observacion: "Evento al aire libre; se permite el ingreso con sombrilla.",
    imagen: "photo-1516450360452-9312f5e86fc7",
    ciudad: "Ibagué",
    departamento: "Tolima",
    estado: "En Boletería",
    agente: "46.714.438",
  },
  {
    codigo: "EVT-015",
    nombre: "Raíces de Colombia — Ballet Folclórico",
    descripcion:
      "Un recorrido por las danzas de las cinco regiones del país con vestuario y música en vivo.",
    teatro: "Teatro Municipal",
    capacidad: 450,
    precio: 35000,
    inicio: "2027-03-06 19:00",
    fin: "2027-03-06 21:30",
    observacion: "Apto para todo público.",
    imagen: "photo-1777924985623-0d5f0f216942",
    ciudad: "Tuluá",
    departamento: "Valle del Cauca",
    estado: "En Boletería",
    agente: "40.600.300",
  },
  {
    codigo: "EVT-016",
    nombre: "Noche de Tango y Bolero",
    descripcion:
      "Dos géneros del alma latina en una sola noche, con orquesta y cantantes invitados.",
    teatro: "Casa de la Cultura",
    capacidad: 300,
    precio: 45000,
    inicio: "2027-03-27 20:00",
    fin: "2027-03-27 23:00",
    observacion: "Mesas para parejas y grupos.",
    imagen: "photo-1760428300151-f4702f39fe83",
    ciudad: "Armenia",
    departamento: "Quindío",
    estado: "En Boletería",
    agente: "47.733.461",
  },
  {
    codigo: "EVT-017",
    nombre: "Gran Circo de las Estrellas",
    descripcion:
      "Un circo con trapecistas, payasos y números de fuego para disfrutar en familia.",
    teatro: "Carpa Central",
    capacidad: 1000,
    precio: 60000,
    inicio: "2027-05-15 17:00",
    fin: "2027-05-15 20:00",
    observacion: "La venta de boletas empieza en febrero.",
    imagen: "photo-1658843343904-0341c4400c25",
    ciudad: "Villavicencio",
    departamento: "Meta",
    estado: "Programado",
    agente: "48.752.484",
  },
  {
    codigo: "EVT-018",
    nombre: "Festival de Cine al Aire Libre",
    descripcion:
      "Una semana de películas colombianas proyectadas al aire libre, con charlas con sus directores.",
    teatro: "Plaza Central",
    capacidad: 800,
    precio: 20000,
    inicio: "2027-06-04 18:30",
    fin: "2027-06-04 22:30",
    observacion: "Traer silla o cojín.",
    imagen: "photo-1583795484071-3c453e3a7c71",
    ciudad: "Santa Marta",
    departamento: "Magdalena",
    estado: "Programado",
    agente: "49.771.507",
  },
  {
    codigo: "EVT-019",
    nombre: "Concierto Tributo a los Clásicos del Rock",
    descripcion:
      "Un tributo a las bandas que marcaron generaciones, con músicos de la región.",
    teatro: "Teatro Municipal",
    capacidad: 700,
    precio: 85000,
    inicio: "2026-11-28 20:00",
    fin: "2026-11-28 23:00",
    observacion:
      "Cancelado por: lluvias fuertes que dañaron el escenario al aire libre.",
    imagen: "photo-1484876065684-b683cf17d276",
    ciudad: "Popayán",
    departamento: "Cauca",
    estado: "Cancelado",
    agente: "42.638.346",
  },
  {
    codigo: "EVT-020",
    nombre: "Feria Artesanal del Huila",
    descripcion:
      "Artesanos de todo el departamento exponen y venden sus trabajos en tejido, cerámica y madera.",
    teatro: "Plaza de Eventos",
    capacidad: 600,
    precio: 15000,
    inicio: "2026-12-05 10:00",
    fin: "2026-12-05 18:00",
    observacion:
      "Cancelado por: no se obtuvo el permiso del municipio a tiempo.",
    imagen: "photo-1770129157442-5f080cacf11c",
    ciudad: "Neiva",
    departamento: "Huila",
    estado: "Cancelado",
    agente: "50.790.530",
  },
];

const RESERVAS = [
  {
    cliente: "1.001.510.200",
    evento: "EVT-007",
    fecha: "2026-02-20 15:10",
    entradas: 2,
    estado: "Confirmada",
    observacion: "",
  },
  {
    cliente: "1.002.523.217",
    evento: "EVT-007",
    fecha: "2026-03-01 11:30",
    entradas: 4,
    estado: "Confirmada",
    observacion: "Mesa para un cumpleaños.",
  },
  {
    cliente: "1.003.536.234",
    evento: "EVT-008",
    fecha: "2026-04-18 09:45",
    entradas: 3,
    estado: "Confirmada",
    observacion: "",
  },
  {
    cliente: "1.004.549.251",
    evento: "EVT-008",
    fecha: "2026-05-02 17:20",
    entradas: 5,
    estado: "Confirmada",
    observacion: "",
  },
  {
    cliente: "1.005.562.268",
    evento: "EVT-009",
    fecha: "2026-06-10 13:05",
    entradas: 2,
    estado: "Confirmada",
    observacion: "Cerca del pasillo.",
  },
  {
    cliente: "1.006.575.285",
    evento: "EVT-009",
    fecha: "2026-06-28 20:40",
    entradas: 1,
    estado: "Cancelada",
    observacion: "Cancelada por el cliente: no podrá asistir.",
  },
  {
    cliente: "1.007.588.302",
    evento: "EVT-010",
    fecha: "2026-08-15 10:00",
    entradas: 4,
    estado: "Confirmada",
    observacion: "",
  },
  {
    cliente: "1.008.601.319",
    evento: "EVT-010",
    fecha: "2026-09-05 16:25",
    entradas: 2,
    estado: "Confirmada",
    observacion: "",
  },
  {
    cliente: "1.009.614.336",
    evento: "EVT-011",
    fecha: "2026-10-12 12:15",
    entradas: 6,
    estado: "Reservada",
    observacion: "Grupo del coro de la universidad.",
  },
  {
    cliente: "1.001.627.353",
    evento: "EVT-012",
    fecha: "2026-10-21 18:30",
    entradas: 4,
    estado: "Confirmada",
    observacion: "",
  },
  {
    cliente: "1.002.640.370",
    evento: "EVT-013",
    fecha: "2026-10-27 09:10",
    entradas: 3,
    estado: "Reservada",
    observacion: "",
  },
  {
    cliente: "1.003.653.387",
    evento: "EVT-014",
    fecha: "2026-11-02 14:50",
    entradas: 2,
    estado: "Confirmada",
    observacion: "",
  },
  {
    cliente: "1.004.666.404",
    evento: "EVT-015",
    fecha: "2026-11-04 19:00",
    entradas: 5,
    estado: "Reservada",
    observacion: "",
  },
  {
    cliente: "1.005.679.421",
    evento: "EVT-019",
    fecha: "2026-10-30 11:20",
    entradas: 2,
    estado: "Cancelada",
    observacion: "Cancelada: el evento fue cancelado por lluvias.",
  },
  {
    cliente: "1.006.692.438",
    evento: "EVT-016",
    fecha: "2026-11-06 10:40",
    entradas: 2,
    estado: "Confirmada",
    observacion: "",
  },
];

const TABLAS = ["cliente", "agente", "administrador", "evento", "reserva"];
const contar = async (client, tabla) =>
  Number((await client.query(`SELECT COUNT(*) AS n FROM ${tabla}`)).rows[0].n);

export async function cargarDatosDemo({ simular: SIMULAR = false } = {}) {
  if (SIMULAR)
    console.log("MODO SIMULACIÓN: no se escribe nada en la base de datos.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Ciudades y estados que se necesitan: si falta alguno, no se cambia nada
    const ciudades = new Map(
      (
        await client.query(
          `SELECT c.id, c.nombre, d.nombre AS departamento FROM ciudad c
         JOIN departamento d ON d.id = c.departamento_id JOIN pais p ON p.id = d.pais_id WHERE LOWER(p.nombre) = 'colombia'`,
        )
      ).rows.map((r) => [`${clave(r.departamento)}|${clave(r.nombre)}`, r.id]),
    );
    const idCiudad = (nombre, departamento) =>
      ciudades.get(`${clave(departamento)}|${clave(nombre)}`);
    const necesarias = new Map();
    for (const x of [...PERSONAS, ...EVENTOS])
      necesarias.set(`${x.departamento}|${x.ciudad}`, [
        x.ciudad,
        x.departamento,
      ]);
    const faltan = [...necesarias.values()].filter(
      ([c, d]) => idCiudad(c, d) === undefined,
    );
    if (faltan.length)
      throw new Error(
        `faltan estas ciudades en la base: ${faltan.map(([c, d]) => `${c} (${d})`).join(", ")}. ¿Ya corriste «npm run municipios»? No se cambió nada.`,
      );
    const estadoEvento = new Map(
      (await client.query("SELECT id, nombre FROM estado_evento")).rows.map(
        (r) => [r.nombre, r.id],
      ),
    );
    const estadoReserva = new Map(
      (await client.query("SELECT id, nombre FROM estado_reserva")).rows.map(
        (r) => [r.nombre, r.id],
      ),
    );
    for (const e of new Set(EVENTOS.map((x) => x.estado)))
      if (!estadoEvento.has(e))
        throw new Error(
          `falta el estado de evento «${e}». ¿Ya corriste «npm run seed»? No se cambió nada.`,
        );
    for (const e of new Set(RESERVAS.map((x) => x.estado)))
      if (!estadoReserva.has(e))
        throw new Error(
          `falta el estado de reserva «${e}». ¿Ya corriste «npm run seed»? No se cambió nada.`,
        );

    // 2. Personas (agentes y clientes) con sus teléfonos
    const nuevo = {
      personas: 0,
      agentes: 0,
      clientes: 0,
      telefonos: 0,
      eventos: 0,
      reservas: 0,
    };
    const yaEstaban = { personas: 0, eventos: 0, reservas: 0 };
    for (const p of PERSONAS) {
      const r = await client.query(
        `INSERT INTO persona (identificacion, nombre_completo, correo, contrasena, direccion, ciudad_id)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING RETURNING identificacion`,
        [
          p.id,
          p.nombre,
          p.correo,
          p.hash,
          p.direccion,
          idCiudad(p.ciudad, p.departamento),
        ],
      );
      if (r.rows.length) nuevo.personas++;
      else yaEstaban.personas++;
      for (const t of p.telefonos) {
        const rt = await client.query(
          "INSERT INTO telefono_persona (persona_id, telefono) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id",
          [p.id, t],
        );
        nuevo.telefonos += rt.rows.length;
      }
      if (p.rol === "agente") {
        const ra = await client.query(
          "INSERT INTO agente (persona_id, comision, experiencia) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING persona_id",
          [p.id, p.comision, p.experiencia],
        );
        nuevo.agentes += ra.rows.length;
      } else {
        const rc = await client.query(
          "INSERT INTO cliente (persona_id, puntos, publicidad) VALUES ($1, 0, $2) ON CONFLICT DO NOTHING RETURNING persona_id",
          [p.id, p.publicidad],
        );
        nuevo.clientes += rc.rows.length;
      }
    }

    // 3. Eventos
    for (const e of EVENTOS) {
      const r = await client.query(
        `INSERT INTO evento (codigo, nombre, descripcion, teatro, capacidad, precio_base, fecha_hora_inicio, fecha_hora_fin, observacion, imagen, ciudad_id, estado_evento_id, agente_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (codigo) DO NOTHING RETURNING id`,
        [
          e.codigo,
          e.nombre,
          e.descripcion,
          e.teatro,
          e.capacidad,
          e.precio,
          `${e.inicio}:00`,
          `${e.fin}:00`,
          e.observacion,
          e.imagen,
          idCiudad(e.ciudad, e.departamento),
          estadoEvento.get(e.estado),
          e.agente,
        ],
      );
      if (r.rows.length) nuevo.eventos++;
      else yaEstaban.eventos++;
    }

    // 4. Reservas: el total es entradas por el precio base del evento, como lo calcula el servidor
    for (const r of RESERVAS) {
      const ev = (
        await client.query(
          "SELECT id, precio_base FROM evento WHERE codigo = $1",
          [r.evento],
        )
      ).rows[0];
      if (!ev)
        throw new Error(`no existe el evento ${r.evento}. No se cambió nada.`);
      const fecha = `${r.fecha}:00`;
      const ya = await client.query(
        "SELECT id FROM reserva WHERE cliente_id = $1 AND evento_id = $2 AND fecha_hora = $3",
        [r.cliente, ev.id, fecha],
      );
      if (ya.rows.length) {
        yaEstaban.reservas++;
        continue;
      }
      await client.query(
        `INSERT INTO reserva (fecha_hora, num_entradas, total, observacion, cliente_id, evento_id, estado_reserva_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          fecha,
          r.entradas,
          r.entradas * Number(ev.precio_base),
          r.observacion,
          r.cliente,
          ev.id,
          estadoReserva.get(r.estado),
        ],
      );
      nuevo.reservas++;
    }

    const totales = {};
    for (const t of TABLAS) totales[t] = await contar(client, t);
    await client.query(SIMULAR ? "ROLLBACK" : "COMMIT");

    console.log(
      `Personas:  ${nuevo.personas} nuevas (${nuevo.agentes} agentes y ${nuevo.clientes} clientes), ${yaEstaban.personas} ya existían. Teléfonos nuevos: ${nuevo.telefonos}.`,
    );
    console.log(
      `Eventos:   ${nuevo.eventos} nuevos, ${yaEstaban.eventos} ya existían.`,
    );
    console.log(
      `Reservas:  ${nuevo.reservas} nuevas, ${yaEstaban.reservas} ya existían.`,
    );
    console.log(
      `${SIMULAR ? "Quedarían" : "Quedaron"} en la base: ${totales.cliente} clientes, ${totales.agente} agentes, ${totales.administrador} administrador(es), ${totales.evento} eventos y ${totales.reserva} reservas.`,
    );
    const bajos = ["cliente", "agente", "evento", "reserva"].filter(
      (t) => totales[t] < 20,
    );
    if (bajos.length)
      console.log(
        `AVISO: ${bajos.join(", ")} quedan con menos de 20. ¿Está completo el seed (npm run seed)?`,
      );
    return { nuevo, yaEstaban, totales };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Cuando se ejecuta con «npm run datos-demo» (y no cuando otro archivo lo importa)
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  cargarDatosDemo({ simular: process.argv.includes("--simular") })
    .catch((error) => {
      console.error(
        "No se agregaron los datos de demostración:",
        error.message,
      );
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
