import pandas as pd
import os

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "PEMBAGIAN KEPLING TERBARU - UPDATE KEPLING.csv")
UDAH_ADA_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "FORM RESULT - FORM.csv")

def load_csv_data():
    """
    Load CSV data into a pandas DataFrame.
    Returns None if file not found.
    """
    if not os.path.exists(CSV_PATH):
        return None
    try:
        # Read NIK as string to preserve leading zeros
        df = pd.read_csv(CSV_PATH, dtype={'NIK': str})
        return df
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return None

def load_already_extracted_niks():
    """
    Load already extracted NIKs from FORM RESULT - FORM.csv.
    """
    if not os.path.exists(UDAH_ADA_CSV_PATH):
        return set()
    try:
        df = pd.read_csv(UDAH_ADA_CSV_PATH, dtype={'NIK': str})
        if 'NIK' in df.columns:
            # Clean and keep only valid string representations of NIK
            niks = df['NIK'].dropna().astype(str).str.strip()
            # Clean trailing .0 in case of float conversion in the past
            niks = niks.apply(lambda x: x[:-2] if x.endswith('.0') else x)
            # Filter for 16-digit numeric strings
            niks = niks[niks.str.isdigit() & (niks.str.len() == 16)]
            return set(niks.tolist())
    except Exception as e:
        print(f"Error loading already extracted NIKs from FORM RESULT - FORM.csv: {e}")
    return set()

def mark_niks_as_extracted(records, nama_pengisi="Firman Karunia Naibaho", nim="2313402074"):
    """
    Append new records to FORM RESULT - FORM.csv.
    """
    if not records:
        return
        
    import datetime
    current_date = datetime.datetime.now().strftime("%d/%m/%Y")
    current_time = datetime.datetime.now().strftime("%H:%M:%S")
    
    rows = []
    for record in records:
        kec = str(record.get('Kecamatan', '')).strip()
        kel = str(record.get('Kelurahan', '')).strip()
        lingk = str(record.get('Lingkungan', '')).strip()
        
        # Format Wilayah as Kecamatan-Kelurahan-Lingkungan
        parts = [p for p in [kec, kel, lingk] if p]
        wilayah = "-".join(parts) if parts else "-"
        
        nik = str(record.get('NIK', '')).strip()
        if nik.endswith('.0'):
            nik = nik[:-2]
            
        if not nik.isdigit() or len(nik) != 16:
            continue
            
        row = {
            'Tanggal': current_date,
            'Jam': current_time,
            'Nama Pengisi': nama_pengisi,
            'NIM': str(nim),
            'Wilayah': wilayah,
            'NIK': nik,
            'Nama TK': str(record.get('Nama Lengkap', '')).strip(),
            'No Telepon': str(record.get('No Telepon', '-')).strip(),
            'Tanggal Pendaftaran': str(record.get('Tgl Daftar', '')).strip()
        }
        rows.append(row)
        
    if not rows:
        return
        
    df_new = pd.DataFrame(rows)
    cols = ['Tanggal', 'Jam', 'Nama Pengisi', 'NIM', 'Wilayah', 'NIK', 'Nama TK', 'No Telepon', 'Tanggal Pendaftaran']
    df_new = df_new[cols]
    
    if os.path.exists(UDAH_ADA_CSV_PATH):
        try:
            df_old = pd.read_csv(UDAH_ADA_CSV_PATH, dtype=str)
            if 'NIK' in df_old.columns:
                df_old['NIK'] = df_old['NIK'].astype(str).str.strip().apply(lambda x: x[:-2] if x.endswith('.0') else x)
                
            df_combined = pd.concat([df_old, df_new], ignore_index=True)
            df_combined = df_combined.drop_duplicates(subset=['NIK'], keep='first')
            df_combined.to_csv(UDAH_ADA_CSV_PATH, index=False)
        except Exception as e:
            print(f"Error updating FORM RESULT - FORM.csv: {e}")
            df_new.to_csv(UDAH_ADA_CSV_PATH, index=False)
    else:
        df_new.to_csv(UDAH_ADA_CSV_PATH, index=False)

