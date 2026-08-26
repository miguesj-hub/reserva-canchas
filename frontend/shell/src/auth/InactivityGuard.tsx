import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const INACTIVIDAD_MS = 60_000;
const AVISO_MS = 30_000;

/**
 * Cierra la sesión tras un minuto sin actividad del usuario, avisando con 30
 * segundos de margen. Solo se monta dentro de rutas ya autenticadas
 * (AppLayout), así que no compite con la pantalla de login.
 */
export function InactivityGuard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(AVISO_MS / 1000);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const cerrarPorInactividad = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const iniciarCuentaRegresiva = useCallback(() => {
    setMostrarAviso(true);
    setSegundosRestantes(AVISO_MS / 1000);
    countdownTimer.current = setInterval(() => {
      setSegundosRestantes((restantes) => {
        if (restantes <= 1) {
          cerrarPorInactividad();
          return 0;
        }
        return restantes - 1;
      });
    }, 1000);
  }, [cerrarPorInactividad]);

  const reiniciarInactividad = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(iniciarCuentaRegresiva, INACTIVIDAD_MS);
  }, [iniciarCuentaRegresiva]);

  const confirmarPresencia = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setMostrarAviso(false);
    reiniciarInactividad();
  }, [reiniciarInactividad]);

  useEffect(() => {
    // Con el aviso visible, la actividad ambiental (el mouse pasando por
    // encima) no debe descartarlo: solo "Estoy Aquí" confirma que hay alguien.
    if (mostrarAviso) return;

    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    eventos.forEach((evento) => window.addEventListener(evento, reiniciarInactividad));
    reiniciarInactividad();

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciarInactividad));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [mostrarAviso, reiniciarInactividad]);

  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  if (!mostrarAviso) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-xl shadow-xl max-w-sm w-full p-8 text-center border border-border-subtle/50">
        <span className="material-symbols-outlined text-4xl text-warning mb-3 inline-block">
          schedule
        </span>
        <h3 className="font-headline-sm text-headline-sm text-primary mb-2">
          ¿Sigues ahí?
        </h3>
        <p className="font-body-md text-body-md text-text-muted mb-6">
          Tu sesión se cerrará por inactividad en{' '}
          <span className="font-bold text-primary">{segundosRestantes}</span> segundos.
        </p>
        <button
          type="button"
          onClick={confirmarPresencia}
          className="w-full py-3 px-6 rounded-lg font-bold font-label-md bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors shadow-sm"
        >
          Estoy Aquí
        </button>
      </div>
    </div>
  );
}
