import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Screen, Role, Evento, EventStatus } from "../../../models/types";
import { fmtPrice, fmtDate, unsplash } from "../../../utils/format";
import { Btn } from "../../../views/components/Btn";
import { Badge } from "../../../views/components/Badge";
import { ConfirmarModal } from "../../../views/components/ConfirmarModal";
import { PageHeader } from "../../../views/layouts/PageHeader";

const ESTADOS: EventStatus[] = [
  "En Boletería",
  "Programado",
  "En Vivo",
  "Finalizado",
  "Cancelado",
];

type Pestana = "mios" | "todos";

// "19:00" → "7:00 p. m."
function hora(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "p. m." : "a. m."}`;
}

// ─── DETALLE DE UN EVENTO ────────────────────────────────────────────────────
// Ventana solo de lectura. «Editar» aparece solo si el evento es de este agente.
function DetalleEvento({
  ev,
  esMio,
  onEditar,
  onClose,
}: {
  ev: Evento;
  esMio: boolean;
  onEditar: () => void;
  onClose: () => void;
}) {
  // Se cierra con la tecla Esc
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  const cancelado = ev.estado === "Cancelado";
  const datos: { titulo: string; valor: ReactNode }[] = [
    {
      titulo: "📍 Lugar",
      valor: (
        <>
          {ev.teatro}
          <br />
          {ev.ciudad}, {ev.departamento}, {ev.pais}
        </>
      ),
    },
    {
      titulo: "💵 Precio",
      valor: (
        <span className="font-bold text-violet-700">{fmtPrice(ev.precio)}</span>
      ),
    },
    {
      titulo: "📅 Inicio",
      valor: `${fmtDate(ev.fecha)} · ${hora(ev.horaInicio)}`,
    },
    {
      titulo: "🏁 Fin",
      valor: `${fmtDate(ev.fechaFin ?? ev.fecha)} · ${hora(ev.horaFin)}`,
    },
    {
      titulo: "🎟️ Capacidad",
      valor: `${ev.capacidad.toLocaleString()}${ev.disponibles !== undefined ? ` · quedan ${ev.disponibles.toLocaleString()}` : ""}`,
    },
    {
      titulo: "👤 Creado por",
      valor: (
        <>
          {ev.agente}
          {esMio && (
            <span className="ml-1 text-xs font-bold text-violet-700">(tú)</span>
          )}
        </>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-evento-titulo"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={unsplash(ev.imagen, 900, 360)}
            alt={ev.nombre}
            className="w-full h-48 object-cover rounded-t-3xl"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-7">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="detalle-evento-titulo"
              className="text-xl font-extrabold text-gray-900 leading-tight"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {ev.nombre}
            </h2>
            <Badge status={ev.estado} />
          </div>
          <p className="font-mono text-xs text-gray-500 mt-1 mb-3">
            {ev.codigo}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {ev.descripcion || "Sin descripción."}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 mb-4">
            {datos.map((d) => (
              <div key={d.titulo}>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {d.titulo}
                </dt>
                <dd className="text-sm text-gray-800">{d.valor}</dd>
              </div>
            ))}
          </dl>
          {(cancelado || ev.observaciones) && (
            <div
              className={`rounded-xl p-3 mb-4 text-sm ${cancelado ? "bg-red-50 border border-red-200 text-red-800" : "bg-gray-50 text-gray-600"}`}
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${cancelado ? "text-red-800" : "text-gray-500"}`}
              >
                {cancelado ? "Motivo de la cancelación" : "Observaciones"}
              </p>
              {ev.observaciones ||
                (cancelado ? "No se registró un motivo." : "")}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            {!esMio && (
              <span className="mr-auto text-xs text-gray-500">
                🔒 Es de otro agente: solo lectura
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cerrar
            </button>
            {esMio && <Btn onClick={onEditar}>✏️ Editar evento</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AGENT MY EVENTS ─────────────────────────────────────────────────────────
// «Mis eventos» muestra solo los que creó este agente y deja editarlos o eliminarlos.
// «Todos los eventos» muestra todos, pero los de otros agentes son solo de consulta.
export function AgentMyEvents({
  onNav,
  eventos,
  misIds,
  eliminarEvento,
}: {
  onNav: (s: Screen, r?: Role, eventId?: number | null) => void;
  eventos: Evento[];
  // Ids de los eventos de este agente; null mientras se cargan
  misIds: number[] | null;
  eliminarEvento: (id: number) => Promise<void>;
}) {
  const [porEliminar, setPorEliminar] = useState<Evento | null>(null);
  const [verDetalle, setVerDetalle] = useState<Evento | null>(null);
  const [pestana, setPestana] = useState<Pestana>("mios");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EventStatus | "Todos">("Todos");
  const [ciudad, setCiudad] = useState("");

  const cargando = misIds === null;
  const propios = useMemo(() => new Set(misIds ?? []), [misIds]);
  const mios = eventos.filter((e) => propios.has(e.id));
  const lista = pestana === "mios" ? mios : eventos;
  const ciudades = Array.from(new Set(lista.map((e) => e.ciudad))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
  const texto = busqueda.trim().toLowerCase();
  const visibles = lista.filter(
    (e) =>
      (estado === "Todos" || e.estado === estado) &&
      (ciudad === "" || e.ciudad === ciudad) &&
      (texto === "" ||
        e.nombre.toLowerCase().includes(texto) ||
        e.codigo.toLowerCase().includes(texto) ||
        e.teatro.toLowerCase().includes(texto)),
  );
  const hayFiltros = texto !== "" || estado !== "Todos" || ciudad !== "";
  const verTodos = pestana === "todos";
  const columnas = verTodos ? 9 : 8;

  function limpiarFiltros() {
    setBusqueda("");
    setEstado("Todos");
    setCiudad("");
  }
  // Al cambiar de pestaña se quita el filtro de ciudad: puede que esa ciudad no esté en la otra lista
  function cambiarPestana(p: Pestana) {
    setPestana(p);
    setCiudad("");
  }

  const pestanas: { id: Pestana; texto: string; cuantos: number | null }[] = [
    {
      id: "mios",
      texto: "Mis eventos",
      cuantos: cargando ? null : mios.length,
    },
    { id: "todos", texto: "Todos los eventos", cuantos: eventos.length },
  ];

  return (
    <>
      <PageHeader
        title="Mis Eventos"
        subtitle="Gestiona los eventos que has creado"
        actions={
          <Btn onClick={() => onNav("agent-register-event", undefined, null)}>
            ➕ Nuevo evento
          </Btn>
        }
      />

      <div
        role="tablist"
        aria-label="Qué eventos ver"
        className="flex flex-wrap gap-2 mb-4"
      >
        {pestanas.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => cambiarPestana(p.id)}
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

      {verTodos && (
        <div
          role="note"
          className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-xl p-3 mb-4"
        >
          Solo puedes editar y eliminar <b>tus</b> eventos. Los demás son de
          otros agentes y se ven solo para consultar.
        </div>
      )}

      {!cargando && lista.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, código o teatro"
            aria-label="Buscar eventos"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full sm:w-72 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          {(["Todos", ...ESTADOS] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={estado === s}
              onClick={() => setEstado(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${estado === s ? "bg-violet-100 border-violet-300 text-violet-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {s}
            </button>
          ))}
          <select
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            aria-label="Filtrar por ciudad"
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="">Todas las ciudades</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {pestana === "mios" && cargando ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-500">
          Cargando tus eventos…
        </div>
      ) : pestana === "mios" && mios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-4xl mb-2" aria-hidden="true">
            🎭
          </p>
          <h3 className="text-lg font-bold text-gray-800">
            Aún no tienes eventos
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Cuando crees uno, aparecerá aquí.
          </p>
          <Btn onClick={() => onNav("agent-register-event", undefined, null)}>
            ➕ Crear mi primer evento
          </Btn>
          {eventos.length > 0 && (
            <button
              type="button"
              onClick={() => cambiarPestana("todos")}
              className="block mx-auto mt-4 text-sm font-semibold text-violet-700 hover:underline cursor-pointer"
            >
              Ver los eventos de otros agentes →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ background: "#F5F6FA" }}>
                  {[
                    "Código",
                    "Evento",
                    "Ciudad",
                    "Fecha",
                    "Precio",
                    "Capacidad",
                    "Estado",
                    ...(verTodos ? ["Creado por"] : []),
                    "Acciones",
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
                {visibles.length === 0 && (
                  <tr>
                    <td
                      colSpan={columnas}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      {hayFiltros ? (
                        <>
                          No hay eventos con esos filtros.{" "}
                          <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="font-semibold text-violet-700 hover:underline cursor-pointer"
                          >
                            Limpiar filtros
                          </button>
                        </>
                      ) : (
                        "Todavía no hay eventos."
                      )}
                    </td>
                  </tr>
                )}
                {visibles.map((ev, i) => {
                  const esMio = propios.has(ev.id);
                  return (
                    <tr
                      key={ev.id}
                      className={`border-t border-gray-50 hover:bg-violet-50/30 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                        {ev.codigo}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={unsplash(ev.imagen, 60, 40)}
                            alt={ev.nombre}
                            className="w-10 h-7 rounded-lg object-cover flex-shrink-0"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {ev.nombre}
                              {verTodos && esMio && (
                                <span className="ml-2 text-[10px] font-bold bg-violet-100 text-violet-800 rounded-full px-2 py-0.5 align-middle">
                                  Tuyo
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">{ev.teatro}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {ev.ciudad}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {fmtDate(ev.fecha)}
                        {ev.fechaFin && ev.fechaFin !== ev.fecha && (
                          <span className="block text-xs text-gray-400">
                            hasta {fmtDate(ev.fechaFin)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-violet-700">
                        {fmtPrice(ev.precio)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {ev.capacidad.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={ev.estado} />
                      </td>
                      {verTodos && (
                        <td className="px-4 py-3.5 text-sm text-gray-600">
                          {ev.agente}
                          {esMio ? " (tú)" : ""}
                        </td>
                      )}
                      <td className="px-4 py-3.5">
                        {esMio ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setVerDetalle(ev)}
                              className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-600 transition text-sm cursor-pointer"
                              title="Ver"
                              aria-label={`Ver el detalle de ${ev.nombre}`}
                            >
                              👁️
                            </button>
                            <button
                              onClick={() =>
                                onNav("agent-register-event", undefined, ev.id)
                              }
                              className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition text-sm cursor-pointer"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setPorEliminar(ev)}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition text-sm cursor-pointer"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setVerDetalle(ev)}
                              className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-600 transition text-sm cursor-pointer"
                              title="Ver"
                              aria-label={`Ver el detalle de ${ev.nombre}`}
                            >
                              👁️
                            </button>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              🔒 Solo lectura
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {verDetalle && (
        <DetalleEvento
          ev={verDetalle}
          esMio={propios.has(verDetalle.id)}
          onEditar={() => {
            const id = verDetalle.id;
            setVerDetalle(null);
            onNav("agent-register-event", undefined, id);
          }}
          onClose={() => setVerDetalle(null)}
        />
      )}
      {porEliminar && (
        <ConfirmarModal
          titulo="Eliminar evento"
          mensaje={`¿Eliminar "${porEliminar.nombre}"? Esta acción no se puede deshacer. Si el evento ya tiene reservas, no se podrá eliminar.`}
          textoConfirmar="Eliminar evento"
          onConfirmar={() => eliminarEvento(porEliminar.id)}
          onClose={() => setPorEliminar(null)}
        />
      )}
    </>
  );
}
