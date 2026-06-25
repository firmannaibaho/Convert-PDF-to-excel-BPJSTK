/**
 * PembinaDetailModal
 * Extracted from App.jsx lines 2235–2281
 * Props: pembina (object), onClose (fn)
 */
import { X } from 'lucide-react';

export default function PembinaDetailModal({ pembina, onClose }) {
    if (!pembina) return null;

    return (
        <div className="brutal-modal-backdrop" onClick={onClose}>
            <div className="brutal-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="brutal-modal-header">
                    <h3 className="brutal-modal-title">
                        Detail Akuisisi: {pembina.pembina}
                    </h3>
                    <button className="brutal-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="brutal-modal-body">
                    <div className="brutal-table-container" style={{ margin: 0 }}>
                        <table className="brutal-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>No</th>
                                    <th>Nama TK</th>
                                    <th>NIK</th>
                                    <th>Wilayah</th>
                                    <th>Tgl Daftar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pembina.acquisitions.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td style={{ fontWeight: 850 }}>{item.nama_tk}</td>
                                        <td className="font-mono">{item.nik}</td>
                                        <td>{item.wilayah}</td>
                                        <td>{item.tgl_daftar}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="brutal-modal-footer">
                    <button className="brutal-btn white" onClick={onClose}>
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
