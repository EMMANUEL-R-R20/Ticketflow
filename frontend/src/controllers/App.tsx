import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { Screen, Role } from "../models/types";
import {
  dashboardDeRol,
  pathToScreen,
  rolDeScreen,
  screenToPath,
} from "../utils/routes";
import type { Reserva, ReservaStatus, Evento } from "../models/types";
import { LandingPage } from "./pages/auth/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { DashboardLayout } from "../views/layouts/DashboardLayout";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { ClientEvents } from "./pages/client/ClientEvents";
import { EventDetail } from "./pages/client/EventDetail";
import { ReservePage } from "./pages/client/ReservePage";
import { ClientReservations } from "./pages/client/ClientReservations";
import { ProfilePage } from "./pages/ProfilePage";
import { AgentDashboard } from "./pages/agent/AgentDashboard";
import { AgentRegisterEvent } from "./pages/agent/AgentRegisterEvent";
import { AgentMyEvents } from "./pages/agent/AgentMyEvents";
import { AgentReservations } from "./pages/agent/AgentReservations";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminLocations } from "./pages/admin/AdminLocations";
import { obtenerPerfil, type UsuarioActual } from "../models/api/auth";
import {
  listarEventos,
  crearEvento,
  modificarEvento,
  eliminarEvento as eliminarEventoApi,
  type DatosEvento,
} from "../models/api/eventos";
import {
  misReservas,
  crearReserva as crearReservaApi,
  cancelarReserva as cancelarReservaApi,
  modificarReserva as modificarReservaApi,
  todasLasReservas,
  cambiarEstadoReserva as cambiarEstadoApi,
  eliminarReserva as eliminarReservaApi,
} from "../models/api/reservas";
import {
  iniciarPago,
  confirmarPago as confirmarPagoApi,
} from "../models/api/pagos";
import {
  ApiError,
  SESION_EXPIRADA,
  mensajeDeError,
  sesion,
} from "../models/api/cliente";
import { listarMisEventos } from "../models/api/misEventos";
import { Btn } from "../views/components/Btn";

