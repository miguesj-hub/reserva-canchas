import { useState } from 'react';
import { Link } from 'react-router-dom';

type Estado = 'confirmada' | 'pasada' | 'cancelada';

type Reserva = {
  id: string;
  cancha: string;
  sede: string;
  fecha: string;
  hora: string;
  estado: Estado;
  deporteIcono: string;
};

const reservas: Reserva[] = [
  {
    id: '1',
    cancha: 'Cancha 1 - Tenis Pro',
    sede: 'Polideportivo Central',
    fecha: '15/11/2023',
    hora: '18:00 - 19:30',
    estado: 'confirmada',
    deporteIcono: 'sports_tennis',
  },
  {
    id: '2',
    cancha: 'Cancha Techada B',
    sede: 'Complejo Norte',
    fecha: '10/11/2023',
    hora: '20:00 - 21:00',
    estado: 'pasada',
    deporteIcono: 'sports_basketball',
  },
  {
    id: '3',
    cancha: 'Cancha 3 - Padel',
    sede: 'Polideportivo Central',
    fecha: '08/11/2023',
    hora: '09:00 - 10:30',
    estado: 'cancelada',
    deporteIcono: 'sports_tennis',
  },
];

const filtros: { label: string; value: 'todas' | Estado }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Confirmadas', value: 'confirmada' },
  { label: 'Pasadas', value: 'pasada' },
  { label: 'Canceladas', value: 'cancelada' },
];

const estadoBadge: Record<Estado, string> = {
  confirmada: 'bg-success/10 text-success border-success/20',
  pasada: 'bg-surface-container text-text-muted border-transparent',
  cancelada: 'bg-error/10 text-error border-error/20',
};

const estadoLabel: Record<Estado, string> = {
  confirmada: 'Confirmada',
  pasada: 'Pasada',
  cancelada: 'Cancelada',
};

export default function MisReservas() {
  const [filtro, setFiltro] = useState<'todas' | Estado>('todas');

  const visibles = reservas.filter((r) => filtro === 'todas' || r.estado === filtro);

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
            to="disponibilidad"
            className="px-6 py-2 bg-surface border border-secondary text-secondary rounded-lg font-label-md text-label-md hover:bg-secondary hover:text-on-secondary transition-colors shadow-sm text-center"
          >
            Buscar disponibilidad
          </Link>
        </div>
      </header>

      <section className="mb-gutter">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filtros.map((f) => (
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

      {visibles.length === 0 ? (
        <section className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border-subtle rounded-xl bg-surface-container-low/50">
          <span className="material-symbols-outlined text-[64px] text-text-muted mb-4">event_busy</span>
          <h3 className="font-headline-md text-headline-md text-primary mb-2">No tienes reservas en esta categoría</h3>
          <p className="font-body-md text-body-md text-text-muted max-w-md mb-6">
            Parece que aún no has reservado ninguna cancha para jugar. ¡Anímate y busca disponibilidad ahora!
          </p>
          <Link
            to="disponibilidad"
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
                r.estado === 'cancelada' ? 'border-error/20 bg-error/5' : 'border-border-subtle'
              } ${r.estado === 'pasada' ? 'opacity-80' : ''}`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      r.estado === 'confirmada' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container text-text-muted'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[32px]">{r.deporteIcono}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full font-label-sm text-label-sm border ${estadoBadge[r.estado]}`}
                  >
                    {estadoLabel[r.estado]}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{r.cancha}</h3>
                <p className="font-body-md text-body-md text-text-muted mb-4">{r.sede}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-text-muted font-label-md text-label-md">
                    <span className="material-symbols-outlined mr-2 text-[20px]">calendar_today</span>
                    {r.fecha}
                  </div>
                  <div className="flex items-center text-text-muted font-label-md text-label-md">
                    <span className="material-symbols-outlined mr-2 text-[20px]">schedule</span>
                    {r.hora}
                  </div>
                </div>
              </div>

              {r.estado === 'confirmada' && (
                <div className="pt-4 border-t border-border-subtle flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-error font-label-sm text-label-sm hover:bg-error/10 rounded-lg transition-colors flex items-center"
                  >
                    <span className="material-symbols-outlined mr-1 text-[18px]">cancel</span>
                    Cancelar
                  </button>
                </div>
              )}
              {r.estado === 'pasada' && (
                <div className="pt-4 border-t border-border-subtle flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-secondary font-label-sm text-label-sm hover:bg-secondary/10 rounded-lg transition-colors flex items-center"
                  >
                    <span className="material-symbols-outlined mr-1 text-[18px]">replay</span>
                    Reservar de nuevo
                  </button>
                </div>
              )}
              {r.estado === 'cancelada' && (
                <div className="pt-4 border-t border-border-subtle/50">
                  <p className="text-error font-label-sm text-label-sm">Cancelada por el usuario.</p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
