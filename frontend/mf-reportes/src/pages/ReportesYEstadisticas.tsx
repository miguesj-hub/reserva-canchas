import { NavLink } from 'react-router-dom';

type Metrica = {
  titulo: string;
  valor: string;
  variacion: string;
  icono: string;
  colorFondo: string;
  colorTexto: string;
};

const metricas: Metrica[] = [
  {
    titulo: 'Total Reservas',
    valor: '1,248',
    variacion: '+12.5% vs mes anterior',
    icono: 'event_note',
    colorFondo: 'bg-secondary-container/20',
    colorTexto: 'text-secondary',
  },
  {
    titulo: 'Ocupación Promedio',
    valor: '78%',
    variacion: '+5.2% vs mes anterior',
    icono: 'pie_chart',
    colorFondo: 'bg-success/20',
    colorTexto: 'text-success',
  },
  {
    titulo: 'Cancelaciones',
    valor: '42',
    variacion: '+2.1% vs mes anterior',
    icono: 'cancel',
    colorFondo: 'bg-error/20',
    colorTexto: 'text-error',
  },
];

type BarraDeporte = {
  deporte: string;
  reservas: number;
  alturaPct: number;
  color: string;
};

const reservasPorDeporte: BarraDeporte[] = [
  { deporte: 'Pádel', reservas: 425, alturaPct: 85, color: 'bg-secondary' },
  { deporte: 'Tenis', reservas: 300, alturaPct: 60, color: 'bg-secondary-container' },
  { deporte: 'Fútbol', reservas: 200, alturaPct: 40, color: 'bg-inverse-primary' },
  { deporte: 'Básquet', reservas: 125, alturaPct: 25, color: 'bg-outline-variant' },
];

type OcupacionCancha = {
  cancha: string;
  porcentaje: number;
  color: string;
};

const ocupacionPorCancha: OcupacionCancha[] = [
  { cancha: 'Cancha Pádel 1 (Cristal)', porcentaje: 92, color: 'bg-secondary' },
  { cancha: 'Cancha Pádel 2', porcentaje: 85, color: 'bg-secondary' },
  { cancha: 'Cancha Tenis Principal', porcentaje: 78, color: 'bg-secondary-container' },
  { cancha: 'Cancha Fútbol 5', porcentaje: 65, color: 'bg-inverse-primary' },
  { cancha: 'Cancha Tenis 2', porcentaje: 45, color: 'bg-outline-variant' },
];

type FilaRanking = {
  cancha: string;
  deporte: string;
  icono: string;
  colorIcono: string;
  colorFondoIcono: string;
  reservas: number;
  ingresos: string;
  estado: 'Alta Demanda' | 'Estable';
};

const rankingDemanda: FilaRanking[] = [
  {
    cancha: 'Pádel 1 (Cristal)',
    deporte: 'Pádel',
    icono: 'sports_tennis',
    colorIcono: 'text-secondary',
    colorFondoIcono: 'bg-secondary/10',
    reservas: 185,
    ingresos: '$3,700',
    estado: 'Alta Demanda',
  },
  {
    cancha: 'Pádel 2',
    deporte: 'Pádel',
    icono: 'sports_tennis',
    colorIcono: 'text-secondary',
    colorFondoIcono: 'bg-secondary/10',
    reservas: 162,
    ingresos: '$3,240',
    estado: 'Alta Demanda',
  },
  {
    cancha: 'Tenis Principal',
    deporte: 'Tenis',
    icono: 'sports_tennis',
    colorIcono: 'text-secondary-container',
    colorFondoIcono: 'bg-secondary-container/10',
    reservas: 145,
    ingresos: '$2,900',
    estado: 'Estable',
  },
  {
    cancha: 'Fútbol 5 (Sintética)',
    deporte: 'Fútbol',
    icono: 'sports_soccer',
    colorIcono: 'text-on-surface-variant',
    colorFondoIcono: 'bg-inverse-primary/20',
    reservas: 98,
    ingresos: '$3,920',
    estado: 'Estable',
  },
];

