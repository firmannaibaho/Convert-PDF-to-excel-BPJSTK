/**
 * PembinaTable — performance table for all pembinas
 * Extracted from App.jsx lines 778–877
 */
import { Download } from 'lucide-react';
import { PEMBINA_TARGET } from '../../constants/config';
import { exportPembinaToExcel } from '../../utils/excelHelper';

export default function PembinaTable({ pembinaStats, onSelectPembina }) {
    if (!pembinaStats || pembinaStats.length === 0) {
        return (
            <div className="empty-state">
                <p>Tidak ada data laporan Pembina. Pastikan file FORM RESULT - FORM.csv terisi.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex-between">
                <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                    Laporan Kinerja &amp; Quota Pembina
                </h3>
                <button className="brutal-btn orange" onClick={() => exportPembinaToExcel(pembinaStats)}>
                    <Download size={16} /> Export Laporan Pembina
                </button>
            </div>

            <div className="brutal-table-container">
                <table className="brutal-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>No</th>
                            <th>Nama Pembina</th>
                            <th>Jumlah Wilayah di-Assign</th>
                            <th>Total Akuisisi</th>
                            <th style={{ minWidth: '180px' }}>Progres Target ({PEMBINA_TARGET})</th>
                            <th>Status Quota</th>
                            <th style={{ width: '130px', textAlign: 'center' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pembinaStats.map((row, i) => {
                            const acquisitions = row.total_acquisitions || 0;
                            const pct = Math.min(Math.round((acquisitions / (PEMBINA_TARGET || 1)) * 100), 100);
                            const isTargetAchieved = acquisitions >= PEMBINA_TARGET;

                            return (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td style={{ fontWeight: 850 }}>{row.pembina}</td>
                                    <td className="font-mono">{row.assigned_regions_count}</td>
                                    <td>
                                        <span className="brutal-badge success" style={{ fontWeight: 900 }}>{acquisitions}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 900 }}>
                                                <span>{pct}%</span>
                                                <span>{acquisitions} / {PEMBINA_TARGET}</span>
                                            </div>
                                            <div className="table-progress-bar">
                                                <div
                                                    className="table-progress-fill"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: isTargetAchieved ? 'var(--success)' : pct >= 50 ? 'var(--primary)' : 'var(--accent-orange)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {isTargetAchieved ? (
                                            <span className="brutal-badge success" style={{ fontWeight: 900, backgroundColor: '#4ade80' }}>Tercapai</span>
                                        ) : (
                                            <span className="brutal-badge" style={{ fontWeight: 900, backgroundColor: '#fca5a5', border: 'var(--border-thin)', color: '#1a1a1a' }}>
                                                Kurang {PEMBINA_TARGET - acquisitions}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="brutal-btn cyan"
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                            onClick={() => onSelectPembina(row)}
                                            disabled={acquisitions === 0}
                                        >
                                            Lihat Detail
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
