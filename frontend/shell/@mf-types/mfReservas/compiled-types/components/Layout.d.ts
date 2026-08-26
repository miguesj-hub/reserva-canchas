import type { Sesion } from '../tipos';
export declare function Layout({ sesion, onLogout, }: {
    sesion?: Sesion | null;
    onLogout?: () => void;
}): import("react").JSX.Element;
