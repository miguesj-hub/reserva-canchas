import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'reservasport_token';
const ROLE_STORAGE_KEY = 'reservasport_role';

export type Role = 'admin' | 'cliente';

type MockUser = { username: string; password: string; role: Role; nombre: string };

// Backend no disponible todavía: credenciales fijas para probar los dos
// perfiles de usuario. En cuanto exista un servicio de autenticación real,
// este arreglo desaparece y login() pasa a llamar al backend.
const MOCK_USERS: MockUser[] = [
  { username: 'admin', password: 'admin', role: 'admin', nombre: 'Administrador' },
  { username: 'cliente', password: 'cliente', role: 'cliente', nombre: 'Cliente' },
];

type AuthContextValue = {
  token: string | null;
  role: Role | null;
  nombre: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as Role | null;
    if (storedToken && storedRole) {
      setToken(storedToken);
      setRole(storedRole);
      setNombre(MOCK_USERS.find((u) => u.role === storedRole)?.nombre ?? null);
    }
  }, []);

  function login(username: string, password: string): boolean {
    const user = MOCK_USERS.find(
      (u) => u.username === username.trim() && u.password === password,
    );
    if (!user) return false;

    const mockToken = `mock-jwt-${user.role}-${Date.now()}`;
    localStorage.setItem(STORAGE_KEY, mockToken);
    localStorage.setItem(ROLE_STORAGE_KEY, user.role);
    setToken(mockToken);
    setRole(user.role);
    setNombre(user.nombre);
    return true;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    setToken(null);
    setRole(null);
    setNombre(null);
  }

  return (
    <AuthContext.Provider
      value={{ token, role, nombre, isAuthenticated: token !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
