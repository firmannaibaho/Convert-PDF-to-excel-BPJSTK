import { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle, MapPin, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import './index.css';

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('matched');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter(f => f.type === 'application/pdf');
    if (validFiles.length === 0) {
      alert('Mohon unggah file dengan format PDF.');
      return;
    }
    setFiles(validFiles);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    
    setLoading(true);
    const formData = new FormData();
    files.forEach(f => {
      formData.append('files', f);
    });

    try {
      // Assuming backend runs on port 8000
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Terjadi kesalahan saat memproses PDF');
      }

      const result = await response.json();
      setData(result);
      if (result.matched_data.length > 0) setActiveTab('matched');
      else if (result.tuntungan_data.length > 0) setActiveTab('tuntungan');
      else setActiveTab('errors');

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (tableData, fileName) => {
    const formattedData = tableData.map(row => {
      const kecamatan = row['Kecamatan'] || '';
      const kelurahan = row['Kelurahan'] || '';
      const lingkungan = row['Lingkungan'] || '';
      const wilayah = `${kecamatan}-${kelurahan}-${lingkungan}`;

      return {
        'Wilayah': wilayah,
        'NIK': row['NIK'] || '',
        'Nama': row['Nama Lengkap'] || '',
        'No Telepon': '-',
        'Tanggal Pendaftaran': row['Tgl Daftar'] || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const renderTable = (tableData, type) => {
    if (!tableData || tableData.length === 0) {
      return (
        <div className="empty-state">
          <p>Tidak ada data di kategori ini.</p>
        </div>
      );
    }

    return (
      <div className="fade-in">
        <div className="flex-between">
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>
            Total Data: {tableData.length}
          </h3>
          <button 
            className="btn" 
            onClick={() => exportToExcel(tableData, `Export_${type}`)}
          >
            <Download size={16} /> Export ke Spreadsheet
          </button>
        </div>
        
        <div className="table-container">
          <table>
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
                  <td>{row['Nama Lengkap']}</td>
                  <td style={{ fontFamily: 'monospace' }}>{row['NIK']}</td>
                  <td>{row['Kecamatan']}</td>
                  <td>{row['Kelurahan']}</td>
                  <td>{row['Lingkungan']}</td>
                  <td>
                    <span className={`status ${
                      row['Status'] === 'Ditemukan' ? 'success' : 
                      row['Status'].includes('Tuntungan') ? 'info' : 'danger'
                    }`}>
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
    <div className="container">
      <div className="header fade-in">
        <h1>BPJS Data Extractor</h1>
        <p>Otomatisasi pencocokan data PDF peserta dengan master database wilayah</p>
      </div>

      <div className="glass-panel fade-in" style={{ marginBottom: '24px' }}>
        <div 
          className={`upload-area ${dragActive ? 'dragging' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef} 
            type="file" 
            accept=".pdf" 
            multiple
            onChange={handleChange} 
          />
          <UploadCloud size={48} className="upload-icon" />
          {files.length > 0 ? (
            <div>
              <p style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)' }}>{files.length} file PDF terpilih</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {files.map(f => f.name).slice(0, 3).join(', ')}{files.length > 3 ? '...' : ''}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Klik atau Tarik file PDF ke sini</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Anda bisa memilih beberapa file sekaligus</p>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button 
            className="btn" 
            onClick={handleUpload} 
            disabled={files.length === 0 || loading}
            style={{ padding: '12px 32px', fontSize: '1.1rem' }}
          >
            {loading ? (
              <><span className="loading-spinner"></span> Memproses Data...</>
            ) : (
              <><FileText size={20} /> Ekstrak & Cocokkan Data</>
            )}
          </button>
        </div>
      </div>

      {data && (
        <div className="glass-panel fade-in">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'matched' ? 'active' : ''}`}
              onClick={() => setActiveTab('matched')}
            >
              <CheckCircle size={16} style={{ display: 'inline', marginBottom: '-3px', marginRight: '4px' }} />
              Data Cocok
              <span className="badge success">{data.matched_data.length}</span>
            </button>
            <button 
              className={`tab ${activeTab === 'tuntungan' ? 'active' : ''}`}
              onClick={() => setActiveTab('tuntungan')}
            >
              <MapPin size={16} style={{ display: 'inline', marginBottom: '-3px', marginRight: '4px' }} />
              Kuota Tuntungan
              <span className="badge info">{data.tuntungan_data.length}</span>
            </button>
            <button 
              className={`tab ${activeTab === 'errors' ? 'active' : ''}`}
              onClick={() => setActiveTab('errors')}
            >
              <AlertCircle size={16} style={{ display: 'inline', marginBottom: '-3px', marginRight: '4px' }} />
              Error Log
              <span className="badge danger">{data.error_log.length}</span>
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'matched' && renderTable(data.matched_data, 'Matched')}
            {activeTab === 'tuntungan' && renderTable(data.tuntungan_data, 'Tuntungan')}
            {activeTab === 'errors' && renderTable(data.error_log, 'ErrorLog')}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