def match_data(extracted_data):
    """
    Match extracted data (list of dicts with 'NIK', 'Tgl Daftar', 'Nama Lengkap') 
    against the local CSV.
    
    Returns:
    - matched_data: List of records that were successfully matched and enriched.
    - tuntungan_data: List of records specifically for "Tuntungan" area.
    - error_log: List of records with invalid NIK or not found in CSV.
    """
    df_ref = load_csv_data()
    already_extracted_niks = load_already_extracted_niks()
    
    matched_data = []
    tuntungan_data = []
    error_log = []

    if df_ref is None or df_ref.empty:
        # If no DB, everything is an error or not found
        for record in extracted_data:
            nik = str(record.get('NIK', '')).strip()
            record['Kecamatan'] = "Data Tidak Ditemukan"
            record['Kelurahan'] = "Data Tidak Ditemukan"
            record['Lingkungan'] = "Data Tidak Ditemukan"
            if nik in already_extracted_niks:
                record['Status'] = "Sudah Pernah Diekspor"
                matched_data.append(record)
            else:
                record['Status'] = "Database CSV Tidak Ditemukan"
                error_log.append(record)
        return matched_data, tuntungan_data, error_log

    # Fill NaN values in df_ref for cleaner string matching
    df_ref = df_ref.fillna("")

    for record in extracted_data:
        nik = str(record.get('NIK', '')).strip()
        kode_perisai = str(record.get('Kode Perisai', '')).strip().upper()
        
        # Match by Kode Perisai
        if kode_perisai:
            match = df_ref[df_ref['ID AKUN PERISAI'].str.strip().str.upper() == kode_perisai]
        else:
            match = pd.DataFrame()
            
        if not match.empty:
            row = match.iloc[0]
            kecamatan = str(row.get('KECAMATAN', '')).strip()
            kelurahan = str(row.get('KELURAHAN', '')).strip()
            lingkungan = str(row.get('LINGK', '')).strip()
        else:
            kecamatan = "Data Tidak Ditemukan"
            kelurahan = "Data Tidak Ditemukan"
            lingkungan = "Data Tidak Ditemukan"
            
        record['Kecamatan'] = kecamatan
        record['Kelurahan'] = kelurahan
        record['Lingkungan'] = lingkungan
        
        # Validation: check if NIK is empty or not 16 digits
        if not nik or len(nik) != 16 or not nik.isdigit():
            record['Status'] = "Format NIK Tidak Valid / Kosong"
            error_log.append(record)
            continue
            
        if not match.empty:
            if nik in already_extracted_niks:
                record['Status'] = "Sudah Pernah Diekspor"
            else:
                record['Status'] = "Ditemukan"
            
            # Check for Tuntungan
            if "tuntungan" in kecamatan.lower() or "tuntungan" in kelurahan.lower():
                tuntungan_data.append(record)
            else:
                matched_data.append(record)
        else:
            if nik in already_extracted_niks:
                record['Status'] = "Sudah Pernah Diekspor"
                matched_data.append(record)
            else:
                record['Status'] = "Kode Perisai Tidak Ditemukan di Database"
                error_log.append(record)

    return matched_data, tuntungan_data, error_log

