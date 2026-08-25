import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError, crearReserva, listarCanchas, type Cancha } from '../api/client';
import type { PropsDeRemote } from '../tipos';

const ICONO_DEPORTE: Record<string, string> = {
  PADEL: 'sports_tennis',
  TENIS: 'sports_tennis',
  BASQUET: 'sports_basketball',
};

const ETIQUETA_DEPORTE: Record<string, string> = {
  PADEL: 'Pádel',
  TENIS: 'Tenis',
  BASQUET: 'Básquet',
};

function fechaLarga(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** El fin del bloque: dura una hora, igual que en el backend. */
function unaHoraDespues(hora: string): string {
  const [h, m] = hora.split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function NuevaReserva({ sesion }: PropsDeRemote) {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // La selección llega por la URL, no por el estado del router: así recargar
  // esta pantalla no deja al usuario confirmando una reserva en blanco.
  const canchaId = Number(params.get('canchaId'));
  const fecha = params.get('fecha') ?? '';
  const horaInicio = params.get('horaInicio') ?? '';
  const seleccionCompleta = Boolean(canchaId) && Boolean(fecha) && Boolean(horaInicio);

  const [cancha, setCancha] = useState<Cancha | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmada, setConfirmada] = useState(false);

  useEffect(() => {
    if (!seleccionCompleta) return;
    let vigente = true;
    // El catálogo activo basta para el nombre y el deporte; no hace falta un
    // endpoint aparte solo para pintar la tarjeta.
    listarCanchas()
      .then((lista) => {
        if (vigente) setCancha(lista.find((c) => c.id === canchaId) ?? null);
      })
      .catch(() => {
        /* Sin el nombre la reserva se puede hacer igual: no vale interrumpir por esto. */
      });
    return () => {
      vigente = false;
    };
  }, [canchaId, seleccionCompleta]);

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      await crearReserva(canchaId, fecha, horaInicio);
      setConfirmada(true);
      // Un respiro para que se vea el aviso antes de saltar a Mis reservas.
      setTimeout(() => navigate('/reservas'), 1500);
    } catch (e) {
      // El motivo lo dice el servidor y se muestra tal cual: el 409 de bloque
      // ocupado (RN-02) y el del tope de reservas activas (RN-06) llegan por
      // aquí, y son justamente los que el usuario necesita entender.
      setError(
        e instanceof ApiError ? e.message : 'No se pudo contactar con el servidor.',
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!seleccionCompleta) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center gap-6 p-container-margin">
        <span className="material-symbols-outlined text-[64px] text-text-muted">event_busy</span>
        <p className="font-body-lg text-body-lg text-text-muted text-center max-w-md">
          No hay ningún bloque seleccionado. Elige una cancha y una hora en Disponibilidad.
        </p>
        <button
          type="button"
          onClick={() => navigate('/reservas/disponibilidad')}
          className="px-6 py-3 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-bold"
        >
          Ver disponibilidad
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background text-text-primary min-h-screen flex">
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-gutter md:px-container-margin py-section-gap flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl mb-8 flex items-center">
          <button
            type="button"
            onClick={() => navigate('/reservas/disponibilidad')}
            className="flex items-center text-secondary hover:text-secondary-container transition-colors duration-200"
          >
            <span className="material-symbols-outlined mr-2">arrow_back</span>
            <span className="font-label-md text-label-md">Volver a Canchas</span>
          </button>
        </div>

        <div className="w-full max-w-3xl bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-border-subtle p-6 md:p-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
          <div className="mb-8 text-center">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
              Confirmar Reserva
            </h1>
            <p className="font-body-md text-body-md text-text-muted">
              Revisa los detalles antes de confirmar.
            </p>
          </div>

          <div className="bg-surface-container-low rounded-lg p-6 border border-border-subtle mb-8">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mr-4 shrink-0">
                <span className="material-symbols-outlined">
                  {ICONO_DEPORTE[cancha?.deporte ?? ''] ?? 'sports_tennis'}
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
                  {cancha?.nombre ?? `Cancha ${canchaId}`}
                </h3>
                {cancha && (
                  <span className="inline-block px-3 py-1 bg-surface rounded-full text-text-muted font-label-sm text-label-sm border border-border-subtle">
                    {ETIQUETA_DEPORTE[cancha.deporte]}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-border-subtle">
              <div className="flex items-center text-text-muted">
                <span className="material-symbols-outlined mr-3 text-secondary">calendar_today</span>
                <span className="font-body-md text-body-md">{fechaLarga(fecha)}</span>
              </div>
              <div className="flex items-center text-text-muted">
                <span className="material-symbols-outlined mr-3 text-secondary">schedule</span>
                <span className="font-body-md text-body-md">
                  {horaInicio} – {unaHoraDespues(horaInicio)} (1 hora)
                </span>
              </div>
              <div className="flex items-center text-text-muted">
                <span className="material-symbols-outlined mr-3 text-secondary">person</span>
                <span className="font-body-md text-body-md">
                  A nombre de {sesion?.nombre ?? 'tu cuenta'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-6 font-label-md text-label-md text-error bg-error/10 border border-error rounded-lg px-4 py-3"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse md:flex-row justify-end gap-4 border-t border-border-subtle pt-6">
            <button
              type="button"
              onClick={() => navigate('/reservas/disponibilidad')}
              className="px-6 py-3 rounded-lg border border-secondary text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={enviando || confirmada}
              className="px-8 py-3 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container/90 active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined mr-2">check_circle</span>
              {enviando ? 'Confirmando…' : confirmada ? 'Reservada' : 'Confirmar Reserva'}
            </button>
          </div>
        </div>
      </main>

      <div
        className={`fixed bottom-6 right-6 left-6 md:left-auto transition-all duration-300 ease-out z-50 flex items-center bg-surface p-4 rounded-lg shadow-lg border-l-4 border-success md:min-w-[300px] ${
          confirmada ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <span className="material-symbols-outlined text-success mr-3">check_circle</span>
        <div>
          <h4 className="font-label-md text-label-md text-primary">Reserva Confirmada</h4>
          <p className="font-label-sm text-label-sm text-text-muted">
            {cancha?.nombre ?? 'Tu cancha'}, {horaInicio} – {unaHoraDespues(horaInicio)}.
          </p>
        </div>
      </div>
    </div>
  );
}
