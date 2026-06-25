/**
 * GISDashboard — full GIS view with Leaflet/SVG map, stat panel, tooltip
 * Extracted from App.jsx lines 1249–1668
 */
import { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useGIS } from '../../hooks/useGIS';
import KelurahanTable from './KelurahanTable';

export default function GISDashboard({ geoData, totalAcquisitions, filledKeplingCount, keplingsTotalCount, totalActivePerisais }) {
    const {
        selectedGisKecamatan, setSelectedGisKecamatan,
        gisSearchKelurahan, setGisSearchKelurahan,
        gisSortOrder, setGisSortOrder,
        gisHoveredKecamatan,
        tooltipPos,
        mapRef,
        handleGisMapHover, handleGisMapMouseMove, handleGisMapLeave, handleGisMapClick,
        initLeafletMap,
    } = useGIS();

    useEffect(() => {
        const cleanup = initLeafletMap(true);
        return () => {
            if (cleanup) cleanup();
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fade-in">
            {/* GIS Container: Map & Summary Detail Panel */}
            <div className="gis-container">
                {/* Map Box */}
                <div className="brutal-card gis-map-card" style={{ width: '100%' }}>
                    <div className="brutal-card-header" style={{ marginBottom: '20px', width: '100%', borderBottom: 'none', paddingBottom: 0 }}>
                        <h3 className="brutal-card-title">Peta Real-World Wilayah Kerja Medan</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '4px' }}>
                            {window.L
                                ? 'Gunakan mouse untuk zoom & pan. Sorot poligon wilayah untuk data cepat, klik untuk drilldown.'
                                : 'Offline Fallback: Peta Interaktif Wilayah Binaan (Leaflet tidak termuat).'}
                        </p>
                    </div>

                    {/* Conditional: Leaflet Map or Fallback SVG */}
                    {!window.L ? (
                        <svg viewBox="0 0 400 380" className="gis-map-svg">
                            <defs>
                                <pattern id="gis-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <circle cx="10" cy="10" r="1.5" fill="#e2e8f0" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#gis-grid)" rx="8" stroke="#1a1a1a" strokeWidth="2.5" strokeDasharray="5,5" />
                            <path d="M 97,280 L 237,210 L 272,120" stroke="#1a1a1a" strokeWidth="2" strokeDasharray="6,6" fill="none" opacity="0.3" />

                            <path
                                d="M 60,200 L 160,240 L 130,350 L 40,310 Z"
                                className={`gis-map-path ${selectedGisKecamatan === 'MEDAN TUNTUNGAN' ? 'active' : ''}`}
                                fill={selectedGisKecamatan === 'MEDAN TUNTUNGAN' || gisHoveredKecamatan === 'MEDAN TUNTUNGAN' ? 'var(--accent-cyan)' : '#e0f2fe'}
                                onClick={() => handleGisMapClick('MEDAN TUNTUNGAN')}
                                onMouseEnter={(e) => handleGisMapHover('MEDAN TUNTUNGAN', e)}
                                onMouseMove={handleGisMapMouseMove}
                                onMouseLeave={handleGisMapLeave}
                            />
                            <text x="97" y="280" className="gis-map-text">Tuntungan</text>

                            <path
                                d="M 200,150 L 320,170 L 270,260 L 160,240 Z"
                                className={`gis-map-path ${selectedGisKecamatan === 'MEDAN KOTA' ? 'active' : ''}`}
                                fill={selectedGisKecamatan === 'MEDAN KOTA' || gisHoveredKecamatan === 'MEDAN KOTA' ? 'var(--primary)' : '#fef9c3'}
                                onClick={() => handleGisMapClick('MEDAN KOTA')}
                                onMouseEnter={(e) => handleGisMapHover('MEDAN KOTA', e)}
                                onMouseMove={handleGisMapMouseMove}
                                onMouseLeave={handleGisMapLeave}
                            />
                            <text x="237" y="210" className="gis-map-text">Medan Kota</text>

                            <path
                                d="M 220,60 L 350,80 L 320,170 L 200,150 Z"
                                className={`gis-map-path ${selectedGisKecamatan === 'MEDAN TIMUR' ? 'active' : ''}`}
                                fill={selectedGisKecamatan === 'MEDAN TIMUR' || gisHoveredKecamatan === 'MEDAN TIMUR' ? 'var(--accent-purple)' : '#f3e8ff'}
                                onClick={() => handleGisMapClick('MEDAN TIMUR')}
                                onMouseEnter={(e) => handleGisMapHover('MEDAN TIMUR', e)}
                                onMouseMove={handleGisMapMouseMove}
                                onMouseLeave={handleGisMapLeave}
                            />
                            <text x="272" y="120" className="gis-map-text">M. Timur</text>
                        </svg>
                    ) : (
                        <div id="gis-map" style={{ width: '100%', height: '380px', position: 'relative' }} />
                    )}

                    {selectedGisKecamatan && (
                        <button
                            className="brutal-btn white"
                            onClick={() => setSelectedGisKecamatan(null)}
                            style={{ marginTop: '20px', width: '100%', maxWidth: '240px', fontWeight: 900 }}
                        >
                            Reset Pilih Semua Wilayah
                        </button>
                    )}
                </div>

                {/* District stats drilldown panel */}
                <div className="gis-detail-panel">
                    {selectedGisKecamatan ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontWeight: 950, textTransform: 'uppercase', fontSize: '1.4rem', margin: 0 }}>
                                    📍 {selectedGisKecamatan}
                                </h3>
                                <button
                                    className="brutal-badge"
                                    style={{ backgroundColor: 'var(--primary)', cursor: 'pointer', padding: '4px 10px', fontWeight: 800, border: 'var(--border-thin)' }}
                                    onClick={() => setSelectedGisKecamatan(null)}
                                >
                                    Lihat Semua
                                </button>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '4px' }}>
                                Detail tingkat cakupan dan akuisisi perisai di wilayah terpilih
                            </p>

                            <div className="gis-grid-layout" style={{ marginTop: '20px' }}>
                                <div className="gis-mini-card">
                                    <span className="gis-mini-card-label">Total Akuisisi</span>
                                    <span className="gis-mini-card-value" style={{ color: 'var(--accent-orange)' }}>
                                        {geoData[selectedGisKecamatan]?.totalAcquisitions || 0}
                                    </span>
                                </div>
                                <div className="gis-mini-card">
                                    <span className="gis-mini-card-label">Kepling Terisi</span>
                                    <span className="gis-mini-card-value">
                                        {geoData[selectedGisKecamatan]?.filledKeplings || 0} / {geoData[selectedGisKecamatan]?.totalKeplings || 0}
                                    </span>
                                </div>
                                <div className="gis-mini-card">
                                    <span className="gis-mini-card-label">Perisai Aktif</span>
                                    <span className="gis-mini-card-value" style={{ color: '#10b981' }}>
                                        {geoData[selectedGisKecamatan]?.activePerisais || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="gis-stat-meter-container">
                                {(() => {
                                    const total = geoData[selectedGisKecamatan]?.totalKeplings || 1;
                                    const filled = geoData[selectedGisKecamatan]?.filledKeplings || 0;
                                    const pct = Math.round((filled / total) * 100);
                                    return (
                                        <div className="gis-stat-meter-row">
                                            <div className="gis-stat-meter-label"><span>Rasio Cakupan Kepling</span><span>{pct}%</span></div>
                                            <div className="gis-meter-bar"><div className="gis-meter-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--primary)' }} /></div>
                                        </div>
                                    );
                                })()}
                                {(() => {
                                    const total = geoData[selectedGisKecamatan]?.totalKeplings || 1;
                                    const active = geoData[selectedGisKecamatan]?.activePerisais || 0;
                                    const pct = Math.round((active / total) * 100);
                                    return (
                                        <div className="gis-stat-meter-row">
                                            <div className="gis-stat-meter-label"><span>Rasio Akun Perisai Aktif</span><span>{pct}%</span></div>
                                            <div className="gis-meter-bar"><div className="gis-meter-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--accent-purple)' }} /></div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 style={{ fontWeight: 950, textTransform: 'uppercase', fontSize: '1.4rem', margin: 0 }}>🌍 Semua Wilayah Binaan</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '4px' }}>
                                Ringkasan pencapaian integrasi tiga Kecamatan di Kota Medan
                            </p>

                            <div className="gis-grid-layout" style={{ marginTop: '20px' }}>
                                <div className="gis-mini-card">
                                    <span className="gis-mini-card-label">Total Akuisisi</span>
                                    <span className="gis-mini-card-value" style={{ color: 'var(--accent-orange)' }}>{totalAcquisitions}</span>
                                </div>
                                <div className="gis-mini-card">
                                    <span className="gis-mini-card-label">Kepling Terisi</span>
                                    <span className="gis-mini-card-value">{filledKeplingCount} / {keplingsTotalCount}</span>
                                </div>
                                <div className="gis-mini-card">
                                    <span className="gis-mini-card-label">Perisai Aktif</span>
                                    <span className="gis-mini-card-value" style={{ color: '#10b981' }}>{totalActivePerisais}</span>
                                </div>
                            </div>

                            <div className="gis-stat-meter-container">
                                {(() => {
                                    const total = keplingsTotalCount || 1;
                                    const pct = Math.round((filledKeplingCount / total) * 100);
                                    return (
                                        <div className="gis-stat-meter-row">
                                            <div className="gis-stat-meter-label"><span>Cakupan Kepling Keseluruhan</span><span>{pct}%</span></div>
                                            <div className="gis-meter-bar"><div className="gis-meter-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--primary)' }} /></div>
                                        </div>
                                    );
                                })()}
                                {(() => {
                                    const total = keplingsTotalCount || 1;
                                    const pct = Math.round((totalActivePerisais / total) * 100);
                                    return (
                                        <div className="gis-stat-meter-row">
                                            <div className="gis-stat-meter-label"><span>Tingkat Perisai Aktif Nasional</span><span>{pct}%</span></div>
                                            <div className="gis-meter-bar"><div className="gis-meter-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--accent-purple)' }} /></div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </>
                    )}

                    {/* Density chart */}
                    <div className="gis-density-chart">
                        <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem', margin: 0 }}>
                            📊 Kepadatan Akuisisi (Rata-rata per Kepling)
                        </h4>
                        {Object.keys(geoData).map((kKey) => {
                            const kData = geoData[kKey];
                            const totalKeplings = kData.totalKeplings || 1;
                            const density = Number((kData.totalAcquisitions / totalKeplings).toFixed(2));
                            const densities = Object.values(geoData).map(kd => kd.totalAcquisitions / (kd.totalKeplings || 1));
                            const maxVal = Math.max(...densities, 1);
                            const widthPct = Math.min((density / maxVal) * 100, 100);
                            return (
                                <div className="gis-density-bar-row" key={kKey}>
                                    <div className="gis-density-bar-label">{kKey}</div>
                                    <div className="gis-density-bar-track">
                                        <div
                                            className="gis-density-bar-fill"
                                            style={{
                                                width: `${widthPct}%`,
                                                backgroundColor: kKey === 'MEDAN KOTA' ? 'var(--primary)' : kKey === 'MEDAN TIMUR' ? 'var(--accent-purple)' : 'var(--accent-cyan)'
                                            }}
                                        />
                                    </div>
                                    <div className="gis-density-bar-val">{density} / slot</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Kelurahan breakdown table */}
            <KelurahanTable
                geoData={geoData}
                selectedGisKecamatan={selectedGisKecamatan}
                gisSearchKelurahan={gisSearchKelurahan}
                setGisSearchKelurahan={setGisSearchKelurahan}
                gisSortOrder={gisSortOrder}
                setGisSortOrder={setGisSortOrder}
            />

            {/* Hover tooltip */}
            {gisHoveredKecamatan && tooltipPos && (
                <div className="gis-tooltip" style={{ left: `${tooltipPos.x + 15}px`, top: `${tooltipPos.y + 15}px` }}>
                    <div style={{ fontWeight: 950, fontSize: '0.85rem' }}>{gisHoveredKecamatan}</div>
                    <hr style={{ border: 'none', borderBottom: '2px solid #1a1a1a', margin: '6px 0' }} />
                    <div className="gis-tooltip-row"><span>Akuisisi:</span><span style={{ fontWeight: 900 }}>{geoData[gisHoveredKecamatan]?.totalAcquisitions || 0}</span></div>
                    <div className="gis-tooltip-row"><span>Kepling:</span><span style={{ fontWeight: 900 }}>{geoData[gisHoveredKecamatan]?.filledKeplings || 0} / {geoData[gisHoveredKecamatan]?.totalKeplings || 0}</span></div>
                    <div className="gis-tooltip-row"><span>Perisai:</span><span style={{ fontWeight: 900 }}>{geoData[gisHoveredKecamatan]?.activePerisais || 0} Aktif</span></div>
                </div>
            )}
        </div>
    );
}
