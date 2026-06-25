/**
 * EditKeplingModal
 * Extracted from App.jsx lines 2283–2420
 * Props: kepling, uniquePembinas, onClose, onSubmit, isUpdating
 */
import { X } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

export default function EditKeplingModal({ kepling, uniquePembinas, onClose, onSubmit, isUpdating, onChange }) {
    if (!kepling) return null;

    return (
        <div className="brutal-modal-backdrop" onClick={onClose}>
            <div className="brutal-modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={onSubmit}>
                    <div className="brutal-modal-header" style={{ backgroundColor: 'var(--accent-purple)' }}>
                        <h3 className="brutal-modal-title">
                            Edit Kepling: {kepling.kecamatan} - {kepling.kelurahan} - Lingk. {kepling.lingkungan}
                        </h3>
                        <button type="button" className="brutal-modal-close" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="brutal-modal-body" style={{ maxHeight: '65vh' }}>
                        <div className="brutal-form-section" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px 25px' }}>

                            <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Pembina Wilayah</label>
                                <select
                                    className="brutal-input"
                                    value={kepling.pembina || ''}
                                    onChange={(e) => onChange('pembina', e.target.value)}
                                    style={{ padding: '11px' }}
                                >
                                    <option value="">Pilih Pembina</option>
                                    {uniquePembinas.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Kepling</label>
                                <input type="text" className="brutal-input" value={kepling.nama_kepling || ''} onChange={(e) => onChange('nama_kepling', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>NIK Kepling</label>
                                <input type="text" className="brutal-input font-mono" value={kepling.nik || ''} onChange={(e) => onChange('nik', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>No HP Kepling</label>
                                <input type="text" className="brutal-input" value={kepling.no_hp || ''} onChange={(e) => onChange('no_hp', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Email Kepling</label>
                                <input type="text" className="brutal-input" value={kepling.email || ''} onChange={(e) => onChange('email', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Status Akun Perisai</label>
                                <select className="brutal-input" value={kepling.akun_perisai || ''} onChange={(e) => onChange('akun_perisai', e.target.value)} style={{ padding: '11px' }}>
                                    <option value="">Pilih Status</option>
                                    <option value="YA">YA (Aktif/Proses)</option>
                                    <option value="TIDAK">TIDAK</option>
                                </select>
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>ID Akun Perisai (Kode Perisai)</label>
                                <input type="text" className="brutal-input font-mono" value={kepling.id_akun_perisai || ''} onChange={(e) => onChange('id_akun_perisai', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Akun Perisai</label>
                                <input type="text" className="brutal-input" value={kepling.nama_akun_perisai || ''} onChange={(e) => onChange('nama_akun_perisai', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Bank</label>
                                <input type="text" className="brutal-input" value={kepling.nama_bank || ''} onChange={(e) => onChange('nama_bank', e.target.value)} />
                            </div>
                            <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nomor Rekening Bank</label>
                                <input type="text" className="brutal-input font-mono" value={kepling.nomor_rekening || ''} onChange={(e) => onChange('nomor_rekening', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="brutal-modal-footer">
                        <button type="button" className="brutal-btn white" style={{ marginRight: '10px' }} onClick={onClose}>
                            Batal
                        </button>
                        <button type="submit" className="brutal-btn success" disabled={isUpdating}>
                            {isUpdating ? <LoadingSpinner /> : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