def get_pembina_statistics():
    """
    Calculate acquisition statistics for each Pembina by matching
    records in FORM RESULT - FORM.csv with their assigned regions in
    PEMBAGIAN KEPLING TERBARU - UPDATE KEPLING.csv.
    """
    df_ref = load_csv_data()
    form_csv_path = UDAH_ADA_CSV_PATH
    
    if not os.path.exists(form_csv_path):
        return []
        
    try:
        df_form = pd.read_csv(form_csv_path, dtype=str)
    except Exception as e:
        print(f"Error loading FORM RESULT - FORM.csv: {e}")
        return []
        
    region_to_pembina = {}
    pembina_regions_count = {}
    
    if df_ref is not None and not df_ref.empty:
        df_ref = df_ref.fillna("")
        for _, row in df_ref.iterrows():
            pembina = str(row.get('PEMBINA', '')).strip()
            if not pembina:
                continue
                
            kec = str(row.get('KECAMATAN', '')).strip().upper()
            if kec not in ["MEDAN KOTA", "MEDAN TUNTUNGAN", "MEDAN TIMUR"]:
                continue
            kel = str(row.get('KELURAHAN', '')).strip().upper()
            lingk = str(row.get('LINGK', '')).strip().upper()
            
            parts = [p for p in [kec, kel, lingk] if p]
            if not parts:
                continue
            region_key = "-".join(parts)
            
            region_to_pembina[region_key] = pembina
            pembina_regions_count[pembina] = pembina_regions_count.get(pembina, 0) + 1

    pembina_stats = {}
    for pembina in pembina_regions_count.keys():
        pembina_stats[pembina] = {
            "pembina": pembina,
            "assigned_regions_count": pembina_regions_count[pembina],
            "total_acquisitions": 0,
            "acquisitions": []
        }
        
    unknown_pembina = "Tidak Terdaftar"
    pembina_stats[unknown_pembina] = {
        "pembina": unknown_pembina,
        "assigned_regions_count": 0,
        "total_acquisitions": 0,
        "acquisitions": []
    }

    if not df_form.empty:
        df_form = df_form.fillna("")
        for _, row in df_form.iterrows():
            wilayah = str(row.get('Wilayah', '')).strip().upper()
            nik = str(row.get('NIK', '')).strip()
            nama_tk = str(row.get('Nama TK', '')).strip()
            tgl_daftar = str(row.get('Tanggal Pendaftaran', '')).strip()
            tanggal_input = str(row.get('Tanggal', '')).strip()
            jam_input = str(row.get('Jam', '')).strip()
            nama_pengisi = str(row.get('Nama Pengisi', '')).strip()
            nim = str(row.get('NIM', '')).strip()
            no_telp = str(row.get('No Telepon', '')).strip()
            
            pembina = region_to_pembina.get(wilayah, unknown_pembina)
            
            record_detail = {
                "nik": nik,
                "nama_tk": nama_tk,
                "wilayah": wilayah,
                "tgl_daftar": tgl_daftar,
                "tanggal_input": tanggal_input,
                "jam_input": jam_input,
                "nama_pengisi": nama_pengisi,
                "nim": nim,
                "no_telp": no_telp
            }
            
            pembina_stats[pembina]["total_acquisitions"] += 1
            pembina_stats[pembina]["acquisitions"].append(record_detail)

    stats_list = list(pembina_stats.values())
    stats_list = [s for s in stats_list if s["pembina"] != unknown_pembina]
    stats_list.sort(key=lambda x: x["total_acquisitions"], reverse=True)
    
    return stats_list

def get_all_keplings():
    df = load_csv_data()
    if df is None or df.empty:
        return []
    df = df.fillna("")
    keplings = []
    for idx, row in df.iterrows():
        email_col = 'EMAIL ' if 'EMAIL ' in df.columns else 'EMAIL'
        keplings.append({
            "no": str(row.get('', row.get(df.columns[0], ''))).strip(),
            "pembina": str(row.get('PEMBINA', '')).strip(),
            "kecamatan": str(row.get('KECAMATAN', '')).strip(),
            "kelurahan": str(row.get('KELURAHAN', '')).strip(),
            "lingkungan": str(row.get('LINGK', '')).strip(),
            "akun_perisai": str(row.get('AKUN PERISAI', '')).strip(),
            "nama_kepling": str(row.get('NAMA KEPLING', '')).strip(),
            "rekening_aktif": str(row.get('REKENING AKTIF', '')).strip(),
            "berkas_pendaftaran": str(row.get('BERKAS PENDAFTARAN', '')).strip(),
            "nama_akun_perisai": str(row.get('NAMA AKUN PERISAI', '')).strip(),
            "nik": str(row.get('NIK', '')).strip(),
            "no_kpj": str(row.get('NO KPJ', '')).strip(),
            "no_sertifikat": str(row.get('NO SERTIFIKAT', '')).strip(),
            "no_hp": str(row.get('NO HP', '')).strip(),
            "jenjang_pendidikan": str(row.get('JENJANG PENDIDIKAN', '')).strip(),
            "email": str(row.get(email_col, '')).strip(),
            "nama_bank": str(row.get('NAMA BANK', '')).strip(),
            "nomor_rekening": str(row.get('NOMOR REKENING', '')).strip(),
            "id_akun_perisai": str(row.get('ID AKUN PERISAI', '')).strip(),
            "terdaftar_bpu": str(row.get('TERDAFTAR BPU', '')).strip(),
            "perisai_sudah_aktif": str(row.get('PERISAI SUDAH AKTIF', '')).strip(),
            "perisai_sudah_proses_aktivasi": str(row.get('PERISAI YANG SUDAH PROSES AKTIVASI', '')).strip()
        })
    return keplings

