/**
 * KPICards — 4 KPI summary cards for the dashboard
 * Extracted from App.jsx lines 1132–1153
 */
export default function KPICards({ totalAcquisitions, totalPembinas, totalAssignedRegions, activePembinas }) {
    return (
        <div className="kpi-container">
            <div className="kpi-card color-0">
                <span className="kpi-label">Total Akuisisi</span>
                <span className="kpi-value font-mono">{totalAcquisitions}</span>
                <span className="kpi-subtext">Peserta Terdaftar</span>
            </div>
            <div className="kpi-card color-1">
                <span className="kpi-label">Total Pembina</span>
                <span className="kpi-value font-mono">{totalPembinas}</span>
                <span className="kpi-subtext">Orang Pembina Wilayah</span>
            </div>
            <div className="kpi-card color-2">
                <span className="kpi-label">Wilayah Ter-assign</span>
                <span className="kpi-value font-mono">{totalAssignedRegions}</span>
                <span className="kpi-subtext">Kelurahan / Kepling</span>
            </div>
            <div className="kpi-card color-3">
                <span className="kpi-label">Pembina Aktif</span>
                <span className="kpi-value font-mono">{activePembinas}</span>
                <span className="kpi-subtext">Pembina dengan Capaian</span>
            </div>
        </div>
    );
}
