import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ApiError,
  consultarDisponibilidad,
  listarCanchas,
  type Bloque,
  type Cancha,
  type Deporte,
} from '../api/client';

/** Etiquetas de pantalla. El valor canónico va en mayúsculas (R-008). */
const DEPORTES: { valor: Deporte; etiqueta: string; icono: string }[] = [
  { valor: 'PADEL', etiqueta: 'Pádel', icono: 'sports_tennis' },
  { valor: 'TENIS', etiqueta: 'Tenis', icono: 'sports_tennis' },
  { valor: 'BASQUET', etiqueta: 'Básquet', icono: 'sports_basketball' },
];

const DIA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Los próximos cinco días a partir de hoy, en la zona del navegador. */
function proximosDias(cuantos: number) {
  const hoy = new Date();
  return Array.from({ length: cuantos }, (_, i) => {
    const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    // Se compone a mano en vez de con toISOString(): esa convierte a UTC y en
    // husos al oeste devuelve el día anterior.
    const iso = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(
      dia.getDate(),
    ).padStart(2, '0')}`;
    return { iso, etiqueta: i === 0 ? 'Hoy' : DIA_CORTO[dia.getDay()], numero: dia.getDate() };
  });
}

type Seleccion = { canchaId: number; horaInicio: string } | null;

export default function Disponibilidad() {
  const navigate = useNavigate();
  const dias = useMemo(() => proximosDias(5), []);

  const [deporte, setDeporte] = useState<Deporte>('PADEL');
  const [fecha, setFecha] = useState(dias[0].iso);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [bloquesPorCancha, setBloquesPorCancha] = useState<Record<number, Bloque[]>>({});
  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El catálogo solo depende del deporte; la disponibilidad, además, de la
  // fecha. Separarlos evita volver a pedir las canchas al cambiar de día.
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    setSeleccion(null);

    listarCanchas(deporte)
      .then((lista) => {
        if (!vigente) return;
        setCanchas(lista);
        return Promise.all(
          lista.map((c) =>
            consultarDisponibilidad(c.id, fecha).then((d) => [c.id, d.bloques] as const),
          ),
        ).then((pares) => {
          if (!vigente) return;
          setBloquesPorCancha(Object.fromEntries(pares));
        });
      })
      .catch((e) => {
        if (!vigente) return;
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar la disponibilidad.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [deporte, fecha]);

  function reservarSeleccionado() {
    if (!seleccion) return;
    // Los datos del bloque viajan en la URL y no en el estado del router: así
    // la pantalla de confirmación sobrevive a una recarga.
    navigate(
      `/reservas/nueva?canchaId=${seleccion.canchaId}&fecha=${fecha}&horaInicio=${encodeURIComponent(
        seleccion.horaInicio,
      )}`,
    );
  }

  const iconoDeporte = DEPORTES.find((d) => d.valor === deporte)?.icono ?? 'sports_tennis';

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <header className="mb-section-gap">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
          Encuentra tu próxima cancha
        </h2>
        <p className="font-body-lg text-body-lg text-text-muted">
          Selecciona el deporte, la fecha y encuentra disponibilidad instantánea.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-section-gap">
        <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-6 border border-border-subtle/50">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Deporte</h3>
          <div className="flex space-x-2">
            {DEPORTES.map((d) => (
              <button
                key={d.valor}
                type="button"
                onClick={() => setDeporte(d.valor)}
                className={`flex-1 py-2 px-3 rounded-lg font-label-md border transition-colors ${
                  deporte === d.valor
                    ? 'bg-primary-container text-on-primary-container border-transparent shadow-sm'
                    : 'bg-surface text-text-primary border-border-subtle hover:border-secondary'
                }`}
              >
                {d.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-6 border border-border-subtle/50 lg:col-span-2">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Fecha</h3>
          <div className="flex-1 flex justify-between overflow-x-auto space-x-2 pb-2">
            {dias.map((d) => (
              <button
                key={d.iso}
                type="button"
                onClick={() => setFecha(d.iso)}
                className={`flex flex-col items-center justify-center min-w-[60px] h-[70px] rounded-lg cursor-pointer transition-colors ${
                  fecha === d.iso
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'bg-surface text-text-primary border border-border-subtle hover:border-secondary'
                }`}
              >
                <span className="font-label-sm text-label-sm">{d.etiqueta}</span>
                <span className="font-headline-md text-headline-md">{d.numero}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-6">
          <h3 className="font-headline-md text-headline-md text-primary">Canchas Disponibles</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="font-label-sm text-label-sm text-text-muted">Libre</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-surface-dim border border-border-subtle" />
              <span className="font-label-sm text-label-sm text-text-muted">Ocupado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="font-label-sm text-label-sm text-text-muted">Mantenimiento</span>
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

        {cargando && (
          <p className="font-body-md text-body-md text-text-muted py-10 text-center">
            Cargando disponibilidad…
          </p>
        )}

        {!cargando && !error && canchas.length === 0 && (
          <p className="font-body-md text-body-md text-text-muted py-10 text-center border-2 border-dashed border-border-subtle rounded-xl">
            No hay canchas activas de este deporte.
          </p>
        )}

        {!cargando &&
          canchas.map((cancha) => {
            const bloques = bloquesPorCancha[cancha.id] ?? [];
            const seleccionadaAqui = seleccion?.canchaId === cancha.id;

            return (
              <div
                key={cancha.id}
                className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-border-subtle/50 mb-6 overflow-hidden"
              >
                <div className="p-6 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-primary-fixed-dim flex items-center justify-center text-primary-container">
                      <span className="material-symbols-outlined text-3xl">{iconoDeporte}</span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-primary">
                        {cancha.nombre}
                      </h4>
                      <p className="font-body-md text-body-md text-text-muted">
                        Horario de atención {cancha.horaApertura} – {cancha.horaCierre}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={reservarSeleccionado}
                    disabled={!seleccionadaAqui}
                    className={`py-2 px-6 rounded-lg font-bold font-label-md transition-colors shadow-sm text-center ${
                      seleccionadaAqui
                        ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                        : 'bg-surface-container text-text-muted cursor-not-allowed'
                    }`}
                  >
                    {seleccionadaAqui
                      ? `Reservar ${seleccion?.horaInicio}`
                      : 'Elige un bloque libre'}
                  </button>
                </div>

                <div className="p-6 bg-surface-bright overflow-x-auto">
                  {bloques.length === 0 ? (
                    <p className="font-body-md text-body-md text-text-muted">
                      Sin bloques para esta fecha.
                    </p>
                  ) : (
                    <div className="flex min-w-max space-x-2">
                      {bloques.map((bloque) => {
                        const libre = bloque.estado === 'LIBRE';
                        const elegido =
                          seleccionadaAqui && seleccion?.horaInicio === bloque.horaInicio;

                        return (
                          <button
                            key={bloque.horaInicio}
                            type="button"
                            disabled={!libre}
                            onClick={() =>
                              setSeleccion({ canchaId: cancha.id, horaInicio: bloque.horaInicio })
                            }
                            className={`w-24 h-20 rounded-lg border flex flex-col items-center justify-center transition-shadow relative overflow-hidden ${
                              elegido
                                ? 'bg-secondary text-on-secondary shadow-md border-transparent'
                                : libre
                                  ? 'bg-surface border-l-4 border-l-success border-border-subtle cursor-pointer hover:shadow-md'
                                  : bloque.estado === 'MANTENIMIENTO'
                                    ? 'bg-surface border-l-4 border-l-warning border-border-subtle opacity-80 cursor-not-allowed'
                                    : 'bg-surface-dim border-border-subtle opacity-60 cursor-not-allowed'
                            }`}
                          >
                            {bloque.estado === 'MANTENIMIENTO' && (
                              <span className="material-symbols-outlined text-warning mb-1">
                                build
                              </span>
                            )}
                            <span
                              className={`font-label-md text-label-md ${
                                bloque.estado === 'OCUPADO' ? 'text-text-muted line-through' : ''
                              } ${bloque.estado === 'MANTENIMIENTO' ? 'text-warning' : ''}`}
                            >
                              {bloque.horaInicio}
                            </span>
                            <span
                              className={`font-label-sm text-label-sm ${
                                elegido ? '' : 'text-text-muted'
                              }`}
                            >
                              {bloque.horaFin}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </section>
    </div>
  );
}
