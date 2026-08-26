import { useEffect, useMemo, useState } from 'react';
import { ApiError, resumenDelDia, type ResumenReportes } from '../api/client';

function isoHoy(): string {
  const d = new Date();
  // A mano y no con toISOString(): esa convierte a UTC y en husos al oeste
  // devolvería el día anterior.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hoyLegible(): string {
  return new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Panel del administrador. Muestra los cuatro indicadores de §3.3.5 acotados al
 * día en curso (R-005), con una sola llamada a /reportes/resumen.
 *
 * La maqueta traía '+12% vs ayer', '+2% vs promedio' y 'Horario Pico
 * 18:00-21:00'. Se han retirado: ninguno es uno de los cuatro indicadores, y no
 * hay dato con el que calcularlos —no existe serie histórica ni agregado por
 * franja—. Una cifra inventada en un panel de administración es peor que un
 * hueco, porque nadie duda de ella.
 */
export default function Panel() {
  const [datos, setDatos] = useState<ResumenReportes | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    resumenDelDia(isoHoy())
      .then((d) => vigente && setDatos(d))
      .catch((e) => {
        if (!vigente) return;
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los indicadores.');
      })
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, []);

  const ocupacionMedia = useMemo(() => {
    if (!datos || datos.ocupacion.length === 0) return 0;
    const suma = datos.ocupacion.reduce((acc, o) => acc + o.porcentaje, 0);
    return Math.round((suma / datos.ocupacion.length) * 10) / 10;
  }, [datos]);

  const kpis = datos
    ? [
        {
          label: 'Reservas (hoy)',
          value: String(datos.reservas.total),
          icon: 'confirmation_number',
          iconBg: 'bg-primary-fixed text-secondary-fixed-dim',
          glow: 'bg-primary-fixed/30 group-hover:bg-primary-fixed/50',
          caption: 'Confirmadas y finalizadas',
        },
        {
          label: 'Ocupación',
          value: String(ocupacionMedia),
          suffix: '%',
          icon: 'pie_chart',
          iconBg: 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant',
          glow: 'bg-success/10 group-hover:bg-success/20',
          progress: Math.min(100, ocupacionMedia),
          caption: 'Media de las canchas, sobre su horario',
        },
        {
          label: 'Cancelaciones',
          value: String(datos.cancelaciones.total),
          icon: 'event_busy',
          iconBg: 'bg-error-container text-on-error-container',
          glow: 'bg-error/10 group-hover:bg-error/20',
          caption: 'Canceladas hoy',
        },
        {
          label: 'Mayor demanda',
          value: datos.demanda.mayorDemanda?.canchaNombre ?? '—',
          icon: 'sports_tennis',
          iconBg: 'bg-secondary/10 text-secondary',
          glow: 'bg-secondary/10 group-hover:bg-secondary/20',
          caption: datos.demanda.mayorDemanda
            ? `${datos.demanda.mayorDemanda.reservas} reservas hoy`
            : 'Sin reservas hoy',
        },
      ]
    : [];

  return (
    <>
      <div className="hidden md:flex bg-surface/80 backdrop-blur-md border-b border-border-subtle/50 sticky top-0 z-20 justify-between items-center px-container-margin h-16 w-full">
        <div className="flex items-center gap-4">
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Visión General</h2>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="text-sm font-label-md text-text-muted capitalize">{hoyLegible()}</span>
        </div>
      </div>

      <div className="p-container-margin flex-1 space-y-section-gap overflow-y-auto pb-24 md:pb-container-margin">
        {error && (
          <p
            role="alert"
            className="font-label-md text-label-md text-error bg-error/10 border border-error rounded-lg px-4 py-3"
          >
            {error}
          </p>
        )}

        {cargando ? (
          <p className="font-body-md text-body-md text-text-muted py-16 text-center">
            Cargando indicadores del día…
          </p>
        ) : (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle/50 hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div
                    className={`absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full blur-2xl transition-colors ${kpi.glow}`}
                  />
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <p className="font-label-sm text-text-muted uppercase tracking-wider mb-1">
                        {kpi.label}
                      </p>
                      <h3 className="font-display text-[32px] font-extrabold text-text-primary leading-none truncate">
                        {kpi.value}
                        {kpi.suffix && (
                          <span className="text-xl text-text-muted ml-1">{kpi.suffix}</span>
                        )}
                      </h3>
                    </div>
                    <div className={`p-2 rounded-lg ${kpi.iconBg} shrink-0`}>
                      <span className="material-symbols-outlined text-[24px]">{kpi.icon}</span>
                    </div>
                  </div>
                  {kpi.progress !== undefined && (
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-2 mb-1">
                      <div
                        className="bg-success h-1.5 rounded-full"
                        style={{ width: `${kpi.progress}%` }}
                      />
                    </div>
                  )}
                  {kpi.caption && <p className="text-xs text-text-muted">{kpi.caption}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
