/**
 * KelurahanTable — kelurahan breakdown list with search, sort, and progress bars
 * Extracted from App.jsx lines 1508–1641
 */
import { KEPLING_TARGET } from '../../constants/config';

export default function KelurahanTable({
    geoData,
    selectedGisKecamatan,
    gisSearchKelurahan,
    setGisSearchKelurahan,
    gisSortOrder,
    setGisSortOrder,
}) {
    return (
        <div className="brutal-card kelurahan-grid-container">
            <div className="brutal-card-header" style={{ marginBottom: '20px' }}>
                <h3 className="brutal-card-title">
                    Detail Capaian Per Kelurahan {selectedGisKecamatan ? `(${selectedGisKecamatan})` : '(Semua Wilayah)'}
                </h3>
            </div>

            <div className="kelurahan-search-bar">
                <input
                    type="text"
                    className="brutal-input"
                    placeholder="Cari Kelurahan berdasarkan nama..."
                    style={{ flexGrow: 1, minWidth: '220px', padding: '10px 15px' }}
                    value={gisSearchKelurahan}
                    onChange={(e) => setGisSearchKelurahan(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        className={`brutal-btn ${gisSortOrder === 'acquisitions' ? 'cyan' : 'white'}`}
                        onClick={() => setGisSortOrder('acquisitions')}
                        style={{ fontSize: '0.8rem', padding: '10px 15px', fontWeight: 800 }}
                    >
                        Urutkan Capaian
                    </button>
                    <button
                        type="button"
                        className={`brutal-btn ${gisSortOrder === 'coverage' ? 'cyan' : 'white'}`}
                        onClick={() => setGisSortOrder('coverage')}
                        style={{ fontSize: '0.8rem', padding: '10px 15px', fontWeight: 800 }}
                    >
                        Urutkan Cakupan Kepling
                    </button>
                </div>
            </div>

            <div className="kelurahan-list-scroll">
                {(() => {
                    let list = [];
                    const targetKecs = selectedGisKecamatan ? [selectedGisKecamatan] : Object.keys(geoData);
                    targetKecs.forEach(kKey => {
                        const kData = geoData[kKey];
                        Object.keys(kData.kelurahans).forEach(kelKey => {
                            list.push({ ...kData.kelurahans[kelKey], kecamatan: kKey });
                        });
                    });

                    if (gisSearchKelurahan) {
                        const q = gisSearchKelurahan.toLowerCase();
                        list = list.filter(item => item.name.toLowerCase().includes(q));
                    }

                    if (gisSortOrder === 'acquisitions') {
                        list.sort((a, b) => b.totalAcquisitions - a.totalAcquisitions);
                    } else if (gisSortOrder === 'coverage') {
                        list.sort((a, b) => {
                            const pctA = a.filledKeplings / (a.totalKeplings || 1);
                            const pctB = b.filledKeplings / (b.totalKeplings || 1);
                            return pctB - pctA;
                        });
                    }

                    if (list.length === 0) {
                        return (
                            <div style={{ padding: '30px', textAlign: 'center', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Tidak ada Kelurahan yang cocok dengan pencarian Anda.
                            </div>
                        );
                    }

                    const maxAcq = Math.max(...list.map(x => x.totalAcquisitions), 1);

                    return list.map((item, index) => {
                        const isTopPerformer = item.totalAcquisitions === maxAcq && item.totalAcquisitions > 0;
                        const coveragePct = Math.round((item.filledKeplings / (item.totalKeplings || 1)) * 100);
                        const kelTarget = item.totalKeplings * KEPLING_TARGET;
                        const acqPct = Math.min(Math.round((item.totalAcquisitions / kelTarget) * 100), 100);
                        const isKelTargetAchieved = item.totalAcquisitions >= kelTarget;

                        return (
                            <div
                                className={`kelurahan-list-item ${isTopPerformer ? 'top-performer' : ''} fade-in`}
                                key={`${item.kecamatan}-${item.name}-${index}`}
                                style={{ animationDelay: `${index * 0.03}s` }}
                            >
                                <div className="kelurahan-info-left" style={{ minWidth: '180px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="kelurahan-name">{item.name}</span>
                                        {isTopPerformer && (
                                            <span className="brutal-badge" style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: 'var(--primary)', color: 'var(--text-main)', border: 'var(--border-thin)', fontWeight: 900 }}>
                                                JUARA 🏆
                                            </span>
                                        )}
                                    </div>
                                    <span className="kelurahan-sub-meta">Kecamatan: {item.kecamatan}</span>
                                </div>

                                <div style={{ flexGrow: 1, maxWidth: '260px', margin: '0 20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 900 }}>
                                        <span>Target: {item.totalAcquisitions} / {kelTarget}</span>
                                        <span>{acqPct}%</span>
                                    </div>
                                    <div className="table-progress-bar" style={{ marginTop: 0 }}>
                                        <div
                                            className="table-progress-fill"
                                            style={{
                                                width: `${acqPct}%`,
                                                backgroundColor: isKelTargetAchieved ? 'var(--success)' : acqPct >= 50 ? 'var(--primary)' : 'var(--accent-orange)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="kelurahan-badge-group">
                                    <span className="brutal-badge info" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800 }}>
                                        {item.filledKeplings} / {item.totalKeplings} Kepling ({coveragePct}% Terisi)
                                    </span>
                                    <span className={`brutal-badge ${isKelTargetAchieved ? 'success' : 'warning'}`} style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 900, border: 'var(--border-thin)' }}>
                                        {isKelTargetAchieved ? 'Target Tercapai 🎉' : `Kurang ${kelTarget - item.totalAcquisitions}`}
                                    </span>
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
}
