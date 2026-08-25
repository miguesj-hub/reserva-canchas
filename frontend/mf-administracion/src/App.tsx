import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Panel from './pages/Panel';
import GestionReservas from './pages/GestionReservas';
import GestionUsuarios from './pages/GestionUsuarios';
import GestionCanchas from './pages/GestionCanchas';
import './App.css';

const App = ({ token, onLogout }: { token?: string; onLogout?: () => void }) => {
  void token;

  return (
    <Routes>
      <Route element={<Layout onLogout={onLogout} />}>
        <Route index element={<Panel />} />
        <Route path="reservas" element={<GestionReservas />} />
        <Route path="usuarios" element={<GestionUsuarios />} />
        <Route path="canchas" element={<GestionCanchas />} />
      </Route>
    </Routes>
  );
};

export default App;
