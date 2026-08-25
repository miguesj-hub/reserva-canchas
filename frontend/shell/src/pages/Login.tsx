import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { HOME_BY_ROLE } from '../auth/RoleRoute';
import { useAuth, type Role } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = login(username, password);
    if (!ok) {
      setError('Usuario o contraseña incorrectos.');
      return;
    }
    setError(null);
    // El rol recién autenticado no está en el estado de React todavía en
    // este mismo tick; se relee de localStorage para decidir a dónde ir.
    const role = localStorage.getItem('reservasport_role') as Role | null;
    navigate(role ? HOME_BY_ROLE[role] : '/reservas', { replace: true });
  }

  return (
    <main className="bg-background min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="bg-cover bg-center w-full h-full opacity-60"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAsBKfUoefebT6ZfMe0UXaWWc_8BuuhKtoFheJW5cIztBI-m8Yj_JL_YbRV4lItawXC2BWXJQPEk9BvorBEfi7mLLfx6VPCJlrcw8qV0dRaU00UOy6KmeTCRk-pGw0XI_gCh4weXf-9ViB4jHJwc1iFmo2nROJk7cusCJDW2q0CQ70Ews-FECJ2RvMsBIS1N66VN2mQtNWDVrJ90G3hr0VG3A4hRBvaSQSvJv6Ear-ibPp0-hfucOE4')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-surface/80 to-surface/90 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md p-container-margin md:p-0">
        <div className="text-center mb-8">
          <h1 className="font-display text-display text-primary-container tracking-tight drop-shadow-sm flex items-center justify-center gap-3">
            <span
              className="material-symbols-outlined text-4xl text-secondary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sports_tennis
            </span>
            ReservaSport
          </h1>
          <p className="font-body-md text-body-md text-text-muted mt-2">
            Acceso a tu club deportivo
          </p>
        </div>

        <div className="bg-surface rounded-xl p-8 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-border-subtle relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-secondary-container" />

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                className="block font-label-md text-label-md text-primary-container mb-2"
                htmlFor="username"
              >
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-3 border border-border-subtle rounded-lg font-body-md text-body-md text-text-primary placeholder-text-muted/70 focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-colors bg-surface-bright"
                  id="username"
                  name="username"
                  placeholder="admin o cliente"
                  required
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                className="block font-label-md text-label-md text-primary-container mb-2"
                htmlFor="password"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <span className="material-symbols-outlined text-lg">lock</span>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-3 border border-border-subtle rounded-lg font-body-md text-body-md text-text-primary placeholder-text-muted/70 focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-colors bg-surface-bright"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end mt-2">
                <a
                  className="font-label-sm text-label-sm text-secondary-container hover:text-secondary-fixed-variant transition-colors"
                  href="#"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <div className="flex items-center">
              <input
                className="h-4 w-4 text-secondary-container focus:ring-secondary-container border-border-subtle rounded-sm cursor-pointer"
                id="remember-me"
                name="remember-me"
                type="checkbox"
              />
              <label
                className="ml-2 block font-body-md text-body-md text-text-primary cursor-pointer"
                htmlFor="remember-me"
              >
                Recordarme
              </label>
            </div>

            {error && (
              <p
                role="alert"
                className="font-label-md text-label-md text-error-container bg-error/10 border border-error rounded-lg px-3 py-2"
              >
                {error}
              </p>
            )}

            <button
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-label-md text-label-md text-on-primary bg-primary-container hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-all active:scale-[0.98]"
              type="submit"
            >
              Iniciar Sesión
              <span className="material-symbols-outlined ml-2 text-sm">login</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-subtle text-center space-y-1">
            <p className="font-label-sm text-label-sm text-text-muted">
              Credenciales de prueba
            </p>
            <p className="font-body-md text-body-md text-text-primary">
              Administrador: <span className="font-semibold">admin / admin</span>
            </p>
            <p className="font-body-md text-body-md text-text-primary">
              Cliente: <span className="font-semibold">cliente / cliente</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
