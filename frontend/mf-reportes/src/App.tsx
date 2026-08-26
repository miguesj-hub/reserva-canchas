import './App.css';
import { Layout } from './components/Layout';
import ReportesYEstadisticas from './pages/ReportesYEstadisticas';
import type { PropsDeRemote } from './tipos';

const App = ({ sesion, onLogout }: PropsDeRemote) => (
  <Layout sesion={sesion} onLogout={onLogout}>
    <ReportesYEstadisticas sesion={sesion} onLogout={onLogout} />
  </Layout>
);

export default App;
