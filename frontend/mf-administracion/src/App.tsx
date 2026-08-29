import { Routes, Route } from 'react-router-dom';
import Panel from './pages/Panel';
import GestionReservas from './pages/GestionReservas';
import GestionUsuarios from './pages/GestionUsuarios';
import GestionCanchas from './pages/GestionCanchas';
import Disponibilidad from './pages/Disponibilidad';
import Configuracion from './pages/Configuracion';
import type { PropsDeRemote } from './tipos';
import './App.css';

/**
 * Este remote expone SOLO sus páginas. El marco —barra lateral, cabecera y
 * navegación— lo pinta el shell desde la feature 003, de modo que al cambiar de
 * sección solo se reemplaza este contenido.
 *
 * `sesion` y `onLogout` siguen llegando por props para no romper el contrato de
 * Module Federation (`exposes: './App'`), aunque ninguna página los use hoy: el
 * shell es quien muestra el usuario y quien cierra la sesión.
 */
const App = (_props: PropsDeRemote) => (
  <Routes>
    <Route index element={<Panel />} />
    <Route path="reservas" element={<GestionReservas />} />
    <Route path="usuarios" element={<GestionUsuarios />} />
    <Route path="canchas" element={<GestionCanchas />} />
    <Route path="disponibilidad" element={<Disponibilidad />} />
    <Route path="configuracion" element={<Configuracion />} />
  </Routes>
);

export default App;
