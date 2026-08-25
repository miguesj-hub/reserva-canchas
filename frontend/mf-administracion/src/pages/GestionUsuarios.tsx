type Usuario = {
  nombre: string;
  iniciales: string;
  correo: string;
  rol: 'Administrador' | 'Jugador';
  fechaRegistro: string;
  estado: 'Activo' | 'Inactivo';
};

const usuarios: Usuario[] = [
  {
    nombre: 'Carlos Espinosa',
    iniciales: 'CE',
    correo: 'carlos.e@ejemplo.com',
    rol: 'Administrador',
    fechaRegistro: '12 Oct 2023',
    estado: 'Activo',
  },
  {
    nombre: 'María Fernanda Ruiz',
    iniciales: 'MR',
    correo: 'mafer.ruiz@ejemplo.com',
    rol: 'Jugador',
    fechaRegistro: '15 Oct 2023',
    estado: 'Activo',
  },
  {
    nombre: 'Juan Pablo Torres',
    iniciales: 'JP',
    correo: 'juanpa.t@ejemplo.com',
    rol: 'Jugador',
    fechaRegistro: '01 Nov 2023',
    estado: 'Inactivo',
  },
];

export default function GestionUsuarios() {
  return (
    <main className="p-container-margin w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-section-gap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-text-primary">
            Gestión de Usuarios
          </h2>
          <p className="font-body-md text-body-md text-text-muted mt-1">
            Administra los usuarios registrados, roles y estados.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-surface border border-outline-variant text-text-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            Exportar
          </button>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Invitar Usuario
          </button>
        </div>
      </header>

      <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-border-subtle overflow-hidden">
        <div className="p-component-padding border-b border-border-subtle bg-surface flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-lg font-body-md text-body-md text-text-primary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              placeholder="Buscar por nombre o correo..."
              type="text"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="flex-1 sm:w-auto bg-surface border border-outline-variant text-text-primary rounded-lg px-4 py-2 font-label-md text-label-md focus:outline-none focus:border-secondary">
              <option value="">Todos los Roles</option>
              <option value="admin">Administrador</option>
              <option value="user">Jugador</option>
              <option value="staff">Staff</option>
            </select>
            <select className="flex-1 sm:w-auto bg-surface border border-outline-variant text-text-primary rounded-lg px-4 py-2 font-label-md text-label-md focus:outline-none focus:border-secondary">
              <option value="">Cualquier Estado</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-text-muted border-b border-border-subtle">
                <th className="px-6 py-4 font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  Usuario
                </th>
                <th className="px-6 py-4 font-label-sm text-label-sm uppercase tracking-wider font-semibold">Rol</th>
                <th className="px-6 py-4 font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  Fecha Registro
                </th>
                <th className="px-6 py-4 font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  Estado
                </th>
                <th className="px-6 py-4 font-label-sm text-label-sm uppercase tracking-wider font-semibold text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {usuarios.map((usuario) => (
                <tr key={usuario.correo} className="hover:bg-surface-bright transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed-dim text-primary flex items-center justify-center font-headline-sm text-headline-sm">
                        {usuario.iniciales}
                      </div>
                      <div>
                        <div className="font-label-md text-label-md text-text-primary">{usuario.nombre}</div>
                        <div className="font-body-md text-body-md text-text-muted text-sm">{usuario.correo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${
                        usuario.rol === 'Administrador'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
                      }`}
                    >
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-md text-body-md text-text-muted">{usuario.fechaRegistro}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm border ${
                        usuario.estado === 'Activo'
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-surface-container-high text-outline border-outline-variant'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${usuario.estado === 'Activo' ? 'bg-success' : 'bg-outline'}`}
                      />
                      {usuario.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-container rounded-lg transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      {usuario.estado === 'Activo' ? (
                        <button
                          className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Inactivar"
                        >
                          <span className="material-symbols-outlined text-[20px]">block</span>
                        </button>
                      ) : (
                        <button
                          className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
                          title="Activar"
                        >
                          <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border-subtle bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-body-md text-body-md text-text-muted">Mostrando 1 a 3 de 45 usuarios</span>
          <div className="flex gap-1">
            <button
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-text-muted hover:bg-surface-container-low disabled:opacity-50"
              disabled
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-label-sm text-label-sm">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-text-primary hover:bg-surface-container-low font-label-sm text-label-sm">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-text-primary hover:bg-surface-container-low font-label-sm text-label-sm">
              3
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-text-muted">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-text-primary hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
