import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HOME_BY_ROLE } from '../auth/RoleRoute';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

type Modo = 'login' | 'registro';

export default function Login() {
  const { login, registrar } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [modo, setModo] = useState<Modo>('login');
  const [username, setUsername] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  // Si el cliente HTTP cerró la sesión por un 401 —cuenta inactivada mientras
  // el usuario la tenía abierta— llega aquí el motivo, para no devolverlo a una
  // pantalla de login sin explicación.
  const [error, setError] = useState<string | null>(params.get('motivo'));
  const [enviando, setEnviando] = useState(false);

  const esRegistro = modo === 'registro';

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setError(null);
    setPassword('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      // La sesión que devuelve el backend trae el rol, así que no hace falta
      // releer localStorage para saber a dónde ir.
      const sesion = esRegistro
        ? await registrar(username, nombre, password)
        : await login(username, password);
      navigate(HOME_BY_ROLE[sesion.rol], { replace: true });
    } catch (e) {
      // El motivo lo dice el servidor: "usuario o contraseña incorrectos",
      // "la cuenta está inactiva" (FR-005) o "ese usuario ya está registrado"
      // (FR-002). Repetirlo aquí lo dejaría desincronizado con las reglas.
      setError(
        e instanceof ApiError
          ? e.message
          : 'No se pudo contactar con el servidor. Inténtalo de nuevo.',
      );
    } finally {
      setEnviando(false);
    }
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

          <div className="flex gap-1 mb-6 p-1 bg-surface-container-low rounded-lg">
            <button
              className={`flex-1 py-2 rounded-md font-label-md text-label-md transition-colors ${
                esRegistro
                  ? 'text-text-muted hover:text-text-primary'
                  : 'bg-surface text-primary-container shadow-sm'
              }`}
              onClick={() => cambiarModo('login')}
              type="button"
            >
              Iniciar sesión
            </button>
            <button
              className={`flex-1 py-2 rounded-md font-label-md text-label-md transition-colors ${
                esRegistro
                  ? 'bg-surface text-primary-container shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => cambiarModo('registro')}
              type="button"
            >
              Crear cuenta
            </button>
          </div>

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
                  placeholder="Tu nombre de usuario"
                  required
                  minLength={esRegistro ? 3 : undefined}
                  maxLength={60}
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {esRegistro && (
              <div>
                <label
                  className="block font-label-md text-label-md text-primary-container mb-2"
                  htmlFor="nombre"
                >
                  Nombre completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <span className="material-symbols-outlined text-lg">badge</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-border-subtle rounded-lg font-body-md text-body-md text-text-primary placeholder-text-muted/70 focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-colors bg-surface-bright"
                    id="nombre"
                    name="nombre"
                    placeholder="Cómo quieres que te llamemos"
                    required
                    maxLength={120}
                    type="text"
                    autoComplete="name"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
              </div>
            )}

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
                  minLength={esRegistro ? 6 : undefined}
                  maxLength={72}
                  type="password"
                  autoComplete={esRegistro ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {esRegistro && (
                <p className="font-label-sm text-label-sm text-text-muted mt-2">
                  Mínimo 6 caracteres.
                </p>
              )}
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
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-label-md text-label-md text-on-primary bg-primary-container hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={enviando}
            >
              {enviando
                ? 'Enviando…'
                : esRegistro
                  ? 'Crear cuenta'
                  : 'Iniciar Sesión'}
              <span className="material-symbols-outlined ml-2 text-sm">
                {esRegistro ? 'person_add' : 'login'}
              </span>
            </button>
          </form>

          {esRegistro && (
            <p className="mt-6 pt-6 border-t border-border-subtle font-label-sm text-label-sm text-text-muted text-center">
              Las cuentas nuevas se crean como usuario final. Los administradores
              los da de alta el club.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
