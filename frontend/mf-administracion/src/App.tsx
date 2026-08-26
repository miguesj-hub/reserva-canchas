import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Panel from './pages/Panel';
import GestionReservas from './pages/GestionReservas';
import GestionUsuarios from './pages/GestionUsuarios';
import GestionCanchas from './pages/GestionCanchas';
import type { PropsDeRemote } from './tipos';
import './App.css';

const App = ({ sesion, onLogout }: PropsDeRemote) => (
  <Routes>
    <Route element={<Layout sesion={sesion} onLogout={onLogout} />}>
      <Route index element={<Panel />} />
      <Route path="reservas" element={<GestionReservas />} />
      <Route path="usuarios" element={<GestionUsuarios />} />
      <Route path="canchas" element={<GestionCanchas />} />
    </Route>
  </Routes>
);

export default App;