function EstadoBadge({ estado }: { estado: FilaRanking['estado'] }) {
  const clases =
    estado === 'Alta Demanda' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning';
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${clases}`}
    >
      {estado}
    </span>
  );
}

function SideNavBar({ onLogout }: { onLogout?: () => void }) {
  // Este remote se muestra dentro de la sección de administración: sus
  // enlaces apuntan de vuelta a las rutas absolutas de mf-administracion.
  const items = [
    { icono: 'dashboard', label: 'Dashboard', to: '/administracion' },
    { icono: 'event_available', label: 'Reservas', to: '/administracion/reservas' },
    { icono: 'sports_tennis', label: 'Canchas', to: '/administracion/canchas' },
    { icono: 'group', label: 'Usuarios', to: '/administracion/usuarios' },
  ];

  return (
    <nav className="hidden md:flex bg-primary-container text-on-primary-container font-label-md text-label-md fixed left-0 top-0 h-screen w-64 shadow-lg flex-col p-base space-y-4 z-40">
      <div className="flex items-center space-x-3 px-4 py-6 border-b border-outline-variant/20 mb-2">
        <span className="material-symbols-outlined text-3xl text-secondary-container">
          sports_tennis
        </span>
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-primary">
            ReservaSport
          </h1>
          <p className="font-label-sm text-label-sm text-on-primary-container/70">Administración</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-1 overflow-y-auto px-2">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/administracion'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                isActive
                  ? 'bg-secondary text-on-secondary font-bold'
                  : 'text-on-primary-container/70 hover:text-on-primary-container hover:bg-secondary-container/20'
              }`
            }
          >
            <span className="material-symbols-outlined group-hover:text-secondary transition-colors">
              {item.icono}
            </span>
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to="/reportes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive
                ? 'bg-secondary text-on-secondary font-bold'
                : 'text-on-primary-container/70 hover:text-on-primary-container hover:bg-secondary-container/20'
            }`
          }
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            assessment
          </span>
          Reportes
        </NavLink>
      </div>

      <div className="mt-auto px-2 pt-2 border-t border-outline-variant/20 space-y-1">
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all duration-150 ${
              isActive
                ? 'bg-secondary text-on-secondary font-bold shadow-sm'
                : 'text-on-primary-container/70 hover:text-on-primary-container hover:bg-secondary-container/20'
            }`
          }
        >
          <span className="material-symbols-outlined">person</span>
          <span>Perfil</span>
        </NavLink>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-label-md text-label-md text-on-primary-container/70 hover:text-error hover:bg-error/10 transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}

function TopNavBar() {
  return (
    <header className="md:hidden bg-surface text-primary font-headline-sm text-headline-sm border-b border-border-subtle shadow-sm sticky top-0 z-50 flex justify-between items-center px-container-margin h-16 w-full">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-text-muted hover:bg-surface-container-low transition-colors p-2 rounded-full cursor-pointer active:scale-95 duration-200"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-display text-headline-md font-extrabold text-primary">
          ReservaSport
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-text-muted hover:bg-surface-container-low transition-colors p-2 rounded-full cursor-pointer active:scale-95 duration-200"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          type="button"
          className="text-text-muted hover:bg-surface-container-low transition-colors p-2 rounded-full cursor-pointer active:scale-95 duration-200"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden ml-2 border border-border-subtle cursor-pointer active:scale-95 duration-200">
          <img
            alt="Avatar del usuario"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkNtVLNXKKrGFTeJqvqTQYMxw3vyEjiyvKBhb3JNm3Vb3pqRLDKHaxYDfhgMtezADBmS1e5ZQWE7cBFJubCVJZUFL5mPnug4I4Z9aIBMMPRq0cRtBO7ZYXX1bkGX7-irvi7RMjpPjMtW6HmGm030L0MVAa8GplveJxbUr1_Ork4khEqioNjQPiKJneWupeNZ2R7Al482W1omYHy-iuS4LtV6rqiBMDLDrMXdP-3YtO3s8ZrPTAz-rp"
          />
        </div>
      </div>
    </header>
  );
}

