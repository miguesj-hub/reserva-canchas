const kpis = [
  {
    label: 'Total Reservas (Hoy)',
    value: '142',
    icon: 'confirmation_number',
    trend: '+12% vs ayer',
    trendColor: 'text-success',
    iconBg: 'bg-primary-fixed text-secondary-fixed-dim',
    glow: 'bg-primary-fixed/30 group-hover:bg-primary-fixed/50',
  },
  {
    label: 'Ocupación',
    value: '85',
    suffix: '%',
    icon: 'pie_chart',
    iconBg: 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant',
    glow: 'bg-success/10 group-hover:bg-success/20',
    progress: 85,
    caption: 'Horario Pico: 18:00 - 21:00',
  },
  {
    label: 'Cancelaciones',
    value: '8',
    icon: 'event_busy',
    trend: '+2% vs promedio',
    trendColor: 'text-error',
    iconBg: 'bg-error-container text-on-error-container',
    glow: 'bg-error/10 group-hover:bg-error/20',
  },
  {
    label: 'Cancha Principal',
    value: 'Padel Central',
    icon: 'sports_tennis',
    iconBg: 'bg-secondary/10 text-secondary',
    glow: 'bg-secondary/10 group-hover:bg-secondary/20',
    caption: '100% reservada hoy',
  },
];

export default function Panel() {
  return (
    <>
      {/* Desktop Sub-header */}
      <div className="hidden md:flex bg-surface/80 backdrop-blur-md border-b border-border-subtle/50 sticky top-0 z-20 justify-between items-center px-container-margin h-16 w-full">
        <div className="flex items-center gap-4">
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Visión General</h2>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="text-sm font-label-md text-text-muted">Hoy, 24 Octubre 2023</span>
        </div>
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
            search
          </span>
          <input
            className="pl-10 pr-4 py-1.5 bg-surface-bright border border-border-subtle rounded-full text-sm font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all w-64"
            placeholder="Buscar reservas, usuarios..."
            type="text"
          />
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-container-margin flex-1 space-y-section-gap overflow-y-auto pb-24 md:pb-container-margin">
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
                  <div>
                    <p className="font-label-sm text-text-muted uppercase tracking-wider mb-1">{kpi.label}</p>
                    <h3 className="font-display text-[32px] font-extrabold text-text-primary leading-none">
                      {kpi.value}
                      {kpi.suffix && <span className="text-xl text-text-muted ml-1">{kpi.suffix}</span>}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                    <span className="material-symbols-outlined text-[24px]">{kpi.icon}</span>
                  </div>
                </div>
                {kpi.progress !== undefined && (
                  <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-2 mb-1">
                    <div className="bg-success h-1.5 rounded-full" style={{ width: `${kpi.progress}%` }} />
                  </div>
                )}
                {kpi.trend && (
                  <div className={`flex items-center gap-1 text-sm font-label-md ${kpi.trendColor}`}>
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>{kpi.trend}</span>
                  </div>
                )}
                {kpi.caption && <p className="text-xs text-text-muted">{kpi.caption}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