def update_kepling_details(data: dict):
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError("Database CSV Kepling tidak ditemukan.")
    try:
        df = pd.read_csv(CSV_PATH, dtype=str)
    except Exception as e:
        print(f"Error loading CSV for update: {e}")
        raise e
    kec = str(data.get('kecamatan', '')).strip().upper()
    kel = str(data.get('kelurahan', '')).strip().upper()
    lingk = str(data.get('lingkungan', '')).strip().upper()
    match_mask = (
        (df['KECAMATAN'].astype(str).str.strip().str.upper() == kec) &
        (df['KELURAHAN'].astype(str).str.strip().str.upper() == kel) &
        (df['LINGK'].astype(str).str.strip().str.upper() == lingk)
    )
    if not df[match_mask].empty:
        idx = df[match_mask].index[0]
        if 'nama_kepling' in data:
            df.at[idx, 'NAMA KEPLING'] = str(data['nama_kepling']).strip()
        if 'nama_akun_perisai' in data:
            df.at[idx, 'NAMA AKUN PERISAI'] = str(data['nama_akun_perisai']).strip()
        if 'id_akun_perisai' in data:
            df.at[idx, 'ID AKUN PERISAI'] = str(data['id_akun_perisai']).strip().upper()
        if 'nik' in data:
            df.at[idx, 'NIK'] = str(data['nik']).strip()
        if 'no_hp' in data:
            df.at[idx, 'NO HP'] = str(data['no_hp']).strip()
        if 'nama_bank' in data:
            df.at[idx, 'NAMA BANK'] = str(data['nama_bank']).strip()
        if 'nomor_rekening' in data:
            df.at[idx, 'NOMOR REKENING'] = str(data['nomor_rekening']).strip()
        if 'email' in data:
            email_col = 'EMAIL ' if 'EMAIL ' in df.columns else 'EMAIL'
            df.at[idx, email_col] = str(data['email']).strip()
        if 'akun_perisai' in data:
            df.at[idx, 'AKUN PERISAI'] = str(data['akun_perisai']).strip()
        if 'no_kpj' in data:
            df.at[idx, 'NO KPJ'] = str(data['no_kpj']).strip()
        if 'no_sertifikat' in data:
            df.at[idx, 'NO SERTIFIKAT'] = str(data['no_sertifikat']).strip()
        if 'jenjang_pendidikan' in data:
            df.at[idx, 'JENJANG PENDIDIKAN'] = str(data['jenjang_pendidikan']).strip()
        if 'rekening_aktif' in data:
            df.at[idx, 'REKENING AKTIF'] = str(data['rekening_aktif']).strip()
        if 'berkas_pendaftaran' in data:
            df.at[idx, 'BERKAS PENDAFTARAN'] = str(data['berkas_pendaftaran']).strip()
        if 'terdaftar_bpu' in data:
            df.at[idx, 'TERDAFTAR BPU'] = str(data['terdaftar_bpu']).strip()
        if 'perisai_sudah_aktif' in data:
            df.at[idx, 'PERISAI SUDAH AKTIF'] = str(data['perisai_sudah_aktif']).strip()
        if 'perisai_sudah_proses_aktivasi' in data:
            df.at[idx, 'PERISAI YANG SUDAH PROSES AKTIVASI'] = str(data['perisai_sudah_proses_aktivasi']).strip()
        try:
            df.to_csv(CSV_PATH, index=False)
            return True
        except Exception as e:
            print(f"Error saving updated CSV: {e}")
            raise e
    else:
        raise ValueError(f"Kepling di wilayah {kec}-{kel}-{lingk} tidak ditemukan.")