export default function ReportesYEstadisticas({ onLogout }: { onLogout?: () => void }) {
  return (
    <div className="bg-background text-text-primary font-body-md antialiased flex">
      <SideNavBar onLogout={onLogout} />
      <TopNavBar />

      <main className="flex-1 w-full md:ml-64 min-h-screen p-4 md:p-8 lg:p-container-margin max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
              Reportes de Actividad
            </h1>
            <p className="text-text-muted font-body-md text-body-md mt-1">
              Análisis de rendimiento y ocupación del club.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border-subtle shadow-sm w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              className="px-4 py-2 rounded-md font-label-md text-label-md text-text-muted hover:bg-surface-container transition-colors whitespace-nowrap"
            >
              Hoy
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-md font-label-md text-label-md text-text-muted hover:bg-surface-container transition-colors whitespace-nowrap"
            >
              Esta Semana
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-md font-label-md text-label-md bg-primary-container text-on-primary-container shadow-sm whitespace-nowrap"
            >
              Este Mes
            </button>
            <div className="w-px h-6 bg-border-subtle mx-2 hidden md:block" />
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-md font-label-md text-label-md border border-border-subtle hover:bg-surface-container transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Personalizado
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-section-gap">
          {metricas.map((metrica) => (
            <div
              key={metrica.titulo}
              className="bg-surface rounded-xl p-6 border border-border-subtle shadow-[0px_4px_20px_rgba(15,23,42,0.05)] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <p className="text-text-muted font-label-md text-label-md uppercase tracking-wider">
                    {metrica.titulo}
                  </p>
                  <h3 className="font-display text-display text-primary mt-1">{metrica.valor}</h3>
                </div>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${metrica.colorFondo} ${metrica.colorTexto}`}
                >
                  <span className="material-symbols-outlined">{metrica.icono}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-success font-label-sm text-label-sm relative z-10">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>{metrica.variacion}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-section-gap">
          <div className="bg-surface rounded-xl p-6 border border-border-subtle shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                Reservas por Deporte
              </h3>
              <button type="button" className="text-text-muted hover:text-primary transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>

            <div className="h-64 flex items-end justify-between gap-2 md:gap-4 relative pt-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 z-0 border-b border-border-subtle">
                <div className="w-full border-t border-dashed border-border-subtle h-0" />
                <div className="w-full border-t border-dashed border-border-subtle h-0" />
                <div className="w-full border-t border-dashed border-border-subtle h-0" />
                <div className="w-full border-t border-dashed border-border-subtle h-0" />
              </div>
              <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-label-sm text-text-muted pb-8 -ml-2 text-right pointer-events-none">
                <span>500</span>
                <span>375</span>
                <span>250</span>
                <span>125</span>
                <span>0</span>
              </div>

              {reservasPorDeporte.map((barra, i) => (
                <div
                  key={barra.deporte}
                  className={`flex flex-col items-center flex-1 z-10 group ${i === 0 ? 'pl-8' : ''}`}
                >
                  <div
                    className={`w-full ${barra.color} rounded-t-md relative overflow-hidden hover:brightness-110 transition-all cursor-pointer`}
                    style={{ height: `${barra.alturaPct}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-on-tertiary text-label-sm px-2 py-1 rounded shadow-lg transition-opacity whitespace-nowrap pointer-events-none z-20">
                      {barra.reservas} Reservas
                    </div>
                  </div>
                  <span className="mt-2 font-label-sm text-label-sm text-text-muted">
                    {barra.deporte}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-xl p-6 border border-border-subtle shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                Ocupación por Cancha
              </h3>
              <button type="button" className="text-text-muted hover:text-primary transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>

            <div className="space-y-4">
              {ocupacionPorCancha.map((item) => (
                <div key={item.cancha}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-md text-label-md text-primary">{item.cancha}</span>
                    <span className="font-label-md text-label-md text-primary">
                      {item.porcentaje}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2.5">
                    <div
                      className={`${item.color} h-2.5 rounded-full`}
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border-subtle shadow-[0px_4px_20px_rgba(15,23,42,0.05)] overflow-hidden mb-section-gap">
          <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-bright/50">
            <h3 className="font-headline-sm text-headline-sm text-primary">Ranking de Demanda</h3>
            <button
              type="button"
              className="flex items-center gap-2 text-secondary font-label-md text-label-md hover:underline"
            >
              Ver todos
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-text-muted font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold border-b border-border-subtle">Cancha</th>
                  <th className="p-4 font-semibold border-b border-border-subtle">Deporte</th>
                  <th className="p-4 font-semibold border-b border-border-subtle text-right">
                    Reservas
                  </th>
                  <th className="p-4 font-semibold border-b border-border-subtle text-right">
                    Ingresos Estimados
                  </th>
                  <th className="p-4 font-semibold border-b border-border-subtle text-center">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rankingDemanda.map((fila) => (
                  <tr key={fila.cancha} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-md flex items-center justify-center ${fila.colorFondoIcono} ${fila.colorIcono}`}
                        >
                          <span className="material-symbols-outlined">{fila.icono}</span>
                        </div>
                        <span className="font-label-md text-label-md text-primary">
                          {fila.cancha}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-text-muted">{fila.deporte}</td>
                    <td className="p-4 text-right font-label-md text-label-md">{fila.reservas}</td>
                    <td className="p-4 text-right font-body-md text-body-md">{fila.ingresos}</td>
                    <td className="p-4 text-center">
                      <EstadoBadge estado={fila.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
