import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import catalogosRoutes from "./routes/catalogos.js";
import authRoutes from "./routes/auth.js";
import eventosRoutes from "./routes/eventos.js";
import reservasRoutes from "./routes/reservas.js";
import pagosRoutes, { webhookStripe } from "./routes/pagos.js";
import reportesRoutes from "./routes/reportes.js";
import perfilRoutes from "./routes/perfil.js";
import personasRoutes from "./routes/personas.js";

if (!process.env.JWT_SECRET) {
  console.error("Falta JWT_SECRET en backend/.env");
  process.exit(1);
}

const app = express();
   // Orígenes permitidos: CORS_ORIGIN puede traer varias URLs separadas por coma.
   // Sin la variable, solo el entorno local.
   const origenesPermitidos = (process.env.CORS_ORIGIN || "http://localhost:8443")
     .split(",")
     .map((o) => o.trim().replace(/\/$/, ""))
     .filter(Boolean);
   app.use(cors({ origin: origenesPermitidos }));
// Límite alto porque un evento puede traer una imagen subida (en base64)

// El webhook de Stripe tiene que ir ANTES de express.json(): Stripe firma el cuerpo tal
// cual lo manda, y la firma solo se puede comprobar si el cuerpo no se ha procesado.
app.post(
  "/api/pagos/webhook",
  express.raw({ type: "application/json" }),
  webhookStripe,
);
app.use(express.json({ limit: "10mb" }));

app.use("/api", catalogosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/personas", personasRoutes);

// Comprueba que el servidor y la base de datos responden
app.get("/api/salud", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS tablas FROM information_schema.tables WHERE table_schema = 'public'",
    );
    res.json({ servidor: "ok", baseDeDatos: "ok", tablas: rows[0].tablas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ servidor: "ok", baseDeDatos: "error" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
