import { api } from "./cliente";

// Solo agentes: los ids de los eventos que creó la persona que inició sesión.
// La identificación del agente no viaja con cada evento (el listado es público y es un dato
// personal), así que cada agente pregunta aquí cuáles son suyos.
export async function listarMisEventos(): Promise<number[]> {
  return api.get<number[]>("/api/eventos/mios");
}
