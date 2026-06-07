import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  MapPin, 
  Download, 
  Users, 
  X, 
  TrendingUp, 
  Clock, 
  Database,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  LogOut
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './index.css';

const BACKEND_URL = 'https://convert-pdf-to-excel-bpjstk-production.up.railway.app';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'extract', or 'kepling'
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ matched_data: [], tuntungan_data: [], error_log: [] });
  const [activeTab, setActiveTab] = useState('matched');
  const [dragActive, setDragActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [namaPengisi, setNamaPengisi] = useState(() => localStorage.getItem('namaPengisi') || '');
  const [nim, setNim] = useState(() => localStorage.getItem('nim') || '');
  const [pembinaStats, setPembinaStats] = useState([]);
  const [selectedPembina, setSelectedPembina] = useState(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Kepling management state
  const [keplings, setKeplings] = useState([]);
  const [keplingSearch, setKeplingSearch] = useState('');
  
  // Dropdown filter states
  const [filterPembina, setFilterPembina] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterKelurahan, setFilterKelurahan] = useState('');
  const [filterLingkungan, setFilterLingkungan] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'filled', 'vacant'

  // Modals state
  const [selectedKeplingForEdit, setSelectedKeplingForEdit] = useState(null);
  const [selectedKeplingForAcquisitions, setSelectedKeplingForAcquisitions] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add Kepling Form state
  const defaultKeplingState = {
    pembina: '',
    kecamatan: '',
    kelurahan: '',
    lingkungan: '',
    nama_kepling: '',
    nik: '',
    no_hp: '',
    email: '',
    akun_perisai: 'TIDAK',
    id_akun_perisai: '',
    nama_akun_perisai: '',
    nama_bank: 'CIMB NIAGA',
    nomor_rekening: ''
  };
  const [newKeplingData, setNewKeplingData] = useState(defaultKeplingState);
  const [customLingkungan, setCustomLingkungan] = useState('');
  const [isCustomLingkungan, setIsCustomLingkungan] = useState(false);

  const [keplingPage, setKeplingPage] = useState(1);
  const [keplingLimit] = useState(10);
  const [keplingUpdating, setKeplingUpdating] = useState(false);
  
  const fileInputRef = useRef(null);

  // Geographic Intelligence Dashboard state
  const [dashboardTab, setDashboardTab] = useState('pembina'); // 'pembina' or 'gis'
  const [selectedGisKecamatan, setSelectedGisKecamatan] = useState(null);
  const [gisSearchKelurahan, setGisSearchKelurahan] = useState('');
  const [gisSortOrder, setGisSortOrder] = useState('acquisitions'); // 'acquisitions' or 'coverage'
  const [gisHoveredKecamatan, setGisHoveredKecamatan] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleGisMapHover = (kec, e) => {
    setGisHoveredKecamatan(kec);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };
  const handleGisMapMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };
  const handleGisMapLeave = () => {
    setGisHoveredKecamatan(null);
  };
  const handleGisMapClick = (kec) => {
    setSelectedGisKecamatan(prev => prev === kec ? null : kec);
  };

  const mapRef = useRef(null);

  useEffect(() => {
    if (dashboardTab !== 'gis') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      const L = window.L;
      if (!L) {
        console.warn('Leaflet library not loaded, falling back to SVG map.');
        return;
      }

      const mapContainer = document.getElementById('gis-map');
      if (!mapContainer || mapRef.current) return;

      // Center around Medan center point covering our active districts
      const map = L.map('gis-map', {
        center: [3.565, 98.660],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false
      });
      mapRef.current = map;

      // Grayscale/beige clean aesthetic base map tiles matching Neobrutalism theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      }).addTo(map);

      // Real boundaries of our 3 Kecamatans (approximate bounding polygons based on coordinates)
      const districts = [
        {
          name: 'MEDAN TIMUR',
          color: 'var(--accent-purple)',
          coords: [
            [3.630, 98.675],
            [3.622, 98.712],
            [3.585, 98.705],
            [3.593, 98.668]
          ]
        },
        {
          name: 'MEDAN KOTA',
          color: 'var(--primary)',
          coords: [
            [3.582, 98.670],
            [3.578, 98.703],
            [3.550, 98.698],
            [3.554, 98.665]
          ]
        },
        {
          name: 'MEDAN TUNTUNGAN',
          color: 'var(--accent-cyan)',
          coords: [
            [3.545, 98.580],
            [3.538, 98.640],
            [3.475, 98.630],
            [3.482, 98.570]
          ]
        }
      ];

      districts.forEach(d => {
        const polygon = L.polygon(d.coords, {
          color: '#1a1a1a',
          fillColor: d.color,
          fillOpacity: 0.5,
          weight: 3.5
        }).addTo(map);

        polygon.on('mouseover', function (e) {
          this.setStyle({
            fillOpacity: 0.8,
            weight: 4.5
          });
          setGisHoveredKecamatan(d.name);
          setTooltipPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
        });

        polygon.on('mousemove', function (e) {
          setTooltipPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
        });

        polygon.on('mouseout', function () {
          this.setStyle({
            fillOpacity: 0.5,
            weight: 3.5
          });
          setGisHoveredKecamatan(null);
        });

        polygon.on('click', function () {
          setSelectedGisKecamatan(prev => prev === d.name ? null : d.name);
        });
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [dashboardTab]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    const usernameInput = loginUsername.trim();
    const passwordInput = loginPassword.trim();

    if (usernameInput.toLowerCase() === 'firman karunia naibaho' && passwordInput === '231402074') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('namaPengisi', 'Firman Karunia Naibaho');
      localStorage.setItem('nim', '231402074');
      
      setIsLoggedIn(true);
      setNamaPengisi('Firman Karunia Naibaho');
      setNim('231402074');
      
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError('Username atau Password salah!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('namaPengisi');
    localStorage.removeItem('nim');
    
    setIsLoggedIn(false);
    setNamaPengisi('');
    setNim('');
  };


  const fetchPembinaStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/pembina-stats`);
      if (response.ok) {
        const stats = await response.json();
        setPembinaStats(stats);
      }
    } catch (error) {
      console.error('Error fetching Pembina stats:', error);
    }
  };

  const fetchKeplings = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/keplings`);
      if (response.ok) {
        const list = await response.json();
        setKeplings(list);
      }
    } catch (error) {
      console.error('Error fetching Keplings:', error);
    }
  };

  useEffect(() => {
    fetchPembinaStats();
    fetchKeplings();
  }, []);

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
      const response = await fetch(`${BACKEND_URL}/upload`, {
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

  const exportToExcel = async (tableData, fileName) => {
    const newRecordsToExport = tableData.filter(row => row['Status'] !== 'Sudah Pernah Diekspor');

    if (newRecordsToExport.length === 0) {
      alert('Semua data di tabel ini sudah pernah diekspor sebelumnya.');
      return;
    }

    const formattedData = newRecordsToExport.map(row => {
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

    const fitColumns = (ws, headerRow, dataRows) => {
      const colWidths = headerRow.map((h, i) => {
        let maxLen = h.toString().length;
        dataRows.forEach(row => {
          const keys = Object.keys(row);
          const val = row[keys[i]];
          if (val !== undefined && val !== null) {
            maxLen = Math.max(maxLen, val.toString().length);
          }
        });
        return { wch: maxLen + 4 };
      });
      ws['!cols'] = colWidths;
    };

    const ws = XLSX.utils.aoa_to_sheet([
      ["LAPORAN DATA PESERTA AKUISISI BARU"],
      [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')} | Waktu: ${new Date().toLocaleTimeString('id-ID')}`],
      [],
      ["Wilayah", "NIK", "Nama", "No Telepon", "Tanggal Pendaftaran"]
    ]);
    
    XLSX.utils.sheet_add_json(ws, formattedData, { origin: "A5", skipHeader: true });
    
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
    ];
    
    fitColumns(ws, ["Wilayah", "NIK", "Nama", "No Telepon", "Tanggal Pendaftaran"], formattedData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    try {
      const res = await fetch(`${BACKEND_URL}/mark-exported`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          records: newRecordsToExport,
          nama_pengisi: namaPengisi,
          nim: nim
        })
      });

      if (!res.ok) {
        throw new Error('Gagal menandai data sebagai diekspor di database local');
      }

      fetchPembinaStats();

      setData(prevData => {
        if (!prevData) return prevData;

        const updateList = (list) =>
          list.map(item => {
            const isJustExported = newRecordsToExport.some(exp => exp['NIK'] === item['NIK']);
            if (isJustExported) {
              return { ...item, Status: 'Sudah Pernah Diekspor' };
            }
            return item;
          });

        return {
          ...prevData,
          matched_data: updateList(prevData.matched_data),
          tuntungan_data: updateList(prevData.tuntungan_data),
          error_log: updateList(prevData.error_log)
        };
      });

    } catch (err) {
      console.error(err);
      alert('Berhasil ekspor ke Excel, tetapi gagal menyimpan status ekspor ke database local: ' + err.message);
    }
  };

  const exportPembinaToExcel = (stats) => {
    const summaryData = stats.map((s, index) => ({
      'No': index + 1,
      'Nama Pembina': s.pembina,
      'Jumlah Wilayah': s.assigned_regions_count,
      'Total Akuisisi': s.total_acquisitions
    }));

    const wb = XLSX.utils.book_new();
    
    const fitColumns = (ws, headerRow, dataRows) => {
      const colWidths = headerRow.map((h, i) => {
        let maxLen = h.toString().length;
        dataRows.forEach(row => {
          const keys = Object.keys(row);
          const val = row[keys[i]];
          if (val !== undefined && val !== null) {
            maxLen = Math.max(maxLen, val.toString().length);
          }
        });
        return { wch: maxLen + 4 };
      });
      ws['!cols'] = colWidths;
    };
    
    const wsSummary = XLSX.utils.aoa_to_sheet([
      ["LAPORAN RINGKASAN AKUISISI PEMBINA"],
      [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')} | Waktu: ${new Date().toLocaleTimeString('id-ID')}`],
      [],
      ["No", "Nama Pembina", "Jumlah Wilayah di-Assign", "Total Akuisisi"]
    ]);
    
    XLSX.utils.sheet_add_json(wsSummary, summaryData, { origin: "A5", skipHeader: true });
    
    wsSummary['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
    ];
    
    fitColumns(wsSummary, ["No", "Nama Pembina", "Jumlah Wilayah di-Assign", "Total Akuisisi"], summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Pembina");
    
    stats.forEach(s => {
      if (s.total_acquisitions > 0) {
        const pembinaDetails = s.acquisitions.map((a, index) => ({
          'No': index + 1,
          'Nama TK': a.nama_tk || '-',
          'NIK': a.nik || '-',
          'Wilayah': a.wilayah || '-',
          'Tanggal Pendaftaran': a.tgl_daftar || '-',
          'Tanggal Input': a.tanggal_input || '-',
          'Jam Input': a.jam_input || '-',
          'Nama Pengisi': a.nama_pengisi || '-',
          'NIM': a.nim || '-'
        }));
        
        let sheetName = s.pembina.slice(0, 30).replace(/[\\\/\?\*\[\]]/g, '');
        if (!sheetName) sheetName = `Pembina_${s.pembina.slice(0, 10)}`;
        
        const wsPembina = XLSX.utils.aoa_to_sheet([
          [`LAPORAN DETAIL AKUISISI - ${s.pembina.toUpperCase()}`],
          [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`],
          [],
          ["No", "Nama TK", "NIK", "Wilayah", "Tanggal Pendaftaran", "Tanggal Input", "Jam Input", "Nama Pengisi (Mahasiswa)", "NIM"]
        ]);
        
        XLSX.utils.sheet_add_json(wsPembina, pembinaDetails, { origin: "A5", skipHeader: true });
        
        wsPembina['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
        ];
        
        fitColumns(
          wsPembina, 
          ["No", "Nama TK", "NIK", "Wilayah", "Tanggal Pendaftaran", "Tanggal Input", "Jam Input", "Nama Pengisi (Mahasiswa)", "NIM"], 
          pembinaDetails
        );
        XLSX.utils.book_append_sheet(wb, wsPembina, sheetName);
      }
    });
    
    XLSX.writeFile(wb, `Laporan_Pembina_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleUpdateKepling = async (e) => {
    e.preventDefault();
    if (!selectedKeplingForEdit) return;

    setKeplingUpdating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/update-kepling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedKeplingForEdit)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Gagal menyimpan detail Kepling');
      }

      alert('Berhasil memperbarui detail Kepling!');
      setSelectedKeplingForEdit(null);
      await fetchKeplings();
      await fetchPembinaStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setKeplingUpdating(false);
    }
  };

  const handleCreateKepling = async (e) => {
    e.preventDefault();
    
    // Validate keys
    if (!newKeplingData.kecamatan || !newKeplingData.kelurahan) {
      alert('Kecamatan dan Kelurahan wajib diisi!');
      return;
    }
    
    const finalLingkungan = isCustomLingkungan ? customLingkungan : newKeplingData.lingkungan;
    if (!finalLingkungan) {
      alert('Lingkungan wajib diisi!');
      return;
    }
    
    setKeplingUpdating(true);
    try {
      const postData = {
        ...newKeplingData,
        lingkungan: finalLingkungan
      };
      
      const response = await fetch(`${BACKEND_URL}/create-kepling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Gagal menambahkan Kepling baru');
      }
      
      alert('Berhasil menyimpan detail Kepling baru!');
      setShowAddModal(false);
      setNewKeplingData(defaultKeplingState);
      setCustomLingkungan('');
      setIsCustomLingkungan(false);
      await fetchKeplings();
      await fetchPembinaStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setKeplingUpdating(false);
    }
  };

  const handleDeleteKepling = async (kecamatan, kelurahan, lingkungan) => {
    if (!confirm(`Apakah Anda yakin ingin mengosongkan data Kepling di wilayah:\nKec. ${kecamatan} - Kel. ${kelurahan} - Lingk. ${lingkungan}?\n\nKategori wilayah ini akan tetap ada di CSV, namun data profil Kepling di dalamnya akan di-reset menjadi kosong.`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/delete-kepling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ kecamatan, kelurahan, lingkungan })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Gagal menghapus data Kepling');
      }

      alert('Berhasil mengosongkan detail Kepling!');
      await fetchKeplings();
      await fetchPembinaStats();
    } catch (err) {
      alert(err.message);
    }
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
          <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
            Total Data: {tableData.length}
          </h3>
          <button 
            className="brutal-btn cyan" 
            onClick={() => exportToExcel(tableData, `Export_${type}`)}
          >
            <Download size={16} /> Export Ke Excel
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
                    <span className={`brutal-badge ${
                      row['Status'] === 'Ditemukan' ? 'success' : 
                      row['Status'] === 'Sudah Pernah Diekspor' ? 'warning' :
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

  const renderPembinaTable = () => {
    if (!pembinaStats || pembinaStats.length === 0) {
      return (
        <div className="empty-state">
          <p>Tidak ada data laporan Pembina. Pastikan file FORM RESULT - FORM.csv terisi.</p>
        </div>
      );
    }

    return (
      <div>
        <div className="flex-between">
          <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
            Laporan Kinerja & Quota Pembina
          </h3>
          <button 
            className="brutal-btn orange" 
            onClick={() => exportPembinaToExcel(pembinaStats)}
          >
            <Download size={16} /> Export Laporan Pembina
          </button>
        </div>
        
        <div className="brutal-table-container">
          <table className="brutal-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>No</th>
                <th>Nama Pembina</th>
                <th>Jumlah Wilayah di-Assign</th>
                <th>Total Akuisisi</th>
                <th style={{ minWidth: '180px' }}>Progres Target (80)</th>
                <th>Status Quota</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pembinaStats.map((row, i) => {
                const acquisitions = row.total_acquisitions || 0;
                const pembinaTarget = 80;
                const pct = Math.min(Math.round((acquisitions / (pembinaTarget || 1)) * 100), 100);
                const isTargetAchieved = acquisitions >= pembinaTarget;

                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 850 }}>{row.pembina}</td>
                    <td className="font-mono">{row.assigned_regions_count}</td>
                    <td>
                      <span className="brutal-badge success" style={{ fontWeight: 900 }}>
                        {acquisitions}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 900 }}>
                          <span>{pct}%</span>
                          <span>{acquisitions} / {pembinaTarget}</span>
                        </div>
                        <div className="table-progress-bar">
                          <div 
                            className="table-progress-fill" 
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: isTargetAchieved ? 'var(--success)' : 
                                              pct >= 50 ? 'var(--primary)' : 'var(--accent-orange)'
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isTargetAchieved ? (
                        <span className="brutal-badge success" style={{ fontWeight: 900, backgroundColor: '#4ade80' }}>
                          Tercapai 🏆
                        </span>
                      ) : (
                        <span className="brutal-badge" style={{ fontWeight: 900, backgroundColor: '#fca5a5', border: 'var(--border-thin)', color: '#1a1a1a' }}>
                          Kurang {pembinaTarget - acquisitions}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="brutal-btn cyan" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => setSelectedPembina(row)}
                        disabled={acquisitions === 0}
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Compute Dashboard Statistics
  const totalAcquisitions = pembinaStats.reduce((sum, p) => sum + (p.total_acquisitions || 0), 0);
  const totalPembinas = pembinaStats.length;
  const totalAssignedRegions = pembinaStats.reduce((sum, p) => sum + (p.assigned_regions_count || 0), 0);
  const activePembinas = pembinaStats.filter(p => p.total_acquisitions > 0).length;

  // Top Pembinas for Chart
  const topPembinas = [...pembinaStats]
    .sort((a, b) => b.total_acquisitions - a.total_acquisitions)
    .slice(0, 5);
  const maxAcquisitions = Math.max(...pembinaStats.map(p => p.total_acquisitions), 1);

  // Flatten and sort recent activities
  const allAcquisitions = pembinaStats.flatMap(p => 
    (p.acquisitions || []).map(acq => ({ ...acq, pembinaName: p.pembina }))
  );

  // Calculate Geographic Intelligence statistics (geoData)
  const geoData = (() => {
    const acqMap = {};
    allAcquisitions.forEach(acq => {
      const key = (acq.wilayah || '').trim().toUpperCase();
      acqMap[key] = (acqMap[key] || 0) + 1;
    });

    const kecamatanData = {};
    const mainKecs = ["MEDAN KOTA", "MEDAN TIMUR", "MEDAN TUNTUNGAN"];
    
    mainKecs.forEach(k => {
      kecamatanData[k] = {
        name: k,
        totalKeplings: 0,
        filledKeplings: 0,
        activePerisais: 0,
        totalAcquisitions: 0,
        kelurahans: {}
      };
    });

    keplings.forEach(k => {
      const kec = (k.kecamatan || '').trim().toUpperCase();
      if (!kec) return;
      
      if (!kecamatanData[kec]) {
        kecamatanData[kec] = {
          name: kec,
          totalKeplings: 0,
          filledKeplings: 0,
          activePerisais: 0,
          totalAcquisitions: 0,
          kelurahans: {}
        };
      }

      const kel = (k.kelurahan || '').trim().toUpperCase();
      const lingk = (k.lingkungan || '').trim().toUpperCase();
      const regionKey = `${kec}-${kel}-${lingk}`;
      const hasAcq = acqMap[regionKey] || 0;
      const isFilled = k.nama_kepling && k.nama_kepling.trim() !== '' && k.nama_kepling.trim() !== '-';
      const isActivePerisai = k.akun_perisai === 'YA';

      if (kel) {
        if (!kecamatanData[kec].kelurahans[kel]) {
          kecamatanData[kec].kelurahans[kel] = {
            name: kel,
            totalKeplings: 0,
            filledKeplings: 0,
            activePerisais: 0,
            totalAcquisitions: 0
          };
        }
        kecamatanData[kec].kelurahans[kel].totalKeplings += 1;
        if (isFilled) kecamatanData[kec].kelurahans[kel].filledKeplings += 1;
        if (isActivePerisai) kecamatanData[kec].kelurahans[kel].activePerisais += 1;
        kecamatanData[kec].kelurahans[kel].totalAcquisitions += hasAcq;
      }

      kecamatanData[kec].totalKeplings += 1;
      if (isFilled) kecamatanData[kec].filledKeplings += 1;
      if (isActivePerisai) kecamatanData[kec].activePerisais += 1;
      kecamatanData[kec].totalAcquisitions += hasAcq;
    });

    return kecamatanData;
  })();

  const parseDateTime = (dStr, tStr) => {
    if (!dStr) return 0;
    const parts = dStr.split('/');
    if (parts.length !== 3) return 0;
    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    return new Date(`${formattedDate}T${tStr || '00:00:00'}`).getTime() || 0;
  };

  const recentAcquisitions = allAcquisitions
    .sort((a, b) => parseDateTime(b.tanggal_input, b.jam_input) - parseDateTime(a.tanggal_input, a.jam_input))
    .slice(0, 8);

  // Helper function to map acquisitions from form result to a specific Kepling
  const getAcquisitionsForKepling = (k) => {
    const kec = (k.kecamatan || '').trim().toUpperCase();
    const kel = (k.kelurahan || '').trim().toUpperCase();
    const lingk = (k.lingkungan || '').trim().toUpperCase();
    const regionKey = `${kec}-${kel}-${lingk}`;
    return allAcquisitions.filter(acq => (acq.wilayah || '').trim().toUpperCase() === regionKey);
  };

  // Calculate unique lists directly from the master CSV data
  const uniquePembinas = [...new Set(keplings.map(k => k.pembina).filter(Boolean))].sort();
  const uniqueKecamatans = [...new Set(keplings.map(k => k.kecamatan).filter(Boolean))].sort();
  
  const uniqueKelurahans = [...new Set(
    keplings
      .filter(k => !filterKecamatan || k.kecamatan === filterKecamatan)
      .map(k => k.kelurahan)
      .filter(Boolean)
  )].sort();

  const uniqueLingkungans = [...new Set(
    keplings
      .filter(k => !filterKelurahan || k.kelurahan === filterKelurahan)
      .map(k => k.lingkungan)
      .filter(Boolean)
  )].sort();

  // Helper functions for dynamic dropdown options in Modals (filled Keplings list)
  const getKelurahansForKecamatan = (kec) => {
    if (!kec) return [];
    return [...new Set(
      keplings
        .filter(k => k.kecamatan === kec)
        .map(k => k.kelurahan)
        .filter(Boolean)
    )].sort();
  };

  const getLingkungansForKelurahan = (kec, kel) => {
    if (!kec || !kel) return [];
    return [...new Set(
      keplings
        .filter(k => k.kecamatan === kec && k.kelurahan === kel)
        .map(k => k.lingkungan)
        .filter(Boolean)
    )].sort();
  };

  // Vacant Kepling Slots (where nama_kepling is empty or blank)
  const vacantKeplings = keplings.filter(k => !k.nama_kepling || k.nama_kepling.trim() === '-' || k.nama_kepling.trim() === '');

  // Calculate unique lists ONLY from vacant slots for the "Tambah Kepling" modal dropdowns
  const vacantPembinas = [...new Set(vacantKeplings.map(k => k.pembina).filter(Boolean))].sort();
  const vacantKecamatans = [...new Set(vacantKeplings.map(k => k.kecamatan).filter(Boolean))].sort();
  
  const getVacantKelurahansForKecamatan = (kec) => {
    if (!kec) return [];
    return [...new Set(
      vacantKeplings
        .filter(k => k.kecamatan === kec)
        .map(k => k.kelurahan)
        .filter(Boolean)
    )].sort();
  };

  const getVacantLingkungsForKelurahan = (kec, kel) => {
    if (!kec || !kel) return [];
    return [...new Set(
      vacantKeplings
        .filter(k => k.kecamatan === kec && k.kelurahan === kel)
        .map(k => k.lingkungan)
        .filter(Boolean)
    )].sort();
  };

  // Filter Keplings using DROPDOWN selects, search, and status toggle
  const filteredKeplings = keplings.filter(k => {
    // Vacancy Status filter
    const isVacant = !k.nama_kepling || k.nama_kepling.trim() === '' || k.nama_kepling.trim() === '-';
    if (filterStatus === 'filled' && isVacant) return false;
    if (filterStatus === 'vacant' && !isVacant) return false;

    // Dropdown filters
    if (filterPembina && k.pembina !== filterPembina) return false;
    if (filterKecamatan && k.kecamatan !== filterKecamatan) return false;
    if (filterKelurahan && k.kelurahan !== filterKelurahan) return false;
    if (filterLingkungan && k.lingkungan !== filterLingkungan) return false;
    
    // Search keyword
    if (keplingSearch) {
      const query = keplingSearch.toLowerCase();
      return (
        (k.nama_kepling || '').toLowerCase().includes(query) ||
        (k.nik || '').includes(query) ||
        (k.id_akun_perisai || '').toLowerCase().includes(query) ||
        (k.nama_akun_perisai || '').toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Reset page when any filter changes
  useEffect(() => {
    setKeplingPage(1);
  }, [filterPembina, filterKecamatan, filterKelurahan, filterLingkungan, keplingSearch, filterStatus]);

  const totalPages = Math.ceil(filteredKeplings.length / keplingLimit) || 1;
  const paginatedKeplings = filteredKeplings.slice(
    (keplingPage - 1) * keplingLimit,
    keplingPage * keplingLimit
  );

  const totalActivePerisais = keplings.filter(k => k.akun_perisai === 'YA').length;
  const filledKeplingCount = keplings.filter(k => k.nama_kepling && k.nama_kepling.trim() !== '-' && k.nama_kepling.trim() !== '').length;
  const vacantKeplingCount = keplings.length - filledKeplingCount;

  const renderDashboard = () => {
    return (
      <div className="fade-in">
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <h1>Dashboard Kinerja & Wilayah</h1>
          <p>Master dashboard pemantauan pencapaian akuisisi oleh Pembina Wilayah dan Pemetaan GIS</p>
        </div>

        {/* Dashboard Tabs Toggle */}
        <div className="brutal-tabs" style={{ marginBottom: '30px', borderBottom: 'none', paddingBottom: 0 }}>
          <button 
            type="button"
            className={`brutal-tab ${dashboardTab === 'pembina' ? 'active' : ''}`}
            onClick={() => setDashboardTab('pembina')}
            style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Users size={16} /> Kinerja Pembina
          </button>
          <button 
            type="button"
            className={`brutal-tab ${dashboardTab === 'gis' ? 'active' : ''}`}
            onClick={() => setDashboardTab('gis')}
            style={{ 
              padding: '10px 20px', 
              fontSize: '0.9rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              backgroundColor: dashboardTab === 'gis' ? 'var(--accent-orange)' : 'white'
            }}
          >
            <MapPin size={16} /> Kecerdasan Geografis (GIS)
          </button>
        </div>

        {dashboardTab === 'pembina' ? (
          <>
            {/* KPI Card Grid */}
            <div className="kpi-container">
              <div className="kpi-card color-0">
                <span className="kpi-label">Total Akuisisi</span>
                <span className="kpi-value font-mono">{totalAcquisitions}</span>
                <span className="kpi-subtext">Peserta Terdaftar</span>
              </div>
              <div className="kpi-card color-1">
                <span className="kpi-label">Total Pembina</span>
                <span className="kpi-value font-mono">{totalPembinas}</span>
                <span className="kpi-subtext">Orang Pembina Wilayah</span>
              </div>
              <div className="kpi-card color-2">
                <span className="kpi-label">Wilayah Ter-assign</span>
                <span className="kpi-value font-mono">{totalAssignedRegions}</span>
                <span className="kpi-subtext">Kelurahan / Kepling</span>
              </div>
              <div className="kpi-card color-3">
                <span className="kpi-label">Pembina Aktif</span>
                <span className="kpi-value font-mono">{activePembinas}</span>
                <span className="kpi-subtext">Pembina dengan Capaian</span>
              </div>
            </div>

            {/* Main Grid: Stats and Feed */}
            <div className="dashboard-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div className="brutal-card">
                  {renderPembinaTable()}
                </div>

                <div className="brutal-card">
                  <div className="brutal-card-header" style={{ marginBottom: '20px' }}>
                    <h3 className="brutal-card-title">
                      <TrendingUp size={20} />
                      Top Kinerja Pembina (Grafik)
                    </h3>
                  </div>
                  
                  {topPembinas.length === 0 ? (
                    <div className="empty-state">
                      <p>Belum ada data akuisisi pembina untuk diplot.</p>
                    </div>
                  ) : (
                    <div className="chart-bar-container">
                      {topPembinas.map((p, idx) => {
                        const widthPct = (p.total_acquisitions / maxAcquisitions) * 100;
                        return (
                          <div className="chart-bar-row" key={idx}>
                            <div className="chart-bar-label" title={p.pembina}>
                              {p.pembina}
                            </div>
                            <div className="chart-bar-track">
                              <div 
                                className="chart-bar-fill" 
                                style={{ 
                                  width: `${widthPct}%`,
                                  backgroundColor: idx === 0 ? 'var(--primary)' : 
                                                   idx === 1 ? 'var(--accent-cyan)' : 
                                                   idx === 2 ? 'var(--accent-purple)' : 
                                                   idx === 3 ? 'var(--accent-orange)' : '#fbbf24'
                                }}
                              ></div>
                            </div>
                            <div className="chart-bar-value">
                              {p.total_acquisitions}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Recent Activity Feed */}
              <div>
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
                          <div className="activity-title">
                            {acq.nama_tk}
                          </div>
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
              </div>
            </div>
          </>
        ) : (
          <div className="fade-in">
            {/* GIS Container: Map & Summary Detail Panel */}
            <div className="gis-container">
              {/* Map Box */}
              <div className="brutal-card gis-map-card" style={{ width: '100%' }}>
                <div className="brutal-card-header" style={{ marginBottom: '20px', width: '100%', borderBottom: 'none', paddingBottom: 0 }}>
                  <h3 className="brutal-card-title">Peta Real-World Wilayah Kerja Medan</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '4px' }}>
                    {window.L ? 'Gunakan mouse untuk zoom & pan. Sorot poligon wilayah untuk data cepat, klik untuk drilldown.' : 'Offline Fallback: Peta Interaktif Wilayah Binaan (Leaflet tidak termuat).'}
                  </p>
                </div>

                {/* Conditional map rendering: Leaflet Map or Fallback SVG */}
                {!window.L ? (
                  <svg viewBox="0 0 400 380" className="gis-map-svg">
                    <defs>
                      <pattern id="gis-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1.5" fill="#e2e8f0" />
                      </pattern>
                    </defs>
                    
                    <rect width="100%" height="100%" fill="url(#gis-grid)" rx="8" stroke="#1a1a1a" strokeWidth="2.5" strokeDasharray="5,5" />
                    <path d="M 97,280 L 237,210 L 272,120" stroke="#1a1a1a" strokeWidth="2" strokeDasharray="6,6" fill="none" opacity="0.3" />

                    {/* Medan Tuntungan */}
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

                    {/* Medan Kota */}
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

                    {/* Medan Timur */}
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
                  <div id="gis-map" style={{ width: '100%', height: '380px', position: 'relative' }}></div>
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
                      {/* Kepling coverage meter */}
                      {(() => {
                        const total = geoData[selectedGisKecamatan]?.totalKeplings || 1;
                        const filled = geoData[selectedGisKecamatan]?.filledKeplings || 0;
                        const pct = Math.round((filled / total) * 100);
                        return (
                          <div className="gis-stat-meter-row">
                            <div className="gis-stat-meter-label">
                              <span>Rasio Cakupan Kepling</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="gis-meter-bar">
                              <div className="gis-meter-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--primary)' }}></div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Perisai activation rate meter */}
                      {(() => {
                        const total = geoData[selectedGisKecamatan]?.totalKeplings || 1;
                        const active = geoData[selectedGisKecamatan]?.activePerisais || 0;
                        const pct = Math.round((active / total) * 100);
                        return (
                          <div className="gis-stat-meter-row">
                            <div className="gis-stat-meter-label">
                              <span>Rasio Akun Perisai Aktif</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="gis-meter-bar">
                              <div className="gis-meter-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--accent-purple)' }}></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 style={{ fontWeight: 950, textTransform: 'uppercase', fontSize: '1.4rem', margin: 0 }}>
                      🌍 Semua Wilayah Binaan
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '4px' }}>
                      Ringkasan pencapaian integrasi tiga Kecamatan di Kota Medan
                    </p>

                    <div className="gis-grid-layout" style={{ marginTop: '20px' }}>
                      <div className="gis-mini-card">
                        <span className="gis-mini-card-label">Total Akuisisi</span>
                        <span className="gis-mini-card-value" style={{ color: 'var(--accent-orange)' }}>
                          {totalAcquisitions}
                        </span>
                      </div>
                      <div className="gis-mini-card">
                        <span className="gis-mini-card-label">Kepling Terisi</span>
                        <span className="gis-mini-card-value">
                          {filledKeplingCount} / {keplings.length}
                        </span>
                      </div>
                      <div className="gis-mini-card">
                        <span className="gis-mini-card-label">Perisai Aktif</span>
                        <span className="gis-mini-card-value" style={{ color: '#10b981' }}>
                          {totalActivePerisais}
                        </span>
                      </div>
                    </div>

                    <div className="gis-stat-meter-container">
                      {/* Total Coverage bar */}
                      {(() => {
                        const total = keplings.length || 1;
                        const filled = filledKeplingCount;
                        const pct = Math.round((filled / total) * 100);
                        return (
                          <div className="gis-stat-meter-row">
                            <div className="gis-stat-meter-label">
                              <span>Cakupan Kepling Keseluruhan</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="gis-meter-bar">
                              <div className="gis-meter-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--primary)' }}></div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Total Perisai Rate bar */}
                      {(() => {
                        const total = keplings.length || 1;
                        const active = totalActivePerisais;
                        const pct = Math.round((active / total) * 100);
                        return (
                          <div className="gis-stat-meter-row">
                            <div className="gis-stat-meter-label">
                              <span>Tingkat Perisai Aktif Nasional</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="gis-meter-bar">
                              <div className="gis-meter-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--accent-purple)' }}></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* Density comparative chart */}
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
                              backgroundColor: kKey === 'MEDAN KOTA' ? 'var(--primary)' : 
                                              kKey === 'MEDAN TIMUR' ? 'var(--accent-purple)' : 'var(--accent-cyan)' 
                            }}
                          ></div>
                        </div>
                        <div className="gis-density-bar-val">{density} / slot</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Kelurahan Breakdown Table Section */}
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
                      list.push({
                        ...kData.kelurahans[kelKey],
                        kecamatan: kKey
                      });
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
                    
                    const kelTarget = item.totalKeplings * 25;
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

                        {/* Kelurahan Target Progress Bar */}
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
                                backgroundColor: isKelTargetAchieved ? 'var(--success)' : 
                                                acqPct >= 50 ? 'var(--primary)' : 'var(--accent-orange)'
                              }}
                            ></div>
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
            
            {/* Map Hover Tooltip overlay */}
            {gisHoveredKecamatan && tooltipPos && (
              <div 
                className="gis-tooltip" 
                style={{ left: `${tooltipPos.x + 15}px`, top: `${tooltipPos.y + 15}px` }}
              >
                <div style={{ fontWeight: 950, fontSize: '0.85rem' }}>{gisHoveredKecamatan}</div>
                <hr style={{ border: 'none', borderBottom: '2px solid #1a1a1a', margin: '6px 0' }} />
                <div className="gis-tooltip-row">
                  <span>Akuisisi:</span>
                  <span style={{ fontWeight: 900 }}>{geoData[gisHoveredKecamatan]?.totalAcquisitions || 0}</span>
                </div>
                <div className="gis-tooltip-row">
                  <span>Kepling:</span>
                  <span style={{ fontWeight: 900 }}>
                    {geoData[gisHoveredKecamatan]?.filledKeplings || 0} / {geoData[gisHoveredKecamatan]?.totalKeplings || 0}
                  </span>
                </div>
                <div className="gis-tooltip-row">
                  <span>Perisai:</span>
                  <span style={{ fontWeight: 900 }}>{geoData[gisHoveredKecamatan]?.activePerisais || 0} Aktif</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderExtract = () => {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>Ekstraksi & Pencocokan PDF</h1>
          <p>Unggah berkas PDF untuk mengekstrak NIK dan mencocokkannya dengan database wilayah</p>
        </div>

        <div className="brutal-card" style={{ marginBottom: '30px' }}>
          <div className="brutal-card-header">
            <h3 className="brutal-card-title">
              <Database size={20} />
              Profil Operator (Untuk Laporan Excel)
            </h3>
          </div>
          <div className="brutal-form-section">
            <div className="brutal-field">
              <label className="brutal-label" htmlFor="nama-pengisi">Nama Pengisi (Mahasiswa)</label>
              <input
                id="nama-pengisi"
                type="text"
                className="brutal-input"
                value={namaPengisi}
                onChange={(e) => {
                  setNamaPengisi(e.target.value);
                  localStorage.setItem('namaPengisi', e.target.value);
                }}
                placeholder="Nama Lengkap Mahasiswa"
              />
            </div>
            <div className="brutal-field">
              <label className="brutal-label" htmlFor="nim-pengisi">NIM</label>
              <input
                id="nim-pengisi"
                type="text"
                className="brutal-input"
                value={nim}
                onChange={(e) => {
                  setNim(e.target.value);
                  localStorage.setItem('nim', e.target.value);
                }}
                placeholder="Nomor Induk Mahasiswa"
              />
            </div>
          </div>
        </div>

        <div className="brutal-card" style={{ marginBottom: '30px' }}>
          <div 
            className={`brutal-upload-area ${dragActive ? 'dragging' : ''}`}
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
            <div className="brutal-upload-icon">
              <UploadCloud size={30} style={{ color: 'var(--text-main)' }} />
            </div>
            {files.length > 0 ? (
              <div>
                <p className="brutal-upload-text" style={{ color: 'var(--text-main)' }}>
                  {files.length} File PDF Dipilih
                </p>
                <p className="brutal-upload-subtext">
                  {files.map(f => f.name).slice(0, 3).join(', ')}{files.length > 3 ? '...' : ''}
                </p>
              </div>
            ) : (
              <div>
                <p className="brutal-upload-text">Tarik & Lepas PDF atau Klik di Sini</p>
                <p className="brutal-upload-subtext">Mendukung unggahan beberapa file PDF sekaligus</p>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              className="brutal-btn cyan" 
              onClick={handleUpload} 
              disabled={files.length === 0 || loading}
              style={{ width: '100%', maxWidth: '350px', padding: '14px' }}
            >
              {loading ? (
                <><span className="loading-spinner"></span> Memproses Data...</>
              ) : (
                <><FileText size={18} /> Mulai Ekstraksi & Pencocokan</>
              )}
            </button>
          </div>
        </div>

        <div className="brutal-card">
          <div className="brutal-tabs">
            <button 
              className={`brutal-tab ${activeTab === 'matched' ? 'active' : ''}`}
              onClick={() => setActiveTab('matched')}
            >
              <CheckCircle size={16} />
              Data Cocok
              <span className="brutal-tab-badge">{data?.matched_data?.length || 0}</span>
            </button>
            <button 
              className={`brutal-tab ${activeTab === 'tuntungan' ? 'active' : ''}`}
              onClick={() => setActiveTab('tuntungan')}
            >
              <MapPin size={16} />
              Kuota Tuntungan
              <span className="brutal-tab-badge">{data?.tuntungan_data?.length || 0}</span>
            </button>
            <button 
              className={`brutal-tab ${activeTab === 'errors' ? 'active' : ''}`}
              onClick={() => setActiveTab('errors')}
            >
              <AlertCircle size={16} />
              Error Log
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
  };

  const renderKeplingView = () => {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>Data & Manajemen Kepling</h1>
          <p>Kelola detail kepling, akun perisai, rekening bank, dan kontak per wilayah binaan</p>
        </div>

        {/* Kepling Search & Dropdown Filters Bar */}
        <div className="brutal-card" style={{ marginBottom: '30px' }}>
          <div className="brutal-card-header" style={{ marginBottom: '20px', borderBottom: 'none', paddingBottom: 0 }}>
            <h3 className="brutal-card-title">Filter & Pencarian Wilayah</h3>
            <button 
              className="brutal-btn" 
              style={{ backgroundColor: 'var(--primary)', padding: '10px 18px' }}
              onClick={() => {
                setShowAddModal(true);
                setNewKeplingData(defaultKeplingState);
              }}
            >
              <Plus size={16} /> Isi Kepling Kosong
            </button>
          </div>

          {/* Vacancy Tab Toggle */}
          <div className="brutal-tabs" style={{ marginBottom: '20px', borderBottom: 'none', paddingBottom: 0 }}>
            <button 
              type="button"
              className={`brutal-tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              Semua Wilayah ({keplings.length})
            </button>
            <button 
              type="button"
              className={`brutal-tab ${filterStatus === 'filled' ? 'active' : ''}`}
              onClick={() => setFilterStatus('filled')}
              style={{ padding: '8px 18px', fontSize: '0.85rem', backgroundColor: filterStatus === 'filled' ? 'var(--primary)' : '' }}
            >
              Terisi ({filledKeplingCount})
            </button>
            <button 
              type="button"
              className={`brutal-tab ${filterStatus === 'vacant' ? 'active' : ''}`}
              onClick={() => setFilterStatus('vacant')}
              style={{ padding: '8px 18px', fontSize: '0.85rem', backgroundColor: filterStatus === 'vacant' ? 'var(--primary)' : '' }}
            >
              Kosong / Belum Terisi ({vacantKeplingCount})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Dropdown Filters Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div className="brutal-field">
                <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Nama Pembina</label>
                <select 
                  className="brutal-input" 
                  value={filterPembina} 
                  onChange={(e) => setFilterPembina(e.target.value)}
                  style={{ padding: '10px' }}
                >
                  <option value="">Semua Pembina</option>
                  {uniquePembinas.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="brutal-field">
                <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Kecamatan</label>
                <select 
                  className="brutal-input" 
                  value={filterKecamatan} 
                  onChange={(e) => {
                    setFilterKecamatan(e.target.value);
                    setFilterKelurahan('');
                    setFilterLingkungan('');
                  }}
                  style={{ padding: '10px' }}
                >
                  <option value="">Semua Kecamatan</option>
                  {uniqueKecamatans.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              <div className="brutal-field">
                <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Kelurahan</label>
                <select 
                  className="brutal-input" 
                  value={filterKelurahan} 
                  onChange={(e) => {
                    setFilterKelurahan(e.target.value);
                    setFilterLingkungan('');
                  }}
                  disabled={!filterKecamatan}
                  style={{ padding: '10px' }}
                >
                  <option value="">Semua Kelurahan</option>
                  {uniqueKelurahans.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              <div className="brutal-field">
                <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Lingkungan</label>
                <select 
                  className="brutal-input" 
                  value={filterLingkungan} 
                  onChange={(e) => setFilterLingkungan(e.target.value)}
                  disabled={!filterKelurahan}
                  style={{ padding: '10px' }}
                >
                  <option value="">Semua Lingkungan</option>
                  {uniqueLingkungans.map(l => <option key={l} value={l}>Lingk. {l}</option>)}
                </select>
              </div>
            </div>

            {/* Keyword search & reset */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="brutal-field" style={{ flexGrow: 1, minWidth: '250px' }}>
                <label className="brutal-label" style={{ fontSize: '0.75rem' }}>Pencarian Kata Kunci</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="brutal-input"
                    style={{ width: '100%', paddingRight: '45px' }}
                    placeholder="Ketik nama kepling, NIK, kode perisai..."
                    value={keplingSearch}
                    onChange={(e) => setKeplingSearch(e.target.value)}
                  />
                  <Search size={18} style={{ position: 'absolute', right: '15px', color: 'var(--text-muted)' }} />
                </div>
              </div>
              
              <button 
                className="brutal-btn white"
                style={{ height: '48px', padding: '0 20px', textTransform: 'uppercase', fontWeight: 900 }}
                onClick={() => {
                  setFilterPembina('');
                  setFilterKecamatan('');
                  setFilterKelurahan('');
                  setFilterLingkungan('');
                  setKeplingSearch('');
                  setFilterStatus('all');
                }}
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Kepling List Table Card */}
        <div className="brutal-card">
          {filteredKeplings.length === 0 ? (
            <div className="empty-state">
              <p>Tidak ada data Kepling yang cocok dengan filter pencarian.</p>
            </div>
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
                      <th>Jumlah Akuisisi (Target 25)</th>
                      <th style={{ textAlign: 'center', width: '200px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedKeplings.map((row, i) => {
                      const isVacant = !row.nama_kepling || row.nama_kepling.trim() === '' || row.nama_kepling.trim() === '-';
                      const kAcquisitions = getAcquisitionsForKepling(row);
                      return (
                        <tr key={i} style={{ backgroundColor: isVacant ? '#faf9f5' : '' }}>
                          <td style={{ fontSize: '0.85rem' }}>{row.kecamatan}</td>
                          <td style={{ fontSize: '0.85rem' }}>{row.kelurahan}</td>
                          <td className="font-mono">{row.lingkungan}</td>
                          <td style={{ fontWeight: 800 }}>
                            {isVacant ? (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500 }}>
                                (Belum Terisi)
                              </span>
                            ) : row.nama_kepling}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{row.pembina || '-'}</td>
                          <td>
                            <span className={`brutal-badge ${row.akun_perisai === 'YA' ? 'success' : 'danger'}`}>
                              {row.akun_perisai || 'TIDAK'}
                            </span>
                          </td>
                          <td className="font-mono">{row.id_akun_perisai || '-'}</td>
                          <td>
                            {kAcquisitions.length > 0 ? (
                              <button
                                className={`brutal-badge ${kAcquisitions.length >= 25 ? 'success' : 'warning'}`}
                                style={{ cursor: 'pointer', border: 'var(--border-thin)', padding: '4px 10px', fontWeight: 900, display: 'inline-block' }}
                                onClick={() => setSelectedKeplingForAcquisitions({ kepling: row, acquisitions: kAcquisitions })}
                                title="Klik untuk lihat detail data akuisisi"
                              >
                                {kAcquisitions.length >= 25 ? `Tercapai 🏆 (${kAcquisitions.length})` : `${kAcquisitions.length} / 25`}
                              </button>
                            ) : (
                              <span className="brutal-badge" style={{ backgroundColor: '#fca5a5', color: '#1a1a1a', border: 'var(--border-thin)', padding: '4px 10px', display: 'inline-block', fontWeight: 900 }}>
                                0 / 25
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                className="brutal-btn cyan"
                                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                onClick={() => setSelectedKeplingForEdit({ ...row })}
                              >
                                Edit
                              </button>
                              <button 
                                className="brutal-btn orange"
                                style={{ padding: '6px 10px', fontSize: '0.8rem', backgroundColor: '#ef4444', color: '#fff' }}
                                onClick={() => handleDeleteKepling(row.kecamatan, row.kelurahan, row.lingkungan)}
                                disabled={isVacant}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginTop: '10px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                    Menampilkan {paginatedKeplings.length} dari {filteredKeplings.length} Kepling
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      className="brutal-btn white"
                      style={{ padding: '8px 12px' }}
                      disabled={keplingPage === 1}
                      onClick={() => setKeplingPage(prev => Math.max(prev - 1, 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <span className="font-mono" style={{ fontWeight: 800 }}>
                      Halaman {keplingPage} dari {totalPages}
                    </span>
                    
                    <button 
                      className="brutal-btn white"
                      style={{ padding: '8px 12px' }}
                      disabled={keplingPage === totalPages}
                      onClick={() => setKeplingPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h2>
              <Database size={24} style={{ display: 'inline', transform: 'rotate(-5deg)', marginRight: '8px' }} /> 
              PORTAL AKUISISI
            </h2>
            <p>BPJS Ketenagakerjaan</p>
          </div>
          
          <form onSubmit={handleLogin}>
            {loginError && (
              <div style={{
                background: 'var(--danger)',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-flat-sm)',
                padding: '10px 12px',
                fontWeight: 800,
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                transform: 'rotate(-0.5deg)'
              }}>
                <AlertCircle size={18} />
                <span>{loginError}</span>
              </div>
            )}
            
            <div className="brutal-field" style={{ marginBottom: '20px' }}>
              <label className="brutal-label" htmlFor="username" style={{ fontSize: '0.8rem' }}>Username</label>
              <input 
                id="username"
                type="text" 
                className="brutal-input" 
                placeholder="Nama Pengguna"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="brutal-field" style={{ marginBottom: '25px' }}>
              <label className="brutal-label" htmlFor="password" style={{ fontSize: '0.8rem' }}>Password (NIM)</label>
              <input 
                id="password"
                type="password" 
                className="brutal-input" 
                placeholder="NIM"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="brutal-btn login-btn">
              MASUK
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <h2>
              <Database size={24} style={{ display: 'inline', transform: 'rotate(-5deg)', marginRight: '5px' }} /> 
              Akuisisi
            </h2>
            <p>BPJS Ketenagakerjaan</p>
          </div>
          
          <nav className="nav-links">
            <button 
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentView('dashboard'); fetchPembinaStats(); }}
            >
              <Users size={18} />
              Dashboard
            </button>
            <button 
              className={`nav-btn ${currentView === 'extract' ? 'active' : ''}`}
              onClick={() => setCurrentView('extract')}
            >
              <UploadCloud size={18} />
              Ekstrak PDF
            </button>
            <button 
              className={`nav-btn ${currentView === 'kepling' ? 'active' : ''}`}
              onClick={() => { setCurrentView('kepling'); fetchKeplings(); }}
            >
              <Shield size={18} />
              Data Kepling
            </button>
          </nav>
        </div>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Operator</p>
            <p style={{ fontWeight: 900, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={namaPengisi}>
              {namaPengisi}
            </p>
            <span className="nim">{nim}</span>
          </div>
          <button 
            className="brutal-btn" 
            style={{ 
              backgroundColor: 'var(--danger)', 
              color: 'var(--text-main)',
              padding: '8px 12px',
              fontSize: '0.8rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '5px',
              boxShadow: 'var(--shadow-flat-sm)'
            }}
            onClick={handleLogout}
          >
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="main-content">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'extract' && renderExtract()}
        {currentView === 'kepling' && renderKeplingView()}
      </main>

      {/* Modal Detail Pembina (Neobrutalist) */}
      {selectedPembina && (
        <div className="brutal-modal-backdrop" onClick={() => setSelectedPembina(null)}>
          <div className="brutal-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="brutal-modal-header">
              <h3 className="brutal-modal-title">
                Detail Akuisisi: {selectedPembina.pembina}
              </h3>
              <button className="brutal-modal-close" onClick={() => setSelectedPembina(null)}>
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
                    {selectedPembina.acquisitions.map((item, index) => (
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
              <button className="brutal-btn white" onClick={() => setSelectedPembina(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Kepling (Neobrutalist) */}
      {selectedKeplingForEdit && (
        <div className="brutal-modal-backdrop" onClick={() => setSelectedKeplingForEdit(null)}>
          <div className="brutal-modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpdateKepling}>
              <div className="brutal-modal-header" style={{ backgroundColor: 'var(--accent-purple)' }}>
                <h3 className="brutal-modal-title">
                  Edit Kepling: {selectedKeplingForEdit.kecamatan} - {selectedKeplingForEdit.kelurahan} - Lingk. {selectedKeplingForEdit.lingkungan}
                </h3>
                <button type="button" className="brutal-modal-close" onClick={() => setSelectedKeplingForEdit(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="brutal-modal-body" style={{ maxHeight: '65vh' }}>
                <div className="brutal-form-section" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px 25px' }}>
                  <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Pembina Wilayah</label>
                    <select 
                      className="brutal-input" 
                      value={selectedKeplingForEdit.pembina || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, pembina: e.target.value }))}
                      style={{ padding: '11px' }}
                    >
                      <option value="">Pilih Pembina</option>
                      {uniquePembinas.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Kepling</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={selectedKeplingForEdit.nama_kepling || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, nama_kepling: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>NIK Kepling</label>
                    <input 
                      type="text" 
                      className="brutal-input font-mono" 
                      value={selectedKeplingForEdit.nik || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, nik: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>No HP Kepling</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={selectedKeplingForEdit.no_hp || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, no_hp: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Email Kepling</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={selectedKeplingForEdit.email || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Status Akun Perisai</label>
                    <select 
                      className="brutal-input" 
                      value={selectedKeplingForEdit.akun_perisai || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, akun_perisai: e.target.value }))}
                      style={{ padding: '11px' }}
                    >
                      <option value="">Pilih Status</option>
                      <option value="YA">YA (Aktif/Proses)</option>
                      <option value="TIDAK">TIDAK</option>
                    </select>
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>ID Akun Perisai (Kode Perisai)</label>
                    <input 
                      type="text" 
                      className="brutal-input font-mono" 
                      value={selectedKeplingForEdit.id_akun_perisai || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, id_akun_perisai: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Akun Perisai</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={selectedKeplingForEdit.nama_akun_perisai || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, nama_akun_perisai: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Bank</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={selectedKeplingForEdit.nama_bank || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, nama_bank: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nomor Rekening Bank</label>
                    <input 
                      type="text" 
                      className="brutal-input font-mono" 
                      value={selectedKeplingForEdit.nomor_rekening || ''}
                      onChange={(e) => setSelectedKeplingForEdit(prev => ({ ...prev, nomor_rekening: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="brutal-modal-footer">
                <button 
                  type="button" 
                  className="brutal-btn white" 
                  style={{ marginRight: '10px' }} 
                  onClick={() => setSelectedKeplingForEdit(null)}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="brutal-btn success"
                  disabled={keplingUpdating}
                >
                  {keplingUpdating ? <span className="loading-spinner"></span> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Kepling Baru / Isi Kepling Kosong (Neobrutalist) */}
      {showAddModal && (
        <div className="brutal-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="brutal-modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateKepling}>
              <div className="brutal-modal-header" style={{ backgroundColor: 'var(--primary)' }}>
                <h3 className="brutal-modal-title">Isi Detail Kepling Kosong</h3>
                <button type="button" className="brutal-modal-close" onClick={() => setShowAddModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="brutal-modal-body" style={{ maxHeight: '65vh' }}>
                <div style={{ background: '#f0ede4', border: 'var(--border-thin)', padding: '10px 15px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 800 }}>
                  📝 Pilih wilayah kosong di bawah ini untuk mengisi detail profil Kepling-nya.
                </div>

                <div className="brutal-form-section" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px 25px' }}>
                  
                  {/* Dropdown for Kecamatan (from vacant list only) */}
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Kecamatan *</label>
                    <select 
                      className="brutal-input" 
                      value={newKeplingData.kecamatan}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, kecamatan: e.target.value, kelurahan: '', lingkungan: '' }))}
                      required
                      style={{ padding: '11px' }}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {vacantKecamatans.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Dropdown for Kelurahan (from vacant list only) */}
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Kelurahan *</label>
                    <select 
                      className="brutal-input" 
                      value={newKeplingData.kelurahan}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, kelurahan: e.target.value, lingkungan: '' }))}
                      disabled={!newKeplingData.kecamatan}
                      required
                      style={{ padding: '11px' }}
                    >
                      <option value="">Pilih Kelurahan</option>
                      {getVacantKelurahansForKecamatan(newKeplingData.kecamatan).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dropdown for Lingkungan / Wilayah (from vacant list only) */}
                  <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Lingkungan / Wilayah *</label>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={isCustomLingkungan}
                          onChange={(e) => setIsCustomLingkungan(e.target.checked)}
                        />
                        Input Manual (Tulis Sendiri)
                      </label>
                    </div>
                    
                    {isCustomLingkungan ? (
                      <input 
                        type="text" 
                        className="brutal-input font-mono"
                        placeholder="Contoh: I, II, 001, atau nama wilayah"
                        value={customLingkungan}
                        onChange={(e) => setCustomLingkungan(e.target.value)}
                        required
                      />
                    ) : (
                      <select 
                        className="brutal-input" 
                        value={newKeplingData.lingkungan}
                        onChange={(e) => setNewKeplingData(prev => ({ ...prev, lingkungan: e.target.value }))}
                        disabled={!newKeplingData.kelurahan}
                        required
                        style={{ padding: '11px' }}
                      >
                        <option value="">Pilih Lingkungan</option>
                        {getVacantLingkungsForKelurahan(newKeplingData.kecamatan, newKeplingData.kelurahan).map(l => (
                          <option key={l} value={l}>Lingkungan {l}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Pembina dropdown select */}
                  <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Pembina Wilayah *</label>
                    <select 
                      className="brutal-input" 
                      value={newKeplingData.pembina}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, pembina: e.target.value }))}
                      required
                      style={{ padding: '11px' }}
                    >
                      <option value="">Pilih Pembina</option>
                      {uniquePembinas.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Kepling</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={newKeplingData.nama_kepling}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, nama_kepling: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>NIK Kepling</label>
                    <input 
                      type="text" 
                      className="brutal-input font-mono" 
                      value={newKeplingData.nik}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, nik: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>No HP Kepling</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={newKeplingData.no_hp}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, no_hp: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Email Kepling</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={newKeplingData.email}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Status Akun Perisai</label>
                    <select 
                      className="brutal-input" 
                      value={newKeplingData.akun_perisai}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, akun_perisai: e.target.value }))}
                      style={{ padding: '11px' }}
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA (Aktif/Proses)</option>
                    </select>
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>ID Akun Perisai (Kode Perisai)</label>
                    <input 
                      type="text" 
                      className="brutal-input font-mono" 
                      value={newKeplingData.id_akun_perisai}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, id_akun_perisai: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Akun Perisai</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={newKeplingData.nama_akun_perisai}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, nama_akun_perisai: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field">
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nama Bank</label>
                    <input 
                      type="text" 
                      className="brutal-input" 
                      value={newKeplingData.nama_bank}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, nama_bank: e.target.value }))}
                    />
                  </div>
                  <div className="brutal-field" style={{ gridColumn: 'span 2' }}>
                    <label className="brutal-label" style={{ fontSize: '0.8rem' }}>Nomor Rekening Bank</label>
                    <input 
                      type="text" 
                      className="brutal-input font-mono" 
                      value={newKeplingData.nomor_rekening}
                      onChange={(e) => setNewKeplingData(prev => ({ ...prev, nomor_rekening: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="brutal-modal-footer">
                <button 
                  type="button" 
                  className="brutal-btn white" 
                  style={{ marginRight: '10px' }} 
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="brutal-btn success"
                  disabled={keplingUpdating}
                >
                  {keplingUpdating ? <span className="loading-spinner"></span> : 'Simpan Detail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Akuisisi Kepling (Neobrutalist) [NEW] */}
      {selectedKeplingForAcquisitions && (
        <div className="brutal-modal-backdrop" onClick={() => setSelectedKeplingForAcquisitions(null)}>
          <div className="brutal-modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div className="brutal-modal-header" style={{ backgroundColor: 'var(--primary)' }}>
              <h3 className="brutal-modal-title">
                Data Akuisisi: {selectedKeplingForAcquisitions.kepling.nama_kepling || 'Kepling Belum Terisi'}
              </h3>
              <button className="brutal-modal-close" onClick={() => setSelectedKeplingForAcquisitions(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="brutal-modal-body" style={{ maxHeight: '65vh' }}>
              <div style={{ background: '#fdfbf2', border: 'var(--border-thin)', padding: '12px 18px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 800 }}>
                📍 Wilayah: Kec. {selectedKeplingForAcquisitions.kepling.kecamatan} - Kel. {selectedKeplingForAcquisitions.kepling.kelurahan} - Lingk. {selectedKeplingForAcquisitions.kepling.lingkungan}
                <br />
                👤 Pembina Wilayah: {selectedKeplingForAcquisitions.kepling.pembina || 'Belum di-assign'}
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
                    {selectedKeplingForAcquisitions.acquisitions.map((item, index) => (
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
            
            <div className="brutal-modal-footer">
              <button className="brutal-btn white" onClick={() => setSelectedKeplingForAcquisitions(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
