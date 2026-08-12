/**
 * ExtractPage
 * Extracted from App.jsx renderExtract() (lines 1674–1809)
 */
import { UploadCloud, FileText, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useUpload } from '../hooks/useUpload';
import { markExported } from '../services/api';
import { exportExtractedToExcel } from '../utils/excelHelper';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ExtractPage({ namaPengisi, setNamaPengisi, nim, setNim, onExportSuccess }) {
    const {
        files, loading, data, activeTab, setActiveTab, dragActive,
        fileInputRef,
        handleDrag, handleDrop, handleChange,
        handleUpload, markRecordsAsExported,
    } = useUpload();

    const handleExportToExcel = async (tableData, fileName) => {
        const newRecords = exportExtractedToExcel(tableData, fileName, namaPengisi, nim);
        if (!newRecords) return;

        try {
            await markExported(newRecords, namaPengisi, nim);
            const exportedNIKs = newRecords.map(r => r['NIK']);
            markRecordsAsExported(exportedNIKs);
            if (onExportSuccess) onExportSuccess();
        } catch (err) {
            console.error(err);
            alert('Berhasil ekspor ke Excel, tetapi gagal menyimpan status ekspor ke database local: ' + err.message);
        }
    };

    const renderTable = (tableData, type) => {
        if (!tableData || tableData.length === 0) {
            return <div className="empty-state"><p>Tidak ada data di kategori ini.</p></div>;
        }

        return (
            <div className="fade-in">
                <div className="flex-between">
                    <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                        Total Data: {tableData.length}
                    </h3>
                    <button className="brutal-btn cyan" onClick={() => handleExportToExcel(tableData, `Export_${type}`)}>
                        Ekspor Ke Excel
                    </button>
                </div>

                <div className="brutal-table-container">
                    <table className="brutal-table">
                        <thead>
                            <tr>
                                <th>Tgl Daftar</th>
                                <th>Nama Lengkap</th>
                                <th>NIK</th>
                                <th>Kecamatan</th>
                                <th>Kelurahan</th>
                                <th>Lingkungan</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, i) => (
                                <tr key={i}>
                                    <td>{row['Tgl Daftar']}</td>
                                    <td style={{ fontWeight: 800 }}>{row['Nama Lengkap']}</td>
                                    <td className="font-mono">{row['NIK']}</td>
                                    <td>{row['Kecamatan']}</td>
                                    <td>{row['Kelurahan']}</td>
                                    <td>{row['Lingkungan']}</td>
                                    <td>
                                        <span className={`brutal-badge ${row['Status'] === 'Ditemukan' ? 'success' : row['Status'] === 'Sudah Pernah Diekspor' ? 'warning' : row['Status']?.includes('Tuntungan') ? 'info' : 'danger'}`}>
                                            {row['Status']}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Ekstraksi &amp; Pencocokan PDF</h1>
                <p>Unggah berkas PDF untuk mengekstrak NIK dan mencocokkannya dengan database wilayah</p>
            </div>

            {/* Operator profile */}
            <div className="brutal-card" style={{ marginBottom: '30px' }}>
                <div className="brutal-card-header">
                    <h3 className="brutal-card-title"><Database size={20} /> Profil Operator (Untuk Laporan Excel)</h3>
                </div>
                <div className="brutal-form-section">
                    <div className="brutal-field">
                        <label className="brutal-label" htmlFor="nama-pengisi">Nama Pengisi (Mahasiswa)</label>
                        <input
                            id="nama-pengisi" type="text" className="brutal-input" value={namaPengisi}
                            onChange={(e) => { setNamaPengisi(e.target.value); localStorage.setItem('namaPengisi', e.target.value); }}
                            placeholder="Nama Lengkap Mahasiswa"
                        />
                    </div>
                    <div className="brutal-field">
                        <label className="brutal-label" htmlFor="nim-pengisi">NIM</label>
                        <input
                            id="nim-pengisi" type="text" className="brutal-input" value={nim}
                            onChange={(e) => { setNim(e.target.value); localStorage.setItem('nim', e.target.value); }}
                            placeholder="Nomor Induk Mahasiswa"
                        />
                    </div>
                </div>
            </div>

            {/* Upload area */}
            <div className="brutal-card" style={{ marginBottom: '30px' }}>
                <div
                    className={`brutal-upload-area ${dragActive ? 'dragging' : ''}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleChange} style={{ display: 'none' }} />
                    <div className="brutal-upload-icon">
                        <UploadCloud size={30} style={{ color: 'var(--text-main)' }} />
                    </div>
                    {files.length > 0 ? (
                        <div>
                            <p className="brutal-upload-text" style={{ color: 'var(--text-main)' }}>{files.length} File PDF Dipilih</p>
                            <p className="brutal-upload-subtext">{files.map(f => f.name).slice(0, 3).join(', ')}{files.length > 3 ? '...' : ''}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="brutal-upload-text">Tarik &amp; Lepas PDF atau Klik di Sini</p>
                            <p className="brutal-upload-subtext">Mendukung unggahan beberapa file PDF sekaligus</p>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button
                        className="brutal-btn cyan" onClick={handleUpload}
                        disabled={files.length === 0 || loading}
                        style={{ width: '100%', maxWidth: '350px', padding: '14px' }}
                    >
                        {loading ? <><LoadingSpinner /> Memproses Data...</> : <><FileText size={18} /> Mulai Ekstraksi &amp; Pencocokan</>}
                    </button>
                </div>
            </div>

            {/* Results tabs */}
            <div className="brutal-card">
                <div className="brutal-tabs">
                    <button className={`brutal-tab ${activeTab === 'matched' ? 'active' : ''}`} onClick={() => setActiveTab('matched')}>
                        <CheckCircle size={16} /> Data Cocok
                        <span className="brutal-tab-badge">{data?.matched_data?.length || 0}</span>
                    </button>
                    <button className={`brutal-tab ${activeTab === 'tuntungan' ? 'active' : ''}`} onClick={() => setActiveTab('tuntungan')}>
                        <AlertCircle size={16} /> Data Tuntungan
                        <span className="brutal-tab-badge">{data?.tuntungan_data?.length || 0}</span>
                    </button>
                    <button className={`brutal-tab ${activeTab === 'errors' ? 'active' : ''}`} onClick={() => setActiveTab('errors')}>
                        <AlertCircle size={16} /> Error Log
                        <span className="brutal-tab-badge">{data?.error_log?.length || 0}</span>
                    </button>
                </div>
                <div className="tab-content">
                    {activeTab === 'matched' && renderTable(data?.matched_data || [], 'Matched')}
                    {activeTab === 'tuntungan' && renderTable(data?.tuntungan_data || [], 'Tuntungan')}
                    {activeTab === 'errors' && renderTable(data?.error_log || [], 'ErrorLog')}
                </div>
            </div>
        </div>
    );
}
