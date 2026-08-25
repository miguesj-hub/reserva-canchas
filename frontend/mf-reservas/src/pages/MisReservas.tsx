import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ApiError,
  cancelarReserva,
  listarMisReservas,
  type EstadoReserva,
  type Reserva,
} from '../api/client';

/** Los tres estados de RN-08, con los valores canónicos de R-007. */
const FILTROS: { label: string; value: 'TODAS' | EstadoReserva }[] = [
  { label: 'Todas', value: 'TODAS' },
  { label: 'Confirmadas', value: 'CONFIRMADA' },
  { label: 'Finalizadas', value: 'FINALIZADA' },
  { label: 'Canceladas', value: 'CANCELADA' },
];

const ESTADO_BADGE: Record<EstadoReserva, string> = {
  CONFIRMADA: 'bg-success/10 text-success border-success/20',
  FINALIZADA: 'bg-surface-container text-text-muted border-transparent',
  CANCELADA: 'bg-error/10 text-error border-error/20',
};

const ESTADO_LABEL: Record<EstadoReserva, string> = {
  CONFIRMADA: 'Confirmada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

const ICONO_DEPORTE: Record<string, string> = {
  PADEL: 'sports_tennis',
  TENIS: 'sports_tennis',
  BASQUET: 'sports_basketball',
};

function fechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-EC');
}

export default function MisReservas() {
  const [filtro, setFiltro] = useState<'TODAS' | EstadoReserva>('TODAS');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    listarMisReservas()
      .then(setReservas)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar tus reservas.'),
      )
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  async function cancelar(id: number) {
    setCancelando(id);
    setError(null);
    try {
      const actualizada = await cancelarReserva(id);
      // Se reemplaza con lo que devolvió el servidor en vez de adivinar el
      // nuevo estado: si la cancelación no procedió, la pantalla no miente.
      setReservas((previas) => previas.map((r) => (r.id === id ? actualizada : r)));
    } catch (e) {
      // El 409 de RN-04 —"ya inició"— llega por aquí con su motivo.
      setError(e instanceof ApiError ? e.message : 'No se pudo cancelar la reserva.');
    } finally {
      setCancelando(null);
    }
  }

  const visibles = reservas.filter((r) => filtro === 'TODAS' || r.estado === filtro);

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <header className="mb-section-gap flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
            Mis Reservas
          </h2>
          <p className="font-body-md text-body-md text-text-muted">
            Gestiona tus próximos partidos y revisa tu historial.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/reservas/disponibilidad"
            className="px-6 py-2 bg-surface border border-secondary text-secondary rounded-lg font-label-md text-label-md hover:bg-secondary hover:text-on-secondary transition-colors shadow-sm text-center"
          >
            Buscar disponibilidad
          </Link>
        </div>
      </header>

      <section className="mb-gutter">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={`px-4 py-2 rounded-full font-label-sm text-label-sm shadow-sm whitespace-nowrap transition-colors ${
                filtro === f.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-text-muted border border-border-subtle hover:bg-surface-container-low'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="mb-6 font-label-md text-label-md text-error bg-error/10 border border-error rounded-lg px-4 py-3"
        >
          {error}
        </p>
      )}

      {cargando ? (
        <p className="font-body-md text-body-md text-text-muted py-10 text-center">
          Cargando tus reservas…
        </p>
      ) : visibles.length === 0 ? (
        <section className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border-subtle rounded-xl bg-surface-container-low/50">
          <span className="material-symbols-outlined text-[64px] text-text-muted mb-4">
            event_busy
          </span>
          <h3 className="font-headline-md text-headline-md text-primary mb-2">
            No tienes reservas en esta categoría
          </h3>
          <p className="font-body-md text-body-md text-text-muted max-w-md mb-6">
            Parece que aún no has reservado ninguna cancha para jugar. ¡Anímate y busca
            disponibilidad ahora!
          </p>
          <Link
            to="/reservas/disponibilidad"
            className="px-6 py-3 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center"
          >
            <span className="material-symbols-outlined mr-2">search</span>
            Buscar disponibilidad
          </Link>
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibles.map((r) => (
            <div
              key={r.id}
              className={`bg-surface rounded-xl p-6 shadow-sm border flex flex-col justify-between hover:shadow-md transition-shadow ${
                r.estado === 'CANCELADA' ? 'border-error/20 bg-error/5' : 'border-border-subtle'
              } ${r.estado === 'FINALIZADA' ? 'opacity-80' : ''}`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      r.estado === 'CONFIRMADA'
                        ? 'bg-secondary/10 text-secondary'
                        : 'bg-surface-container text-text-muted'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[32px]">
                      {ICONO_DEPORTE[r.deporte ?? ''] ?? 'sports_tennis'}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full font-label-sm text-label-sm border ${ESTADO_BADGE[r.estado]}`}
                  >
                    {ESTADO_LABEL[r.estado]}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-4">
                  {r.canchaNombre ?? `Cancha ${r.canchaId}`}
                </h3>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-text-muted font-label-md text-label-md">
                    <span className="material-symbols-outlined mr-2 text-[20px]">
                      calendar_today
                    </span>
                    {fechaCorta(r.fecha)}
                  </div>
                  <div className="flex items-center text-text-muted font-label-md text-label-md">
                    <span className="material-symbols-outlined mr-2 text-[20px]">schedule</span>
                    {r.horaInicio} – {r.horaFin}
                  </div>
                </div>
              </div>

              {/* Solo las confirmadas se pueden cancelar: una finalizada ya
                  ocurrió (FR-028) y una cancelada no vuelve (FR-023). */}
              {r.estado === 'CONFIRMADA' && (
                <div className="pt-4 border-t border-border-subtle flex justify-end">
                  <button
                    type="button"
                    onClick={() => cancelar(r.id)}
                    disabled={cancelando === r.id}
                    className="px-4 py-2 text-error font-label-sm text-label-sm hover:bg-error/10 rounded-lg transition-colors flex items-center disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined mr-1 text-[18px]">cancel</span>
                    {cancelando === r.id ? 'Cancelando…' : 'Cancelar'}
                  </button>
                </div>
              )}
              {r.estado === 'CANCELADA' && (
                <div className="pt-4 border-t border-border-subtle/50">
                  <p className="text-error font-label-sm text-label-sm">Reserva cancelada.</p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
