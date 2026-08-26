/** La sesión que baja el shell como prop (R-002). Se redeclara: los remotes no
 *  comparten código entre paquetes (Principio V). */
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
