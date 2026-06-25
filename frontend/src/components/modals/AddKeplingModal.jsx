/**
 * AddKeplingModal
 * Extracted from App.jsx lines 2422–2637
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AddKeplingModal({
    vacantKecamatans,
    uniquePembinas,
    getVacantKelurahansForKecamatan,
    getVacantLingkungsForKelurahan,
    onClose,
    onSubmit,
    isUpdating,
}) {
    const defaultState = {
        pembina: '', kecamatan: '', kelurahan: '', lingkungan: '',
        nama_kepling: '', nik: '', no_hp: '', email: '',
        akun_perisai: 'TIDAK', id_akun_perisai: '', nama_akun_perisai: '',
        nama_bank: 'CIMB NIAGA', nomor_rekening: ''
    };
    const [form, setForm] = useState(defaultState);
    const [customLingkungan, setCustomLingkungan] = useState('');
    const [isCustomLingkungan, setIsCustomLingkungan] = useState(false);

    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.kecamatan || !form.kelurahan) { alert('Kecamatan dan Kelurahan wajib diisi!'); return; }
        const finalLingkungan = isCustomLingkungan ? customLingkungan : form.lingkungan;
        if (!finalLingkungan) { alert('Lingkungan wajib diisi!'); return; }
        onSubmit({ ...form, lingkungan: finalLingkungan });
    };

    return (
        <div className="brutal-modal-backdrop" onClick={onClose}>
            <div className="brutal-modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="brutal-modal-header" style={{ backgroundColor: 'var(--primary)' }}>
                        <h3 className="brutal-modal-title">Isi Detail Kepling Kosong</h3>
                        <button type="button" className="brutal-modal-close" onClick={onClose}><X size={18} /></button>
                    </div>

                    <div className="brutal-modal-body" style={{ maxHeight: '65vh' }}>
                        <div style={{ background: '#f0ede4', border: 'var(--border-thin)', padding: '10px 15px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 800 }}>
                            📝 Pilih wilayah kosong di bawah ini untuk mengisi detail profil Kepling-nya.
                        </div>

                        <div className="brutal-form-section" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px 25px' }}>

                            {/* Kecamatan */}
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Kecamatan *</label>
                                <select className="brutal-input" value={form.kecamatan} onChange={(e) => set('kecamatan', e.target.value) || setForm(p => ({ ...p, kelurahan: '', lingkungan: '' }))} required style={{ padding: '11px' }}>
                                    <option value="">Pilih Kecamatan</option>
                                    {vacantKecamatans.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>

                            {/* Kelurahan */}
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Kelurahan *</label>
                                <select className="brutal-input" value={form.kelurahan} onChange={(e) => setForm(p => ({ ...p, kelurahan: e.target.value, lingkungan: '' }))} disabled={!form.kecamatan} required style={{ padding: '11px' }}>
                                    <option value="">Pilih Kelurahan</option>
                                    {getVacantKelurahansForKecamatan(form.kecamatan).map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>

                            {/* Lingkungan */}
                            <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Lingkungan / Wilayah *</label>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={isCustomLingkungan} onChange={(e) => setIsCustomLingkungan(e.target.checked)} />
                                        Input Manual (Tulis Sendiri)
                                    </label>
                                </div>
                                {isCustomLingkungan ? (
                                    <input type="text" className="brutal-input font-mono" placeholder="Contoh: I, II, 001, atau nama wilayah" value={customLingkungan} onChange={(e) => setCustomLingkungan(e.target.value)} required />
                                ) : (
                                    <select className="brutal-input" value={form.lingkungan} onChange={(e) => set('lingkungan', e.target.value)} disabled={!form.kelurahan} required style={{ padding: '11px' }}>
                                        <option value="">Pilih Lingkungan</option>
                                        {getVacantLingkungsForKelurahan(form.kecamatan, form.kelurahan).map(l => (
                                            <option key={l} value={l}>Lingkungan {l}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Pembina */}
                            <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Pembina Wilayah *</label>
                                <select className="brutal-input" value={form.pembina} onChange={(e) => set('pembina', e.target.value)} required style={{ padding: '11px' }}>
                                    <option value="">Pilih Pembina</option>
                                    {uniquePembinas.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Kepling</label>
                                <input type="text" className="brutal-input" value={form.nama_kepling} onChange={(e) => set('nama_kepling', e.target.value)} required />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>NIK Kepling</label>
                                <input type="text" className="brutal-input font-mono" value={form.nik} onChange={(e) => set('nik', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>No HP Kepling</label>
                                <input type="text" className="brutal-input" value={form.no_hp} onChange={(e) => set('no_hp', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Email Kepling</label>
                                <input type="text" className="brutal-input" value={form.email} onChange={(e) => set('email', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Status Akun Perisai</label>
                                <select className="brutal-input" value={form.akun_perisai} onChange={(e) => set('akun_perisai', e.target.value)} style={{ padding: '11px' }}>
                                    <option value="TIDAK">TIDAK</option>
                                    <option value="YA">YA (Aktif/Proses)</option>
                                </select>
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>ID Akun Perisai (Kode Perisai)</label>
                                <input type="text" className="brutal-input font-mono" value={form.id_akun_perisai} onChange={(e) => set('id_akun_perisai', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Akun Perisai</label>
                                <input type="text" className="brutal-input" value={form.nama_akun_perisai} onChange={(e) => set('nama_akun_perisai', e.target.value)} />
                            </div>
                            <div className="brutal-field">
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Bank</label>
                                <input type="text" className="brutal-input" value={form.nama_bank} onChange={(e) => set('nama_bank', e.target.value)} />
                            </div>
                            <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                                <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nomor Rekening Bank</label>
                                <input type="text" className="brutal-input font-mono" value={form.nomor_rekening} onChange={(e) => set('nomor_rekening', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="brutal-modal-footer">
                        <button type="button" className="brutal-btn white" style={{ marginRight: '10px' }} onClick={onClose}>Batal</button>
                        <button type="submit" className="brutal-btn success" disabled={isUpdating}>
                            {isUpdating ? <LoadingSpinner /> : 'Simpan Detail'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
