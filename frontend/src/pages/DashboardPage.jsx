/**
 * DashboardPage
 * Assembles all dashboard components — KPICards, PembinaTable, TopPembinaChart, ActivityFeed, GISDashboard
 * Extracted from App.jsx renderDashboard() (lines 1094–1672)
 */
import { useState } from 'react';
import { Users, MapPin } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import KPICards from '../components/dashboard/KPICards';
import PembinaTable from '../components/dashboard/PembinaTable';
import TopPembinaChart from '../components/dashboard/TopPembinaChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import GISDashboard from '../components/dashboard/GISDashboard';

export default function DashboardPage({ pembinaStats, keplings, onSelectPembina }) {
    const [dashboardTab, setDashboardTab] = useState('pembina');

    const {
        totalAcquisitions, totalPembinas, totalAssignedRegions, activePembinas,
        topPembinas, maxAcquisitions,
        recentAcquisitions,
        geoData,
        filledKeplingCount, vacantKeplingCount, totalActivePerisais,
    } = useDashboard(pembinaStats, keplings);

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h1>Dashboard Kinerja &amp; Wilayah</h1>
                <p>Master dashboard pemantauan pencapaian akuisisi oleh Pembina Wilayah dan Pemetaan GIS</p>
            </div>

            {/* Tab Toggle */}
            <div className="brutal-tabs" style={{ marginBottom: '30px', borderBottom: 'none', paddingBottom: 0 }}>
                <button
                    type="button"
                    className={`brutal-tab ${dashboardTab === 'pembina' ? 'active' : ''}`}
                    onClick={() => setDashboardTab('pembina')}
                    style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Users size={16} /> Kinerja Pembina
                </button>
                <button
                    type="button"
                    className={`brutal-tab ${dashboardTab === 'gis' ? 'active' : ''}`}
                    onClick={() => setDashboardTab('gis')}
                    style={{
                        padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: dashboardTab === 'gis' ? 'var(--accent-orange)' : 'white'
                    }}
                >
                    <MapPin size={16} /> Kecerdasan Geografis (GIS)
                </button>
            </div>

            {dashboardTab === 'pembina' ? (
                <>
                    <KPICards
                        totalAcquisitions={totalAcquisitions}
                        totalPembinas={totalPembinas}
                        totalAssignedRegions={totalAssignedRegions}
                        activePembinas={activePembinas}
                    />

                    <div className="dashboard-grid">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div className="brutal-card">
                                <PembinaTable pembinaStats={pembinaStats} onSelectPembina={onSelectPembina} />
                            </div>
                            <TopPembinaChart topPembinas={topPembinas} maxAcquisitions={maxAcquisitions} />
                        </div>
                        <div>
                            <ActivityFeed recentAcquisitions={recentAcquisitions} />
                        </div>
                    </div>
                </>
            ) : (
                <GISDashboard
                    geoData={geoData}
                    totalAcquisitions={totalAcquisitions}
                    filledKeplingCount={filledKeplingCount}
                    keplingsTotalCount={keplings.length}
                    totalActivePerisais={totalActivePerisais}
                />
            )}
        </div>
    );
}