// ─── 404 ──────────────────────────────────────────────────────────────────────
function NoEncontrada({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
        <p className="text-4xl mb-3">🎟️</p>
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">
          Página no encontrada
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          La dirección que abriste no existe.
        </p>
        <Btn full onClick={() => onNav("landing")}>
          Ir al inicio
        </Btn>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // La pantalla sale de la URL: cada pantalla tiene su propia dirección
  const location = useLocation();
  const navigate = useNavigate();
  const ruta = pathToScreen(location.pathname);
  const screen: Screen | null = ruta?.screen ?? null;
  const eventoSeleccionadoId = ruta?.eventId ?? null;
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(
    null,
  );

  // Si el token vence mientras se usa la página, el servidor responde 401 y se avisa aquí:
  // se cierra la sesión y se lleva a la persona al inicio de sesión, con un mensaje.
  const sesionActiva = useRef(false);
  const [avisoSesion, setAvisoSesion] = useState("");
  useEffect(() => {
    function alExpirar() {
      if (!sesionActiva.current) return; // sin sesión abierta no hay nada que avisar
      sesionActiva.current = false;
      setUsuarioActual(null);
      setReservas([]);
      setMisEventosIds([]);
      setAvisoSesion("Tu sesión expiró. Inicia sesión de nuevo.");
      navigate("/login");
    }
    window.addEventListener(SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(SESION_EXPIRADA, alExpirar);
  }, []);

  // Si quedó una sesión guardada en el navegador, se comprueba con el servidor al abrir la página
  const [cargandoSesion, setCargandoSesion] = useState(
    () => sesion.token() !== null,
  );
  useEffect(() => {
    if (sesion.token() === null) return;
    let activo = true;
    obtenerPerfil()
      .then((u) => {
        // Se restaura la sesión sin mover a la persona: se queda en la URL que abrió
        if (activo) loginExitoso(u, false);
      })
      .catch((e: unknown) => {
        // Solo se descarta la sesión si el servidor dice que ya no vale (401)
        if (e instanceof ApiError && e.status === 401) sesion.borrar();
      })
      .finally(() => {
        if (activo) setCargandoSesion(false);
      });
    return () => {
      activo = false;
    };
  }, []);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  // Los eventos salen de la base de datos (GET /api/eventos, público)
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [errorEventos, setErrorEventos] = useState("");
  // Ids de los eventos que creó el agente que inició sesión (null mientras se cargan).
  // El listado público no trae quién creó cada evento; el agente lo pide aparte.
  const [misEventosIds, setMisEventosIds] = useState<number[] | null>([]);

  function cargarEventos() {
    setCargandoEventos(true);
    setErrorEventos("");
    listarEventos()
      .then(setEventos)
      .catch((e: unknown) => setErrorEventos(mensajeDeError(e)))
      .finally(() => setCargandoEventos(false));
  }
  useEffect(() => {
    cargarEventos();
  }, []);

  // Vuelve a pedir los eventos sin pantalla de carga, para que las entradas
  // disponibles reflejen lo que acaba de pasar con las reservas
  function refrescarEventos() {
    listarEventos()
      .then(setEventos)
      .catch(() => {});
  }
  // Cuando la persona guarda su perfil, se actualizan los datos que usa el resto de la página
  function perfilActualizado(u: UsuarioActual) {
    setUsuarioActual(u);
  }

  // Reservas del cliente: las hace el servidor, que calcula el total y valida el
  // cupo dentro de una transacción. Si falla, el error llega a la pantalla.
  async function crearReserva(
    eventoId: number,
    entradas: number,
    observaciones: string,
  ): Promise<Reserva> {
    try {
      const nueva = await crearReservaApi(eventoId, entradas, observaciones);
      setReservas((prev) => [nueva, ...prev]);
      return nueva;
    } finally {
      refrescarEventos();
    }
  }

  async function cancelarReserva(id: number, causa: string): Promise<void> {
    try {
      const actualizada = await cancelarReservaApi(id, causa);
      setReservas((prev) => prev.map((r) => (r.id === id ? actualizada : r)));
    } finally {
      refrescarEventos();
    }
  }

  async function editarReserva(
    id: number,
    entradas: number,
    observaciones: string,
  ): Promise<void> {
    try {
      const actualizada = await modificarReservaApi(id, {
        entradas,
        observaciones,
      });
      setReservas((prev) => prev.map((r) => (r.id === id ? actualizada : r)));
    } finally {
      refrescarEventos();
    }
  }
    // Cliente: pagar una reserva. El servidor crea la sesión de pago y la página se va a
  // Stripe; al terminar, Stripe devuelve a la persona a «Mis reservas».
  async function pagarReserva(id: number): Promise<void> {
    const url = await iniciarPago(id);
    window.location.assign(url);
  }

  // Al volver de Stripe: el servidor comprueba el pago con Stripe y confirma la reserva.
  // Después se recargan las reservas para que se vea su estado nuevo.
  async function confirmarPago(sessionId: string) {
    try {
      return await confirmarPagoApi(sessionId);
    } finally {
      misReservas()
        .then(setReservas)
        .catch(() => {});
    }
  }
    // Agente: cambiar el estado de una reserva. Reactivar una cancelada exige cupo; si
  // no hay, el servidor responde con un mensaje y la pantalla lo muestra.
  async function cambiarEstadoReserva(
    id: number,
    estado: ReservaStatus,
  ): Promise<void> {
    try {
      const actualizada = await cambiarEstadoApi(id, estado);
      setReservas((prev) => prev.map((r) => (r.id === id ? actualizada : r)));
    } finally {
      refrescarEventos();
    }
  }

  // Agente: solo se pueden eliminar las reservas ya canceladas
  async function eliminarReserva(id: number): Promise<void> {
    try {
      await eliminarReservaApi(id);
      setReservas((prev) => prev.filter((r) => r.id !== id));
    } finally {
      refrescarEventos();
    }
  }

  // Agente: eventos. El código (EVT-###) y el agente los asigna el servidor.
  async function registrarEvento(datos: DatosEvento): Promise<void> {
    const nuevo = await crearEvento(datos);
    setEventos((prev) => [...prev, nuevo]);
    setMisEventosIds((prev) => [...(prev ?? []), nuevo.id]);
  }

  async function actualizarEvento(
    id: number,
    datos: DatosEvento,
  ): Promise<void> {
    const actualizado = await modificarEvento(id, datos);
    setEventos((prev) => prev.map((e) => (e.id === id ? actualizado : e)));
  }

  // El servidor no deja eliminar un evento que tiene reservas
  async function eliminarEvento(id: number): Promise<void> {
    await eliminarEventoApi(id);
    setEventos((prev) => prev.filter((e) => e.id !== id));
    setMisEventosIds((prev) => (prev ?? []).filter((x) => x !== id));
  }

  function loginExitoso(u: UsuarioActual, irAlInicio = true) {
    sesionActiva.current = true;
    setAvisoSesion("");
    setUsuarioActual(u);
    // Solo el agente tiene «eventos propios»: se piden aparte (null = cargando)
    setMisEventosIds(u.role === "agent" ? null : []);
    if (u.role === "agent") {
      listarMisEventos()
        .then(setMisEventosIds)
        .catch(() => setMisEventosIds([]));
    }
    // El cliente ve sus reservas reales; agentes y administrador siguen con las
    // de ejemplo hasta que se conecten sus pantallas
    if (u.role === "client") {
      setReservas([]);
      misReservas()
        .then(setReservas)
        .catch(() => {});
    } else if (u.role === "agent") {
      // El agente ve las reservas de todos los eventos
      setReservas([]);
      todasLasReservas()
        .then(setReservas)
        .catch(() => {});
    } else {
      // El administrador no usa la lista de reservas: sus reportes los pide el propio panel
      setReservas([]);
    }
    if (!irAlInicio) return;
    // Si la persona fue enviada al login desde un enlace protegido, vuelve a ese enlace
    const desde = (location.state as { from?: string } | null)?.from;
    const destinoDesde = desde ? pathToScreen(desde) : null;
    if (
      desde &&
      destinoDesde &&
      rolDeScreen(destinoDesde.screen) === u.role
    ) {
      navigate(desde, { replace: true });
    } else {
      navigate(screenToPath(dashboardDeRol(u.role)), { replace: true });
    }
  }
  const [role, setRole] = useState<Role>("client");

  // Cerrar sesión: se borra el token y se olvida al usuario
  function cerrarSesion() {
    sesionActiva.current = false;
    sesion.borrar();
    setUsuarioActual(null);
    setReservas([]);
    setMisEventosIds([]);
  }

  function nav(s: Screen, r?: Role, eventId?: number | null) {
    // El botón «Cerrar sesión» navega a la portada: ahí termina la sesión
    if ((s === "landing" || s === "login") && usuarioActual) cerrarSesion();
    if (s !== "login") setAvisoSesion("");
    if (r) setRole(r);
    // Sin id explícito se conserva el evento de la URL actual (ej.: volver al detalle)
    const id = eventId !== undefined ? eventId : eventoSeleccionadoId;
    navigate(screenToPath(s, id));
  }

  const user = usuarioActual
    ? { name: usuarioActual.nombre, email: usuarioActual.email }
    : role === "agent"
      ? { name: "Carlos Medina", email: "carlos@agentes.com" }
      : { name: "Laura Ríos", email: "laura@ticketflow.com" };

  if (errorEventos)
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
          <p className="text-4xl mb-3">🔌</p>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">
            No se pudieron cargar los eventos
          </h1>
          <p className="text-gray-500 text-sm mb-6">{errorEventos}</p>
          <Btn full onClick={cargarEventos}>
            Reintentar
          </Btn>
        </div>
      </div>
    );
  if (cargandoSesion || cargandoEventos)
    return (
      <div
        className="min-h-screen flex items-center justify-center text-gray-500"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        Cargando…
      </div>
    );

  // URL que no existe
  if (screen === null) return <NoEncontrada onNav={nav} />;

  // Control de acceso por URL
  const rolPantalla = rolDeScreen(screen);
  if (rolPantalla && !usuarioActual)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  if (rolPantalla && usuarioActual && usuarioActual.role !== rolPantalla)
    return (
      <Navigate to={screenToPath(dashboardDeRol(usuarioActual.role))} replace />
    );
  if ((screen === "login" || screen === "register") && usuarioActual)
    return (
      <Navigate to={screenToPath(dashboardDeRol(usuarioActual.role))} replace />
    );

  if (screen === "landing")
    return <LandingPage onNav={nav} eventos={eventos} />;
  if (screen === "login")
    return (
      <LoginPage
        onNav={nav}
        loginExitoso={loginExitoso}
        eventos={eventos}
        aviso={avisoSesion}
      />
    );
  if (screen === "forgot-password") return <ForgotPasswordPage onNav={nav} />;
  if (screen === "reset-password") return <ResetPasswordPage onNav={nav} />;
  if (screen === "register") return <RegisterPage onNav={nav} />;

  if (
    screen === "client-dashboard" ||
    screen === "client-events" ||
    screen === "client-event-detail" ||
    screen === "client-reserve" ||
    screen === "client-reservations" ||
    screen === "client-profile"
  ) {
    return (
      <DashboardLayout role="client" screen={screen} onNav={nav} user={user}>
        {screen === "client-dashboard" && (
          <ClientDashboard
            onNav={nav}
            user={usuarioActual}
            reservas={reservas}
            eventos={eventos}
          />
        )}
        {screen === "client-events" && (
          <ClientEvents onNav={nav} eventos={eventos} reservas={reservas} />
        )}
        {screen === "client-event-detail" && (
          <EventDetail
            onNav={nav}
            eventoId={eventoSeleccionadoId}
            eventos={eventos}
            reservas={reservas}
          />
        )}
        {screen === "client-reserve" && (
          <ReservePage
            onNav={nav}
            eventoId={eventoSeleccionadoId}
            crearReserva={crearReserva}
            eventos={eventos}
            reservas={reservas}
          />
        )}
        {screen === "client-reservations" && (
          <ClientReservations
            user={usuarioActual}
            reservas={reservas}
            eventos={eventos}
            cancelarReserva={cancelarReserva}
            editarReserva={editarReserva}
            pagarReserva={pagarReserva}
            confirmarPago={confirmarPago}
          />
        )}
        {screen === "client-profile" && (
          <ProfilePage
            role="client"
            user={usuarioActual}
            onPerfilActualizado={perfilActualizado}
          />
        )}
      </DashboardLayout>
    );
  }

  if (
    screen === "agent-dashboard" ||
    screen === "agent-register-event" ||
    screen === "agent-my-events" ||
    screen === "agent-reservations" ||
    screen === "agent-profile"
  ) {
    return (
      <DashboardLayout role="agent" screen={screen} onNav={nav} user={user}>
        {screen === "agent-dashboard" && (
          <AgentDashboard
            onNav={nav}
            eventos={eventos}
            reservas={reservas}
            misIds={misEventosIds}
          />
        )}
        {screen === "agent-register-event" &&
          (eventoSeleccionadoId !== null &&
          (misEventosIds === null ||
            !eventos.some((e) => e.id === eventoSeleccionadoId) ||
            !misEventosIds.includes(eventoSeleccionadoId)) ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-gray-600 mb-5">
                {misEventosIds === null
                  ? "Cargando…"
                  : !eventos.some((e) => e.id === eventoSeleccionadoId)
                    ? "Este evento ya no está disponible."
                    : "Este evento es de otro agente: solo puedes editar los tuyos."}
              </p>
              <Btn onClick={() => nav("agent-my-events")}>
                ← Volver a mis eventos
              </Btn>
            </div>
          ) : (
            <AgentRegisterEvent
              onNav={nav}
              eventoId={eventoSeleccionadoId}
              eventos={eventos}
              registrarEvento={registrarEvento}
              actualizarEvento={actualizarEvento}
            />
          ))}
        {screen === "agent-my-events" && (
          <AgentMyEvents
            onNav={nav}
            eventos={eventos}
            misIds={misEventosIds}
            eliminarEvento={eliminarEvento}
          />
        )}
        {screen === "agent-reservations" && (
          <AgentReservations
            onNav={nav}
            reservas={reservas}
            eventos={eventos}
            misIds={misEventosIds}
            cambiarEstadoReserva={cambiarEstadoReserva}
            cancelarReserva={cancelarReserva}
            editarReserva={editarReserva}
            eliminarReserva={eliminarReserva}
          />
        )}
        {screen === "agent-profile" && (
          <ProfilePage
            role="agent"
            user={usuarioActual}
            onPerfilActualizado={perfilActualizado}
          />
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" screen={screen} onNav={nav} user={user}>
      {screen === "admin-dashboard" && <AdminDashboard />}
      {screen === "admin-users" && (
        <AdminUsers miId={usuarioActual?.id ?? ""} />
      )}
      {screen === "admin-locations" && <AdminLocations />}
      {screen === "admin-profile" && (
        <ProfilePage
          role="admin"
          user={usuarioActual}
          onPerfilActualizado={perfilActualizado}
        />
      )}
    </DashboardLayout>
  );
}
