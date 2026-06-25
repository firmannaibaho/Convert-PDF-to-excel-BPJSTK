/**
 * KeplingAcquisitionModal
 * Extracted from App.jsx lines 2639–2704
 */
import { X, Download } from 'lucide-react';

export default function KeplingAcquisitionModal({ data, onClose, onExport }) {
    if (!data) return null;
    const { kepling, acquisitions } = data;

    return (
        <div className="brutal-modal-backdrop" onClick={onClose}>
            <div className="brutal-modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
                <div className="brutal-modal-header" style={{ backgroundColor: 'var(--primary)' }}>
                    <h3 className="brutal-modal-title">
                        Data Akuisisi: {kepling.nama_kepling || 'Kepling Belum Terisi'}
                    </h3>
                    <button className="brutal-modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="brutal-modal-body" style={{ maxHeight: '65vh' }}>
                    <div style={{ background: '#fdfbf2', border: 'var(--border-thin)', padding: '12px 18px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 800 }}>
                        📍 Wilayah: Kec. {kepling.kecamatan} - Kel. {kepling.kelurahan} - Lingk. {kepling.lingkungan}
                        <br />
                        👤 Pembina Wilayah: {kepling.pembina || 'Belum di-assign'}
                    </div>

                    <div className="brutal-table-container" style={{ margin: 0 }}>
                        <table className="brutal-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>No</th>
                                    <th>Nama Peserta (TK)</th>
                                    <th>NIK</th>
                                    <th>No Telepon</th>
                                    <th>Tgl Daftar</th>
                                    <th>Waktu Input</th>
                                    <th>Operator</th>
                                </tr>
                            </thead>
                            <tbody>
                                {acquisitions.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td style={{ fontWeight: 850 }}>{item.nama_tk}</td>
                                        <td className="font-mono">{item.nik}</td>
                                        <td>{item.no_telp || '-'}</td>
                                        <td>{item.tgl_daftar || '-'}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{item.tanggal_input} {item.jam_input}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{item.nama_pengisi} ({item.nim})</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="brutal-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        className="brutal-btn"
                        style={{ backgroundColor: 'var(--success)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={onExport}
                    >
                        <Download size={16} />
                        Ekspor Excel
                    </button>
                    <button className="brutal-btn white" onClick={onClose}>Tutup</button>
                </div>
            </div>
        </div>
    );
}