def create_kepling_record(data: dict):
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError("Database CSV Kepling tidak ditemukan.")
    try:
        df = pd.read_csv(CSV_PATH, dtype=str)
    except Exception as e:
        print(f"Error loading CSV for create: {e}")
        raise e
        
    kec = str(data.get('kecamatan', '')).strip().upper()
    kel = str(data.get('kelurahan', '')).strip().upper()
    lingk = str(data.get('lingkungan', '')).strip().upper()
    
    match_mask = (
        (df['KECAMATAN'].astype(str).str.strip().str.upper() == kec) &
        (df['KELURAHAN'].astype(str).str.strip().str.upper() == kel) &
        (df['LINGK'].astype(str).str.strip().str.upper() == lingk)
    )
    
    email_col = 'EMAIL ' if 'EMAIL ' in df.columns else 'EMAIL'
    
    if not df[match_mask].empty:
        idx = df[match_mask].index[0]
        df.at[idx, 'PEMBINA'] = str(data.get('pembina', '')).strip()
        df.at[idx, 'NAMA KEPLING'] = str(data.get('nama_kepling', '')).strip()
        df.at[idx, 'NAMA AKUN PERISAI'] = str(data.get('nama_akun_perisai', '')).strip()
        df.at[idx, 'ID AKUN PERISAI'] = str(data.get('id_akun_perisai', '')).strip().upper()
        df.at[idx, 'NIK'] = str(data.get('nik', '')).strip()
        df.at[idx, 'NO HP'] = str(data.get('no_hp', '')).strip()
        df.at[idx, 'NAMA BANK'] = str(data.get('nama_bank', '')).strip()
        df.at[idx, 'NOMOR REKENING'] = str(data.get('nomor_rekening', '')).strip()
        df.at[idx, email_col] = str(data.get('email', '')).strip()
        df.at[idx, 'AKUN PERISAI'] = str(data.get('akun_perisai', '')).strip()
        
        df.at[idx, 'NO KPJ'] = str(data.get('no_kpj', '')).strip()
        df.at[idx, 'NO SERTIFIKAT'] = str(data.get('no_sertifikat', '')).strip()
        df.at[idx, 'JENJANG PENDIDIKAN'] = str(data.get('jenjang_pendidikan', '')).strip()
        df.at[idx, 'REKENING AKTIF'] = str(data.get('rekening_aktif', '')).strip()
        df.at[idx, 'BERKAS PENDAFTARAN'] = str(data.get('berkas_pendaftaran', 'LENGKAP')).strip()
        df.at[idx, 'TERDAFTAR BPU'] = str(data.get('terdaftar_bpu', '')).strip()
        df.at[idx, 'PERISAI SUDAH AKTIF'] = str(data.get('perisai_sudah_aktif', '')).strip()
        df.at[idx, 'PERISAI YANG SUDAH PROSES AKTIVASI'] = str(data.get('perisai_sudah_proses_aktivasi', '')).strip()
    else:
        first_col = df.columns[0]
        try:
            nums = pd.to_numeric(df[first_col], errors='coerce').dropna()
            new_no = int(nums.max() + 1) if not nums.empty else 1
        except:
            new_no = len(df) + 1
            
        new_row = {}
        for col in df.columns:
            new_row[col] = ""
            
        new_row[first_col] = str(new_no)
        new_row['PEMBINA'] = str(data.get('pembina', '')).strip()
        new_row['KECAMATAN'] = kec
        new_row['KELURAHAN'] = kel
        new_row['LINGK'] = lingk
        new_row['NAMA KEPLING'] = str(data.get('nama_kepling', '')).strip()
        new_row['NAMA AKUN PERISAI'] = str(data.get('nama_akun_perisai', '')).strip()
        new_row['ID AKUN PERISAI'] = str(data.get('id_akun_perisai', '')).strip().upper()
        new_row['NIK'] = str(data.get('nik', '')).strip()
        new_row['NO HP'] = str(data.get('no_hp', '')).strip()
        new_row['NAMA BANK'] = str(data.get('nama_bank', '')).strip()
        new_row['NOMOR REKENING'] = str(data.get('nomor_rekening', '')).strip()
        new_row[email_col] = str(data.get('email', '')).strip()
        new_row['AKUN PERISAI'] = str(data.get('akun_perisai', '')).strip()
        
        new_row['NO KPJ'] = str(data.get('no_kpj', '')).strip()
        new_row['NO SERTIFIKAT'] = str(data.get('no_sertifikat', '')).strip()
        new_row['JENJANG PENDIDIKAN'] = str(data.get('jenjang_pendidikan', '')).strip()
        new_row['REKENING AKTIF'] = str(data.get('rekening_aktif', '')).strip()
        new_row['BERKAS PENDAFTARAN'] = str(data.get('berkas_pendaftaran', 'LENGKAP')).strip()
        new_row['TERDAFTAR BPU'] = str(data.get('terdaftar_bpu', '')).strip()
        new_row['PERISAI SUDAH AKTIF'] = str(data.get('perisai_sudah_aktif', '')).strip()
        new_row['PERISAI YANG SUDAH PROSES AKTIVASI'] = str(data.get('perisai_sudah_proses_aktivasi', '')).strip()
        
        df_new = pd.DataFrame([new_row])
        df = pd.concat([df, df_new], ignore_index=True)
        
    try:
        df.to_csv(CSV_PATH, index=False)
        return True
    except Exception as e:
        print(f"Error saving Kepling: {e}")
        raise e

