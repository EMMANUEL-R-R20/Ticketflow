import { useMemo } from "react";
import type { Screen, Role, Evento, Reserva } from "../../../models/types";
import { fmtPrice, fmtDate, unsplash } from "../../../utils/format";
import { Btn } from "../../../views/components/Btn";
import { Badge } from "../../../views/components/Badge";
import { StatCard } from "../../../views/components/StatCard";
import { PageHeader } from "../../../views/layouts/PageHeader";

// ─── AGENT DASHBOARD ─────────────────────────────────────────────────────────
export function AgentDashboard({
  eventos,
  reservas,
  misIds,
}: {
  onNav: (s: Screen, r?: Role, eventId?: number | null) => void;
  eventos: Evento[];
  reservas: Reserva[];
  // Ids de los eventos de este agente; null mientras se cargan
  misIds: number[] | null;
}) {
  // Las cifras y listas del panel son solo las de este agente
  const propios = useMemo(() => new Set(misIds ?? []), [misIds]);
  const misEventos = eventos.filter((e) => propios.has(e.id));
  const reservasValidas = reservas.filter((r) => propios.has(r.eventoId));
  return (
    <>
      <PageHeader
        title="Dashboard Agente"
        subtitle="Gestiona tus eventos y reservas"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Eventos registrados"
          value={misEventos.length}
          icon="🎭"
          color="violet"
        />
        <StatCard
          label="Eventos activos"
          value={misEventos.filter((e) => e.estado === "En Boletería").length}
          icon="✅"
          color="emerald"
        />
        <StatCard
          label="Reservas recibidas"
          value={reservasValidas.length}
          icon="🎫"
          color="blue"
        />
        <StatCard
          label="Reservas pendientes"
          value={reservasValidas.filter((r) => r.estado === "Reservada").length}
          icon="⏳"
          color="amber"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3
            className="text-xl font-extrabold text-gray-800 mb-4"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Mis eventos recientes
          </h3>
          <div className="space-y-3">
            {misEventos.length === 0 && (
              <p className="text-sm text-gray-400">
                Todavía no has creado eventos.
              </p>
            )}
            {misEventos.slice(0, 4).map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
              >
                <img
                  src={unsplash(ev.imagen, 60, 40)}
                  alt={ev.nombre}
                  className="rounded-lg w-12 h-8 object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {ev.nombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {ev.ciudad} · {fmtDate(ev.fecha)}
                  </p>
                </div>
                <Badge status={ev.estado} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3
            className="text-xl font-extrabold text-gray-800 mb-4"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Últimas reservas
          </h3>
          <div className="space-y-3">
            {reservasValidas.length === 0 && (
              <p className="text-sm text-gray-400">Todavía no hay reservas.</p>
            )}
            {reservasValidas.slice(0, 4).map((r) => {
              const ev = misEventos.find((e) => e.id === r.eventoId)!;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {r.cliente}
                    </p>
                    <p className="text-xs text-gray-400">{ev.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-violet-700">
                      {fmtPrice(r.total)}
                    </p>
                    <Badge status={r.estado} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
