import { useMemo, useState } from "react";
import type {
  ReservaStatus,
  Reserva,
  Evento,
  Screen,
  Role,
} from "../../../models/types";
import { fmtPrice, fmtDate } from "../../../utils/format";
import { entradasDisponibles } from "../../../utils/cupo";
import { mensajeDeError } from "../../../models/api/cliente";
import { Badge } from "../../../views/components/Badge";
import { ConfirmarModal } from "../../../views/components/ConfirmarModal";
import {
  CancelarModal,
  EditarModal,
} from "../../../views/components/ReservaModales";
import { PageHeader } from "../../../views/layouts/PageHeader";

// ─── AGENT RESERVATIONS ───────────────────────────────────────────────────────
export function AgentReservations({
  reservas,
  eventos,
  misIds,
  cambiarEstadoReserva,
  cancelarReserva,
  editarReserva,
  eliminarReserva,
}: {
  onNav: (s: Screen, r?: Role, eventId?: number | null) => void;
  reservas: Reserva[];
  eventos: Evento[];
  // Ids de los eventos de este agente; null mientras se cargan
  misIds: number[] | null;
  cambiarEstadoReserva: (id: number, estado: ReservaStatus) => Promise<void>;
  cancelarReserva: (id: number, causa: string) => Promise<void>;
  editarReserva: (
    id: number,
    entradas: number,
    observaciones: string,
  ) => Promise<void>;
  eliminarReserva: (id: number) => Promise<void>;
}) {
  const [aviso, setAviso] = useState("");
  const [cancelando, setCancelando] = useState<Reserva | null>(null);
  const [editando, setEditando] = useState<Reserva | null>(null);
  const [eliminando, setEliminando] = useState<Reserva | null>(null);
  const eventoDe = (r: Reserva) => eventos.find((e) => e.id === r.eventoId)!;

  // «De mis eventos»: las reservas de los eventos de este agente, que sí puede administrar.
  // «Todas»: todas las reservas, solo para consultar.
  const [pestana, setPestana] = useState<"mias" | "todas">("mias");
  const cargando = misIds === null;
  const propios = useMemo(() => new Set(misIds ?? []), [misIds]);
  const validas = reservas.filter((r) =>
    eventos.some((e) => e.id === r.eventoId),
  );
  const mias = validas.filter((r) => propios.has(r.eventoId));
  const editable = pestana === "mias";
  const lista = editable ? mias : validas;
  const pestanas: { id: "mias" | "todas"; texto: string; cuantos: number | null }[] = [
    { id: "mias", texto: "De mis eventos", cuantos: cargando ? null : mias.length },
    { id: "todas", texto: "Todas", cuantos: validas.length },
  ];

  // Cancelar pide el motivo (en una ventana); confirmar o reactivar se hace directo.
  // Reactivar una cancelada exige cupo: si no hay, el servidor responde con un mensaje.
  async function cambiar(r: Reserva, nuevo: ReservaStatus) {
    if (nuevo === r.estado) return;
    setAviso("");
    if (nuevo === "Cancelada") {
      setCancelando(r);
      return;
    }
    try {
      await cambiarEstadoReserva(r.id, nuevo);
    } catch (e) {
      setAviso(mensajeDeError(e));
    }
  }

  return (
    <>
      <PageHeader
        title="Gestión de Reservas"
        subtitle="Administra las reservas recibidas en tus eventos"
      />
      <div
        role="tablist"
        aria-label="Qué reservas ver"
        className="flex flex-wrap gap-2 mb-4"
      >
        {pestanas.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition cursor-pointer ${pestana === p.id ? "bg-violet-700 border-violet-700 text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-violet-50"}`}
          >
            {p.texto}
            <span
              className={`ml-2 text-xs rounded-full px-2 py-0.5 ${pestana === p.id ? "bg-white/25 text-white" : "bg-violet-100 text-violet-800"}`}
            >
              {p.cuantos ?? "…"}
            </span>
          </button>
        ))}
      </div>
      {!editable && (
        <div
          role="note"
          className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-xl p-3 mb-4"
        >
          Solo puedes administrar las reservas de <b>tus</b> eventos. Estas se
          muestran para consultar; para cambiarlas, usa la pestaña «De mis
          eventos».
        </div>
      )}
      {aviso && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4"
        >
          {aviso}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ background: "#F5F6FA" }}>
                {[
                  "ID",
                  "Cliente",
                  "Evento",
                  ...(editable ? [] : ["Agente del evento"]),
                  "Fecha reserva",
                  "Entradas",
                  "Total",
                  "Estado",
                  "Observaciones",
                  ...(editable ? ["Acción"] : []),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    {editable
                      ? cargando
                        ? "Cargando tus reservas…"
                        : "Todavía no hay reservas en tus eventos."
                      : "Todavía no hay reservas."}
                  </td>
                </tr>
              )}
              {lista.map((r) => {
                  const ev = eventoDe(r);
                  // Una reserva cancelada solo se puede reactivar si hay cupo para ella
                  const sinCupo =
                    r.estado === "Cancelada" &&
                    r.entradas > entradasDisponibles(ev, reservas);
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-gray-50 hover:bg-violet-50/30 transition"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                        #{r.id}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-800">
                        {r.cliente}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 max-w-36 truncate">
                        {ev.nombre}
                      </td>
                      {!editable && (
                        <td className="px-4 py-3.5 text-sm text-gray-600">
                          {ev.agente}
                          {propios.has(r.eventoId) ? " (tú)" : ""}
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {fmtDate(r.fechaReserva)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-center font-bold text-gray-800">
                        {r.entradas}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-violet-700">
                        {fmtPrice(r.total)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={r.estado} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-32 truncate">
                        {r.observaciones || "—"}
                      </td>
                      {editable && (
                      <td className="px-4 py-3.5">
                        <select
                          value={r.estado}
                          aria-label={`Estado de la reserva ${r.id}`}
                          onChange={(e) =>
                            cambiar(r, e.target.value as ReservaStatus)
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                        >
                          {["Reservada", "Confirmada", "Cancelada"].map((s) => (
                            <option
                              key={s}
                              value={s}
                              disabled={sinCupo && s !== "Cancelada"}
                            >
                              {s}
                              {sinCupo && s !== "Cancelada"
                                ? " (sin cupo)"
                                : ""}
                            </option>
                          ))}
                        </select>
                        <div className="mt-1.5 flex gap-3">
                          {r.estado !== "Cancelada" && (
                            <button
                              onClick={() => setEditando(r)}
                              className="text-xs text-violet-600 hover:underline cursor-pointer"
                            >
                              Editar
                            </button>
                          )}
                          {r.estado === "Cancelada" && (
                            <button
                              onClick={() => setEliminando(r)}
                              className="text-xs text-red-500 hover:underline cursor-pointer"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      {cancelando && (
        <CancelarModal
          reserva={cancelando}
          evento={eventoDe(cancelando)}
          onClose={() => setCancelando(null)}
          cancelarReserva={cancelarReserva}
        />
      )}
      {editando && (
        <EditarModal
          reserva={editando}
          evento={eventoDe(editando)}
          onClose={() => setEditando(null)}
          editarReserva={editarReserva}
        />
      )}
      {eliminando && (
        <ConfirmarModal
          titulo={`Eliminar reserva #${eliminando.id}`}
          mensaje="Se borrará de la base de datos y dejará de aparecer en los reportes. Esta acción no se puede deshacer."
          textoConfirmar="Eliminar reserva"
          onConfirmar={() => eliminarReserva(eliminando.id)}
          onClose={() => setEliminando(null)}
        />
      )}
    </>
  );
}
