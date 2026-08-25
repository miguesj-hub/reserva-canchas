type Cancha = {
  nombre: string;
  deporte: string;
  icono: string;
  horario: string;
  estado: 'Activa' | 'Mantenimiento';
};

const canchas: Cancha[] = [
  { nombre: 'Cancha 1 - Padel', deporte: 'Padel Indoor', icono: 'sports_tennis', horario: '06:00 - 23:00', estado: 'Activa' },
  { nombre: 'Cancha Central', deporte: 'Tenis Arcilla', icono: 'sports_tennis', horario: '07:00 - 21:00', estado: 'Activa' },
  { nombre: 'Cancha 3 - F5', deporte: 'Fútbol Sintético', icono: 'sports_soccer', horario: '14:00 - 23:00', estado: 'Mantenimiento' },
];

const filtros = ['Todas', 'Padel', 'Tenis', 'Fútbol'];

export default function GestionCanchas() {
  return (
    <main className="p-container-margin w-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-section-gap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">
            Gestión de Canchas
          </h2>
          <p className="font-body-md text-body-md text-text-muted">
            Administra las instalaciones, horarios y estado de las canchas.
          </p>
        </div>
        <button className="bg-primary text-on-primary font-label-md text-label-md py-2.5 px-5 rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Cancha
        </button>
      </header>

      <section className="bg-surface rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center border border-border-subtle">
        <div className="relative w-full md:w-96 flex-shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-lg font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors text-text-primary placeholder:text-text-muted"
            placeholder="Buscar por nombre o deporte..."
            type="text"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {filtros.map((filtro, i) => (
            <button
              key={filtro}
              className={`px-4 py-1.5 rounded-full border font-label-sm text-label-sm whitespace-nowrap transition-colors ${
                i === 0
                  ? 'border-secondary bg-secondary text-on-secondary'
                  : 'border-border-subtle bg-surface text-text-muted hover:border-secondary hover:text-secondary'
              }`}
            >
              {filtro}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canchas.map((cancha) => (
          <article
            key={cancha.nombre}
            className={`bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden transition-shadow group ${
              cancha.estado === 'Mantenimiento' ? 'opacity-75 hover:opacity-100' : 'hover:shadow-md'
            }`}
          >
            <div
              className={`h-32 relative flex items-center justify-center ${
                cancha.estado === 'Mantenimiento' ? 'bg-surface-variant grayscale' : 'bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-5xl text-outline-variant">{cancha.icono}</span>
              <div
                className={`absolute top-3 left-3 px-2 py-1 rounded font-label-sm text-label-sm flex items-center gap-1 backdrop-blur-sm border ${
                  cancha.estado === 'Activa'
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-surface-variant text-text-muted border-outline-variant'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cancha.estado === 'Activa' ? 'bg-success' : 'bg-text-muted'}`} />
                {cancha.estado}
              </div>
              <button
                aria-label="Más opciones"
                className="absolute top-3 right-3 p-1.5 bg-surface/80 rounded hover:bg-surface text-text-primary transition-colors backdrop-blur-sm shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">{cancha.nombre}</h3>
                  <p className="font-body-md text-body-md text-text-muted flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px]">{cancha.icono}</span>
                    {cancha.deporte}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <p className="font-label-sm text-label-sm text-text-muted uppercase mb-2">Horario de Operación</p>
                <p className="font-body-md text-body-md text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">schedule</span>
                  {cancha.horario}
                </p>
              </div>
              <div className="mt-5 flex gap-2">
                <button className="flex-1 bg-surface text-secondary border border-secondary font-label-md text-label-md py-2 rounded-lg hover:bg-secondary/5 transition-colors text-center">
                  Editar
                </button>
                {cancha.estado === 'Activa' ? (
                  <button
                    className="px-4 bg-error/10 text-error border border-error/20 font-label-md text-label-md py-2 rounded-lg hover:bg-error/20 transition-colors text-center"
                    title="Inactivar"
                  >
                    <span className="material-symbols-outlined text-[20px]">block</span>
                  </button>
                ) : (
                  <button
                    className="px-4 bg-success/10 text-success border border-success/20 font-label-md text-label-md py-2 rounded-lg hover:bg-success/20 transition-colors text-center"
                    title="Activar"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
