import pdfplumber
import re

def clean_text(text):
    if text is None:
        return ""
    # Remove newlines and extra spaces
    return re.sub(r'\s+', ' ', str(text)).strip()

def extract_data_from_pdf(file_path):
    """
    Extract tables and Kode Perisai from a PDF file.
    Assumes columns contain "Tgl Daftar", "Nama Lengkap", and "NIK".
    Returns a list of dictionaries.
    """
    extracted_data = []
    
    try:
        with pdfplumber.open(file_path) as pdf:
            # Ekstrak Kode Perisai dari teks halaman pertama
            first_page_text = pdf.pages[0].extract_text() or ""
            kode_perisai_match = re.search(r'Kode\s+Perisai\s*:\s*([A-Za-z0-9]+)', first_page_text, re.IGNORECASE)
            kode_perisai = kode_perisai_match.group(1) if kode_perisai_match else ""

            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                        
                    # Assuming first row is header
                    headers = [clean_text(h).lower() for h in table[0]]
                    
                    # Find indices for required columns
                    idx_tgl = -1
                    idx_nama = -1
                    idx_nik = -1
                    
                    for i, h in enumerate(headers):
                        h_clean = h.strip()
                        if h_clean in ["tgl daftar", "tanggal daftar"]:
                            idx_tgl = i
                        elif h_clean in ["nama lengkap", "nama"]:
                            idx_nama = i
                        elif h_clean == "nik":
                            idx_nik = i
                            
                    start_row = 1
                    # Jika tidak menemukan header secara lengkap, periksa apakah ini tabel data murni
                    if idx_tgl == -1 or idx_nik == -1 or idx_nama == -1:
                        # Cek apakah baris pertama menyerupai data (kolom 1 adalah nomor, kolom 4 adalah NIK)
                        if len(table[0]) >= 4 and clean_text(table[0][0]).isdigit():
                            idx_tgl = 1
                            idx_nama = 2
                            idx_nik = 3
                            start_row = 0
                            
                    # Iterate rows
                    for row in table[start_row:]:
                        if len(row) <= max(idx_tgl, idx_nama, idx_nik):
                            continue # Skip malformed rows
                            
                        # Extract data based on indices
                        tgl_daftar = clean_text(row[idx_tgl]) if idx_tgl != -1 else ""
                        nama_lengkap = clean_text(row[idx_nama]) if idx_nama != -1 else ""
                        nik = clean_text(row[idx_nik]) if idx_nik != -1 else ""
                        
                        # Sometimes PDF parser splits numbers with spaces or newlines
                        nik = nik.replace(" ", "").replace("\n", "")
                        
                        # Hanya tambahkan jika NIK berupa angka 16 digit atau minimal ada nama
                        if nama_lengkap or nik:
                            extracted_data.append({
                                'Kode Perisai': kode_perisai,
                                'Tgl Daftar': tgl_daftar,
                                'Nama Lengkap': nama_lengkap,
                                'NIK': nik
                            })
                            
            # Fallback jika tidak ada data dari tabel (misal karena garis tabel tidak terdeteksi)
            if not extracted_data:
                for page in pdf.pages:
                    text = page.extract_text()
                    if not text: continue
                    lines = text.split('\n')
                    for line in lines:
                        # Cari NIK (16 digit angka berjejer)
                        nik_match = re.search(r'\b(\d{16})\b', line)
                        if nik_match:
                            nik = nik_match.group(1)
                            # Cari tanggal daftar (contoh: 01-05-2024 atau 01/05/2024)
                            tgl_match = re.search(r'\b(\d{2}[-/]\d{2}[-/]\d{4})\b', line)
                            tgl_daftar = tgl_match.group(1) if tgl_match else ""
                            
                            # Nama lengkap biasanya teks selain angka NIK, Tanggal, dan No Urut
                            nama_raw = line.replace(nik, "").replace(tgl_daftar, "").strip()
                            # Hapus no urut di awal baris jika ada
                            nama_lengkap = re.sub(r'^\d+[\s\.]+', '', nama_raw).strip()
                            # Hapus karakter aneh sisa
                            nama_lengkap = re.sub(r'[^A-Za-z\s,\.]', '', nama_lengkap).strip()
                            
                            extracted_data.append({
                                'Kode Perisai': kode_perisai,
                                'Tgl Daftar': tgl_daftar,
                                'Nama Lengkap': nama_lengkap,
                                'NIK': nik
                            })
                            
    except Exception as e:
        print(f"Error processing PDF: {e}")
        
    return extracted_data
