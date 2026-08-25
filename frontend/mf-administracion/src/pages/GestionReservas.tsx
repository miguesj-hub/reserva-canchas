import { useState } from 'react';

type Reserva = {
  codigo: string;
  usuario: string;
  iniciales: string;
  cancha: string;
  deporte: string;
  fecha: string;
  bloque: string;
  estado: 'Confirmada' | 'Pendiente Pago' | 'Cancelada';
};

const reservas: Reserva[] = [
  {
    codigo: '#RS-1042',
    usuario: 'Juan Carlos Silva',
    iniciales: 'JC',
    cancha: 'Pádel Central',
    deporte: 'Pádel',
    fecha: '24 Oct, 2023',
    bloque: '18:00 - 19:30',
    estado: 'Confirmada',
  },
  {
    codigo: '#RS-1043',
    usuario: 'María Rodríguez',
    iniciales: 'MR',
    cancha: 'Tenis Arcilla 1',
    deporte: 'Tenis',
    fecha: '24 Oct, 2023',
    bloque: '19:30 - 20:30',
    estado: 'Pendiente Pago',
  },
  {
    codigo: '#RS-1040',
    usuario: 'Andrés López',
    iniciales: 'AL',
    cancha: 'Básquet Techado',
    deporte: 'Básquet',
    fecha: '23 Oct, 2023',
    bloque: '10:00 - 11:00',
    estado: 'Cancelada',
  },
];

const estadoStyles: Record<Reserva['estado'], string> = {
  Confirmada: 'bg-success/10 text-success border-success/20',
  'Pendiente Pago': 'bg-warning/10 text-warning border-warning/20',
  Cancelada: 'bg-surface-variant text-on-surface-variant border-border-subtle',
};

export default function GestionReservas() {
  const [reservaACancelar, setReservaACancelar] = useState<Reserva | null>(null);

  return (
    <main className="p-container-margin w-full">
      <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-text-primary">
            Gestión de Reservas
          </h2>
          <p className="font-body-md text-body-md text-text-muted mt-1">
            Administra y filtra todas las reservas del club deportivo.
          </p>
        </div>
      </header>

      {/* Filters */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-section-gap">
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 col-span-1 md:col-span-2">
          <h3 className="font-label-md text-label-md text-text-primary mb-4 flex items-center">
            <span className="material-symbols-outlined mr-2 text-text-muted text-[20px]">calendar_month</span>
            Rango de Fechas
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block font-label-sm text-label-sm text-text-muted mb-1">Desde</label>
              <input
                className="w-full rounded-lg border-border-subtle focus:border-secondary focus:ring-secondary font-body-md text-body-md text-text-primary shadow-sm"
                type="date"
              />
            </div>
            <div className="flex-1">
              <label className="block font-label-sm text-label-sm text-text-muted mb-1">Hasta</label>
              <input
                className="w-full rounded-lg border-border-subtle focus:border-secondary focus:ring-secondary font-body-md text-body-md text-text-primary shadow-sm"
                type="date"
              />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 col-span-1 md:col-span-2">
          <h3 className="font-label-md text-label-md text-text-primary mb-4 flex items-center">
            <span className="material-symbols-outlined mr-2 text-text-muted text-[20px]">tune</span>
            Filtros Avanzados
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block font-label-sm text-label-sm text-text-muted mb-1">Deporte</label>
              <select className="w-full rounded-lg border-border-subtle focus:border-secondary focus:ring-secondary font-body-md text-body-md text-text-primary shadow-sm">
                <option>Todos</option>
                <option>Pádel</option>
                <option>Tenis</option>
                <option>Básquet</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-label-sm text-label-sm text-text-muted mb-1">Cancha</label>
              <select className="w-full rounded-lg border-border-subtle focus:border-secondary focus:ring-secondary font-body-md text-body-md text-text-primary shadow-sm">
                <option>Todas</option>
                <option>Cancha 1 (Pádel)</option>
                <option>Cancha 2 (Tenis)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 col-span-1 md:col-span-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-3 rounded-lg border-border-subtle focus:border-secondary focus:ring-secondary font-body-md text-body-md text-text-primary shadow-sm"
              placeholder="Buscar por Usuario o Código de Reserva..."
              type="text"
            />
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Código</th>
                <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Usuario</th>
                <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Cancha</th>
                <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Deporte</th>
                <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Fecha</th>
                <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Bloque</th>
                <th className="py-4 px-6 font-label-md text-label-md text-text-muted">Estado</th>
                <th className="py-4 px-6 font-label-md text-label-md text-text-muted text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-text-primary divide-y divide-border-subtle">
              {reservas.map((reserva) => (
                <tr key={reserva.codigo} className="hover:bg-surface-bright transition-colors">
                  <td className="py-4 px-6 font-semibold">{reserva.codigo}</td>
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed-dim text-on-primary-fixed flex items-center justify-center font-bold text-sm">
                      {reserva.iniciales}
                    </div>
                    <span>{reserva.usuario}</span>
                  </td>
                  <td className="py-4 px-6">{reserva.cancha}</td>
                  <td className="py-4 px-6 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px] text-text-muted">sports_tennis</span>
                    {reserva.deporte}
                  </td>
                  <td className="py-4 px-6">{reserva.fecha}</td>
                  <td className="py-4 px-6">{reserva.bloque}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full font-label-sm text-label-sm border ${estadoStyles[reserva.estado]}`}
                    >
                      {reserva.estado}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      disabled={reserva.estado === 'Cancelada'}
                      onClick={() => setReservaACancelar(reserva)}
                      className="text-error hover:text-on-error-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancelar Reserva"
                    >
                      <span className="material-symbols-outlined">cancel</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-bright">
          <span className="font-body-md text-body-md text-text-muted">Mostrando 1 a 3 de 45 reservas</span>
          <div className="flex gap-2">
            <button className="p-2 rounded border border-border-subtle text-text-muted hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="p-2 rounded border border-secondary bg-secondary/10 text-secondary font-bold font-body-md text-sm">
              1
            </button>
            <button className="p-2 rounded border border-border-subtle text-text-primary hover:bg-surface-container-low font-body-md text-sm">
              2
            </button>
            <button className="p-2 rounded border border-border-subtle text-text-primary hover:bg-surface-container-low font-body-md text-sm">
              3
            </button>
            <button className="p-2 rounded border border-border-subtle text-text-muted hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modal de confirmación de cancelación */}
      {reservaACancelar && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary">Cancelar Reserva</h3>
                <p className="font-body-md text-body-md text-text-muted mt-1">
                  ¿Estás seguro de cancelar la reserva {reservaACancelar.codigo}?
                </p>
              </div>
            </div>
            <div className="mb-6">
              <label className="block font-label-sm text-label-sm text-text-primary mb-2">
                Motivo de cancelación (Opcional)
              </label>
              <textarea
                className="w-full rounded-lg border-border-subtle focus:border-secondary focus:ring-secondary font-body-md text-body-md text-text-primary shadow-sm"
                placeholder="Ej. Solicitud del usuario, mantenimiento..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReservaACancelar(null)}
                className="px-4 py-2 rounded-lg border border-border-subtle text-text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors"
              >
                Mantener
              </button>
              <button
                type="button"
                onClick={() => setReservaACancelar(null)}
                className="px-4 py-2 rounded-lg bg-error text-on-error font-label-md text-label-md hover:bg-on-error-container transition-colors shadow-sm"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
