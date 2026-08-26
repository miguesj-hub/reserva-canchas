/**
 * La sesión que baja el shell como prop (R-002). Es la misma forma que declara
 * `shell/src/auth/AuthContext.tsx`; se redeclara aquí, y no se importa, porque
 * los remotes no comparten código entre paquetes (Principio V). Lo que los
 * mantiene sincronizados es el contrato, no un import.
 */
export type Sesion = {
    usuarioId: number;
    username: string;
    nombre: string;
    rol: 'USUARIO_FINAL' | 'ADMINISTRADOR';
};
export type PropsDeRemote = {
    sesion?: Sesion | null;
    onLogout?: () => void;
};
