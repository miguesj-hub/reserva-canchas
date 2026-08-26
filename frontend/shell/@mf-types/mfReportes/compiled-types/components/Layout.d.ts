import { type ReactNode } from 'react';
import type { Sesion } from '../tipos';
export declare function Layout({ onLogout, children, }: {
    sesion?: Sesion | null;
    onLogout?: () => void;
    children: ReactNode;
}): import("react").JSX.Element;
