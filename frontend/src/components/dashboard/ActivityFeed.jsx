/**
 * ActivityFeed — recent acquisition activity list
 * Extracted from App.jsx lines 1207–1245
 */
import { Clock } from 'lucide-react';

export default function ActivityFeed({ recentAcquisitions }) {
    return (
        <div className="brutal-card">
            <div className="brutal-card-header" style={{ marginBottom: '20px' }}>
                <h3 className="brutal-card-title">
                    <Clock size={20} />
                    Aktivitas Terbaru
                </h3>
            </div>

            {recentAcquisitions.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px' }}>
                    <p style={{ fontSize: '0.85rem' }}>Belum ada aktivitas ekspor data baru.</p>
                </div>
            ) : (
                <div className="activity-feed">
                    {recentAcquisitions.map((acq, index) => (
                        <div className="activity-item" key={index}>
                            <div className="activity-meta">
                                <span>{acq.tanggal_input} - {acq.jam_input}</span>
                                <span className="brutal-badge info" style={{ padding: '1px 5px', fontSize: '0.65rem' }}>
                                    {acq.pembinaName}
                                </span>
                            </div>
                            <div className="activity-title">{acq.nama_tk}</div>
                            <div className="activity-desc" style={{ fontSize: '0.75rem' }}>
                                NIK: <span className="font-mono">{acq.nik}</span>
                                <br />
                                Wilayah: {acq.wilayah}
                                <br />
                                Oleh: {acq.nama_pengisi} ({acq.nim})
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
