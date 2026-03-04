import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PatientsPage from './pages/PatientsPage';
import EpisodesPage from './pages/EpisodesPage';
import EvaluationsPage from './pages/EvaluationsPage';
import HogarPage from './pages/HogarPage';
import ProblemPage from './pages/ProblemPage';
import DiagnosticPage from './pages/DiagnosticPage';
import PlanPage from './pages/PlanPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import ConfigPage from './pages/ConfigPage';

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pacientes" element={<PatientsPage />} />
            <Route path="/episodios" element={<EpisodesPage />} />
            <Route path="/evaluaciones" element={<EvaluationsPage />} />
            <Route path="/hogar" element={<HogarPage />} />
            <Route path="/problema" element={<ProblemPage />} />
            <Route path="/diagnostico" element={<DiagnosticPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="/config" element={<ConfigPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
