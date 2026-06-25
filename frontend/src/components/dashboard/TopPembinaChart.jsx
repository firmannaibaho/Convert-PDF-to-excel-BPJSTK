/**
 * TopPembinaChart — horizontal bar chart showing top N pembinas
 * Extracted from App.jsx lines 1162–1204
 */
import { TrendingUp } from 'lucide-react';

const BAR_COLORS = ['var(--primary)', 'var(--accent-cyan)', 'var(--accent-purple)', 'var(--accent-orange)', '#fbbf24'];

export default function TopPembinaChart({ topPembinas, maxAcquisitions }) {
    return (
        <div className="brutal-card">
            <div className="brutal-card-header" style={{ marginBottom: '20px' }}>
                <h3 className="brutal-card-title">
                    <TrendingUp size={20} />
                    Top Kinerja Pembina (Grafik)
                </h3>
            </div>

            {topPembinas.length === 0 ? (
                <div className="empty-state">
                    <p>Belum ada data akuisisi pembina untuk diplot.</p>
                </div>
            ) : (
                <div className="chart-bar-container">
                    {topPembinas.map((p, idx) => {
                        const widthPct = (p.total_acquisitions / maxAcquisitions) * 100;
                        return (
                            <div className="chart-bar-row" key={idx}>
                                <div className="chart-bar-label" title={p.pembina}>{p.pembina}</div>
                                <div className="chart-bar-track">
                                    <div
                                        className="chart-bar-fill"
                                        style={{ width: `${widthPct}%`, backgroundColor: BAR_COLORS[idx] || BAR_COLORS[4] }}
                                    />
                                </div>
                                <div className="chart-bar-value">{p.total_acquisitions}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
