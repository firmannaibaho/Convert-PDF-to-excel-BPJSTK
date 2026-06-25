import { useState, useCallback, useEffect } from 'react';
import { UploadCloud, Users, Shield, Database, LogOut } from 'lucide-react';
import './index.css';

import { getPembinaStats, getKeplings } from './services/api';
import { useDashboard } from './hooks/useDashboard';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExtractPage from './pages/ExtractPage';
import KeplingPage from './pages/KeplingPage';

import PembinaDetailModal from './components/modals/PembinaDetailModal';

function App() {
  // ---- Auth ----------------------------------------------------------------
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [namaPengisi, setNamaPengisi] = useState(() => localStorage.getItem('namaPengisi') || '');
  const [nim, setNim] = useState(() => localStorage.getItem('nim') || '');

  // ---- Global data (shared across pages) -----------------------------------
  const [pembinaStats, setPembinaStats] = useState([]);
  const [keplings, setKeplings] = useState([]);

  // ---- Navigation ----------------------------------------------------------
  const [currentView, setCurrentView] = useState('dashboard');

  // ---- Global modals -------------------------------------------------------
  const [selectedPembina, setSelectedPembina] = useState(null);

  // ---- Data fetchers -------------------------------------------------------
  const fetchPembinaStats = useCallback(async () => {
    try {
      const stats = await getPembinaStats();
      setPembinaStats(stats);
    } catch (error) {
      console.error('Error fetching Pembina stats:', error);
    }
  }, []);

  const fetchKeplings = useCallback(async () => {
    try {
      const list = await getKeplings();
      setKeplings(list);
    } catch (error) {
      console.error('Error fetching Keplings:', error);
    }
  }, []);

  const refreshAll = useCallback(() => {
    return Promise.all([fetchPembinaStats(), fetchKeplings()]);
  }, [fetchPembinaStats, fetchKeplings]);

  // Fetch on mount (parallel)
  useEffect(() => {
    Promise.all([fetchPembinaStats(), fetchKeplings()]);
  }, [fetchPembinaStats, fetchKeplings]);

  // ---- allAcquisitions for KeplingPage -------------------------------------
  const { allAcquisitions } = useDashboard(pembinaStats, keplings);

  // ---- Auth handlers -------------------------------------------------------
  const handleLogin = useCallback(({ namaPengisi: name, nim: n }) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('namaPengisi', name);
    localStorage.setItem('nim', n);
    setIsLoggedIn(true);
    setNamaPengisi(name);
    setNim(n);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('namaPengisi');
    localStorage.removeItem('nim');
    setIsLoggedIn(false);
    setNamaPengisi('');
    setNim('');
  }, []);

  // ---- Gate: Login ---------------------------------------------------------
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ---- Main layout ---------------------------------------------------------
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <h2>
              <Database size={24} style={{ display: 'inline', transform: 'rotate(-5deg)', marginRight: '5px' }} />
              Akuisisi
            </h2>
            <p>BPJS Ketenagakerjaan</p>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentView('dashboard'); fetchPembinaStats(); }}
            >
              <Users size={18} /> Dashboard
            </button>
            <button
              className={`nav-btn ${currentView === 'extract' ? 'active' : ''}`}
              onClick={() => setCurrentView('extract')}
            >
              <UploadCloud size={18} /> Ekstrak PDF
            </button>
            <button
              className={`nav-btn ${currentView === 'kepling' ? 'active' : ''}`}
              onClick={() => { setCurrentView('kepling'); fetchKeplings(); }}
            >
              <Shield size={18} /> Data Kepling
            </button>
          </nav>
        </div>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Operator</p>
            <p style={{ fontWeight: 900, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={namaPengisi}>
              {namaPengisi}
            </p>
            <span className="nim">{nim}</span>
          </div>
          <button
            className="brutal-btn"
            style={{ backgroundColor: 'var(--danger)', color: 'var(--text-main)', padding: '8px 12px', fontSize: '0.8rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '5px', boxShadow: 'var(--shadow-flat-sm)' }}
            onClick={handleLogout}
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {currentView === 'dashboard' && (
          <DashboardPage
            pembinaStats={pembinaStats}
            keplings={keplings}
            onSelectPembina={setSelectedPembina}
          />
        )}
        {currentView === 'extract' && (
          <ExtractPage
            namaPengisi={namaPengisi}
            setNamaPengisi={setNamaPengisi}
            nim={nim}
            setNim={setNim}
            onExportSuccess={fetchPembinaStats}
          />
        )}
        {currentView === 'kepling' && (
          <KeplingPage
            keplings={keplings}
            allAcquisitions={allAcquisitions}
            onRefresh={refreshAll}
          />
        )}
      </main>

      {/* Global modal: Pembina detail */}
      {selectedPembina && (
        <PembinaDetailModal
          pembina={selectedPembina}
          onClose={() => setSelectedPembina(null)}
        />
      )}
    </div>
  );
}

export default App;