def delete_kepling_record(kecamatan: str, kelurahan: str, lingkungan: str):
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError("Database CSV Kepling tidak ditemukan.")
    try:
        df = pd.read_csv(CSV_PATH, dtype=str)
    except Exception as e:
        print(f"Error loading CSV for delete: {e}")
        raise e
        
    kec = str(kecamatan).strip().upper()
    kel = str(kelurahan).strip().upper()
    lingk = str(lingkungan).strip().upper()
    
    match_mask = (
        (df['KECAMATAN'].astype(str).str.strip().str.upper() == kec) &
        (df['KELURAHAN'].astype(str).str.strip().str.upper() == kel) &
        (df['LINGK'].astype(str).str.strip().str.upper() == lingk)
    )
    
    if df[match_mask].empty:
        raise ValueError(f"Kepling di wilayah {kec}-{kel}-{lingk} tidak ditemukan.")
        
    idx = df[match_mask].index[0]
    
    df.at[idx, 'NAMA KEPLING'] = ""
    df.at[idx, 'NAMA AKUN PERISAI'] = ""
    df.at[idx, 'ID AKUN PERISAI'] = ""
    df.at[idx, 'NIK'] = ""
    df.at[idx, 'NO HP'] = ""
    df.at[idx, 'NAMA BANK'] = ""
    df.at[idx, 'NOMOR REKENING'] = ""
    df.at[idx, 'AKUN PERISAI'] = ""
    
    email_col = 'EMAIL ' if 'EMAIL ' in df.columns else 'EMAIL'
    df.at[idx, email_col] = ""
    
    df.at[idx, 'NO KPJ'] = ""
    df.at[idx, 'NO SERTIFIKAT'] = ""
    df.at[idx, 'JENJANG PENDIDIKAN'] = ""
    df.at[idx, 'REKENING AKTIF'] = ""
    df.at[idx, 'BERKAS PENDAFTARAN'] = "TIDAK LENGKAP"
    df.at[idx, 'TERDAFTAR BPU'] = ""
    df.at[idx, 'PERISAI SUDAH AKTIF'] = ""
    df.at[idx, 'PERISAI YANG SUDAH PROSES AKTIVASI'] = ""
    
    try:
        df.to_csv(CSV_PATH, index=False)
        return True
    except Exception as e:
        print(f"Error saving CSV after delete: {e}")
        raise e



