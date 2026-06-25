/**
 * KeplingPage
 * Extracted from App.jsx renderKeplingView() + CRUD handlers (lines 610–714, 1811–2087)
 */
import { useState, useCallback } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useKepling } from '../hooks/useKepling';
import { updateKepling, createKepling, deleteKepling } from '../services/api';
import { exportKeplingAcquisitionsToExcel } from '../utils/excelHelper';
import EditKeplingModal from '../components/modals/EditKeplingModal';
import AddKeplingModal from '../components/modals/AddKeplingModal';
import KeplingAcquisitionModal from '../components/modals/KeplingAcquisitionModal';
import { PAGE_SIZE, KEPLING_TARGET } from '../constants/config';

export default function KeplingPage({ keplings, allAcquisitions, onRefresh }) {
    const [selectedKeplingForEdit, setSelectedKeplingForEdit] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedKeplingForAcquisitions, setSelectedKeplingForAcquisitions] = useState(null);
    const [keplingUpdating, setKeplingUpdating] = useState(false);

    const hook = useKepling(keplings);

    // --- Helpers ---
    const getAcquisitionsForKepling = useCallback((k) => {
        const kec = (k.kecamatan || '').trim().toUpperCase();
        const kel = (k.kelurahan || '').trim().toUpperCase();
        const lingk = (k.lingkungan || '').trim().toUpperCase();
        const regionKey = `${kec}-${kel}-${lingk}`;
        return allAcquisitions.filter(acq => (acq.wilayah || '').trim().toUpperCase() === regionKey);
    }, [allAcquisitions]);

    // --- CRUD Handlers ---
    const handleUpdateKepling = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedKeplingForEdit) return;
        setKeplingUpdating(true);
        try {
            await updateKepling(selectedKeplingForEdit);
            alert('Berhasil memperbarui detail Kepling!');
            setSelectedKeplingForEdit(null);
            await onRefresh();
        } catch (err) {
            alert(err.message);
        } finally {
            setKeplingUpdating(false);
        }
    }, [selectedKeplingForEdit, onRefresh]);

    const handleCreateKepling = useCallback(async (formData) => {
        setKeplingUpdating(true);
        try {
            await createKepling(formData);
            alert('Berhasil menyimpan detail Kepling baru!');
            setShowAddModal(false);
            await onRefresh();
        } catch (err) {
            alert(err.message);
        } finally {
            setKeplingUpdating(false);
        }
    }, [onRefresh]);

    const handleDeleteKepling = useCallback(async (kecamatan, kelurahan, lingkungan) => {
        if (!confirm(`Apakah Anda yakin ingin mengosongkan data Kepling di wilayah:\nKec. ${kecamatan} - Kel. ${kelurahan} - Lingk. ${lingkungan}?\n\nKategori wilayah ini akan tetap ada di CSV, namun data profil Kepling di dalamnya akan di-reset menjadi kosong.`)) return;
        try {
            await deleteKepling(kecamatan, kelurahan, lingkungan);
            alert('Berhasil mengosongkan detail Kepling!');
            await onRefresh();
        } catch (err) {
            alert(err.message);
        }
    }, [onRefresh]);

    const filledKeplingCount = keplings.filter(k => k.nama_kepling && k.nama_kepling.trim() !== '-' && k.nama_kepling.trim() !== '').length;
    const vacantKeplingCount = keplings.length - filledKeplingCount;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Data &amp; Manajemen Kepling</h1>
                <p>Kelola detail kepling, akun perisai, rekening bank, dan kontak per wilayah binaan</p>
            </div>

            {/* Filter Bar */}
            <div className="brutal-card" style={{ marginBottom: '30px' }}>
                <div className="brutal-card-header" style={{ marginBottom: '20px', borderBottom: 'none', paddingBottom: 0 }}>
                    <h3 className="brutal-card-title">Filter &amp; Pencarian Wilayah</h3>
                    <button
                        className="brutal-btn" style={{ backgroundColor: 'var(--primary)', padding: '10px 18px' }}
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={16} /> Isi Kepling Kosong
                    </button>
                </div>

                {/* Status Tabs */}
                <div className="brutal-tabs" style={{ marginBottom: '20px', borderBottom: 'none', paddingBottom: 0 }}>
                    <button type="button" className={`brutal-tab ${hook.filterStatus === 'all' ? 'active' : ''}`} onClick={() => hook.setFilterStatus('all')} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                        Semua Wilayah ({keplings.length})
                    </button>
                    <button type="button" className={`brutal-tab ${hook.filterStatus === 'filled' ? 'active' : ''}`} onClick={() => hook.setFilterStatus('filled')} style={{ padding: '8px 18px', fontSize: '0.85rem', backgroundColor: hook.filterStatus === 'filled' ? 'var(--primary)' : '' }}>
                        Terisi ({filledKeplingCount})
                    </button>
                    <button type="button" className={`brutal-tab ${hook.filterStatus === 'vacant' ? 'active' : ''}`} onClick={() => hook.setFilterStatus('vacant')} style={{ padding: '8px 18px', fontSize: '0.85rem', backgroundColor: hook.filterStatus === 'vacant' ? 'var(--primary)' : '' }}>
                        Kosong / Belum Terisi ({vacantKeplingCount})
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* Dropdown filters */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div className="brutal-field">
                            <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Nama Pembina</label>
                            <select className="brutal-input" value={hook.filterPembina} onChange={(e) => hook.setFilterPembina(e.target.value)} style={{ padding: '10px' }}>
                                <option value="">Semua Pembina</option>
                                {hook.uniquePembinas.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="brutal-field">
                            <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Kecamatan</label>
                            <select className="brutal-input" value={hook.filterKecamatan} onChange={(e) => hook.setFilterKecamatan(e.target.value)} style={{ padding: '10px' }}>
                                <option value="">Semua Kecamatan</option>
                                {hook.uniqueKecamatans.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div className="brutal-field">
                            <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Kelurahan</label>
                            <select className="brutal-input" value={hook.filterKelurahan} onChange={(e) => hook.setFilterKelurahan(e.target.value)} disabled={!hook.filterKecamatan} style={{ padding: '10px' }}>
                                <option value="">Semua Kelurahan</option>
                                {hook.uniqueKelurahans.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div className="brutal-field">
                            <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Lingkungan</label>
                            <select className="brutal-input" value={hook.filterLingkungan} onChange={(e) => hook.setFilterLingkungan(e.target.value)} disabled={!hook.filterKelurahan} style={{ padding: '10px' }}>
                                <option value="">Semua Lingkungan</option>
                                {hook.uniqueLingkungans.map(l => <option key={l} value={l}>Lingk. {l}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Search + Reset */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="brutal-field" style={{ flexGrow: 1, minWidth: '250px' }}>
                            <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Pencarian Kata Kunci</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="text" className="brutal-input" style={{ width: '100%', paddingRight: '45px' }}
                                    placeholder="Ketik nama kepling, NIK, kode perisai..."
                                    value={hook.keplingSearch} onChange={(e) => hook.setKeplingSearch(e.target.value)}
                                />
                                <Search size={18} style={{ position: 'absolute', right: '15px', color: 'var(--text-muted)' }} />
                            </div>
                        </div>
                        <button
                            className="brutal-btn white"
                            style={{ height: '48px', padding: '0 20px', textTransform: 'uppercase', fontWeight: 900 }}
                            onClick={hook.resetFilters}
                        >
                            Reset Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Kepling Table */}
            <div className="brutal-card">
                {hook.filteredKeplings.length === 0 ? (
                    <div className="empty-state"><p>Tidak ada data Kepling yang cocok dengan filter pencarian.</p></div>
                ) : (
                    <div>
                        <div className="brutal-table-container">
                            <table className="brutal-table">
                                <thead>
                                    <tr>
                                        <th>Kecamatan</th>
                                        <th>Kelurahan</th>
                                        <th>Lingk</th>
                                        <th>Nama Kepling</th>
                                        <th>Pembina Wilayah</th>
                                        <th>Status Perisai</th>
                                        <th>Kode Perisai</th>
                                        <th>Jumlah Akuisisi (Target {KEPLING_TARGET})</th>
                                        <th style={{ textAlign: 'center', width: '200px' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hook.paginatedKeplings.map((row, i) => {
                                        const isVacant = !row.nama_kepling || row.nama_kepling.trim() === '' || row.nama_kepling.trim() === '-';
                                        const kAcquisitions = getAcquisitionsForKepling(row);
                                        return (
                                            <tr key={i} style={{ backgroundColor: isVacant ? '#faf9f5' : '' }}>
                                                <td style={{ fontSize: '0.85rem' }}>{row.kecamatan}</td>
                                                <td style={{ fontSize: '0.85rem' }}>{row.kelurahan}</td>
                                                <td className="font-mono">{row.lingkungan}</td>
                                                <td style={{ fontWeight: 800 }}>
                                                    {isVacant ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500 }}>(Belum Terisi)</span> : row.nama_kepling}
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>{row.pembina || '-'}</td>
                                                <td>
                                                    <span className={`brutal-badge ${row.akun_perisai === 'YA' ? 'success' : 'danger'}`}>{row.akun_perisai || 'TIDAK'}</span>
                                                </td>
                                                <td className="font-mono">{row.id_akun_perisai || '-'}</td>
                                                <td>
                                                    {kAcquisitions.length > 0 ? (
                                                        <button
                                                            className={`brutal-badge ${kAcquisitions.length >= KEPLING_TARGET ? 'success' : 'warning'}`}
                                                            style={{ cursor: 'pointer', border: 'var(--border-thin)', padding: '4px 10px', fontWeight: 900, display: 'inline-block' }}
                                                            onClick={() => setSelectedKeplingForAcquisitions({ kepling: row, acquisitions: kAcquisitions })}
                                                            title="Klik untuk lihat detail data akuisisi"
                                                        >
                                                            {kAcquisitions.length >= KEPLING_TARGET ? `Tercapai 🏆 (${kAcquisitions.length})` : `${kAcquisitions.length} / ${KEPLING_TARGET}`}
                                                        </button>
                                                    ) : (
                                                        <span className="brutal-badge" style={{ backgroundColor: '#fca5a5', color: '#1a1a1a', border: 'var(--border-thin)', padding: '4px 10px', display: 'inline-block', fontWeight: 900 }}>
                                                            0 / {KEPLING_TARGET}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button className="brutal-btn cyan" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => setSelectedKeplingForEdit({ ...row })}>Edit</button>
                                                        <button className="brutal-btn orange" style={{ padding: '6px 10px', fontSize: '0.8rem', backgroundColor: '#ef4444', color: '#fff' }} onClick={() => handleDeleteKepling(row.kecamatan, row.kelurahan, row.lingkungan)} disabled={isVacant}>Hapus</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {hook.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginTop: '10px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                                    Menampilkan {hook.paginatedKeplings.length} dari {hook.filteredKeplings.length} Kepling
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <button className="brutal-btn white" style={{ padding: '8px 12px' }} disabled={hook.keplingPage === 1} onClick={() => hook.setKeplingPage(prev => Math.max(prev - 1, 1))}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="font-mono" style={{ fontWeight: 800 }}>Halaman {hook.keplingPage} dari {hook.totalPages}</span>
                                    <button className="brutal-btn white" style={{ padding: '8px 12px' }} disabled={hook.keplingPage === hook.totalPages} onClick={() => hook.setKeplingPage(prev => Math.min(prev + 1, hook.totalPages))}>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedKeplingForEdit && (
                <EditKeplingModal
                    kepling={selectedKeplingForEdit}
                    uniquePembinas={hook.uniquePembinas}
                    onClose={() => setSelectedKeplingForEdit(null)}
                    onSubmit={handleUpdateKepling}
                    isUpdating={keplingUpdating}
                    onChange={(field, value) => setSelectedKeplingForEdit(prev => ({ ...prev, [field]: value }))}
                />
            )}

            {showAddModal && (
                <AddKeplingModal
                    vacantKecamatans={hook.vacantKecamatans}
                    uniquePembinas={hook.uniquePembinas}
                    getVacantKelurahansForKecamatan={hook.getVacantKelurahansForKecamatan}
                    getVacantLingkungsForKelurahan={hook.getVacantLingkungsForKelurahan}
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleCreateKepling}
                    isUpdating={keplingUpdating}
                />
            )}

            {selectedKeplingForAcquisitions && (
                <KeplingAcquisitionModal
                    data={selectedKeplingForAcquisitions}
                    onClose={() => setSelectedKeplingForAcquisitions(null)}
                    onExport={() => exportKeplingAcquisitionsToExcel(selectedKeplingForAcquisitions)}
                />
            )}
        </div>
    );
}
