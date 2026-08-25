import { useState } from 'react';
import { Link } from 'react-router-dom';

type EstadoSlot = 'disponible' | 'ocupado' | 'mantenimiento';

type Slot = {
  hora: string;
  estado: EstadoSlot;
  precio?: string;
};

type Cancha = {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  slots: Slot[];
};

const deportes = ['Pádel', 'Tenis', 'Basket'];

const dias = [
  { label: 'Hoy', numero: 15 },
  { label: 'Jue', numero: 16 },
  { label: 'Vie', numero: 17 },
  { label: 'Sáb', numero: 18 },
  { label: 'Dom', numero: 19 },
];

const canchas: Cancha[] = [
  {
    id: 'padel-1',
    nombre: 'Cancha Pádel 1',
    descripcion: 'Cristal Panorámico • Exterior',
    icono: 'sports_tennis',
    slots: [
      { hora: '07:00', estado: 'disponible', precio: '$25.00' },
      { hora: '08:00', estado: 'disponible', precio: '$25.00' },
      { hora: '09:00', estado: 'ocupado' },
      { hora: '10:00', estado: 'disponible', precio: '$25.00' },
      { hora: '11:00', estado: 'mantenimiento' },
    ],
  },
];

export default function Disponibilidad() {
  const [deporte, setDeporte] = useState('Pádel');
  const [diaSeleccionado, setDiaSeleccionado] = useState(dias[0].numero);
  const [slotSeleccionado, setSlotSeleccionado] = useState<string | null>('08:00');

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
            {deportes.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDeporte(d)}
                className={`flex-1 py-2 px-3 rounded-lg font-label-md border transition-colors ${
                  deporte === d
                    ? 'bg-primary-container text-on-primary-container border-transparent shadow-sm'
                    : 'bg-surface text-text-primary border-border-subtle hover:border-secondary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-6 border border-border-subtle/50 lg:col-span-2">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Fecha</h3>
          <div className="flex items-center space-x-4">
            <button type="button" className="p-2 border border-border-subtle rounded-lg text-text-muted hover:text-primary transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex-1 flex justify-between overflow-x-auto space-x-2 pb-2">
              {dias.map((d) => (
                <button
                  key={d.numero}
                  type="button"
                  onClick={() => setDiaSeleccionado(d.numero)}
                  className={`flex flex-col items-center justify-center min-w-[60px] h-[70px] rounded-lg cursor-pointer transition-colors ${
                    diaSeleccionado === d.numero
                      ? 'bg-secondary text-on-secondary shadow-sm'
                      : 'bg-surface text-text-primary border border-border-subtle hover:border-secondary'
                  }`}
                >
                  <span className="font-label-sm text-label-sm">{d.label}</span>
                  <span className="font-headline-md text-headline-md">{d.numero}</span>
                </button>
              ))}
            </div>
            <button type="button" className="p-2 border border-border-subtle rounded-lg text-text-muted hover:text-primary transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-6">
          <h3 className="font-headline-md text-headline-md text-primary">Canchas Disponibles</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="font-label-sm text-label-sm text-text-muted">Disponible</span>
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

        {canchas.map((cancha) => (
          <div
            key={cancha.id}
            className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-border-subtle/50 mb-6 overflow-hidden"
          >
            <div className="p-6 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg bg-primary-fixed-dim flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-3xl">{cancha.icono}</span>
                </div>
                <div>
                  <h4 className="font-headline-sm text-headline-sm text-primary">{cancha.nombre}</h4>
                  <p className="font-body-md text-body-md text-text-muted">{cancha.descripcion}</p>
                </div>
              </div>
              <Link
                to="../nueva"
                className={`py-2 px-6 rounded-lg font-bold font-label-md transition-colors shadow-sm text-center ${
                  slotSeleccionado
                    ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                    : 'bg-surface-container text-text-muted pointer-events-none'
                }`}
              >
                Reservar Seleccionados
              </Link>
            </div>

            <div className="p-6 bg-surface-bright overflow-x-auto">
              <div className="flex min-w-max space-x-2">
                {cancha.slots.map((slot) => (
                  <button
                    key={slot.hora}
                    type="button"
                    disabled={slot.estado !== 'disponible'}
                    onClick={() => setSlotSeleccionado(slot.hora)}
                    className={`w-24 h-20 rounded-lg border flex flex-col items-center justify-center transition-shadow relative overflow-hidden ${
                      slot.estado === 'disponible' && slotSeleccionado === slot.hora
                        ? 'bg-secondary text-on-secondary shadow-md border-transparent'
                        : slot.estado === 'disponible'
                          ? 'bg-surface border-l-4 border-l-success border-border-subtle cursor-pointer hover:shadow-md'
                          : slot.estado === 'mantenimiento'
                            ? 'bg-surface border-l-4 border-l-warning border-border-subtle opacity-80 cursor-not-allowed'
                            : 'bg-surface-dim border-border-subtle opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {slot.estado === 'mantenimiento' && (
                      <span className="material-symbols-outlined text-warning mb-1">build</span>
                    )}
                    <span
                      className={`font-label-md text-label-md ${
                        slot.estado === 'ocupado' ? 'text-text-muted line-through' : ''
                      } ${slot.estado === 'mantenimiento' ? 'text-warning' : ''}`}
                    >
                      {slot.hora}
                    </span>
                    {slot.precio && (
                      <span
                        className={`font-label-sm text-label-sm ${
                          slotSeleccionado === slot.hora ? '' : 'text-success'
                        }`}
                      >
                        {slot.precio}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
