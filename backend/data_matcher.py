import pandas as pd
import os

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "PEMBAGIAN KEPLING TERBARU - UPDATE KEPLING.csv")

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
    
    matched_data = []
    tuntungan_data = []
    error_log = []

    if df_ref is None or df_ref.empty:
        # If no DB, everything is an error or not found
        for record in extracted_data:
            record['Kecamatan'] = "Data Tidak Ditemukan"
            record['Kelurahan'] = "Data Tidak Ditemukan"
            record['Lingkungan'] = "Data Tidak Ditemukan"
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
            record['Status'] = "Ditemukan"
            # Check for Tuntungan
            if "tuntungan" in kecamatan.lower() or "tuntungan" in kelurahan.lower():
                tuntungan_data.append(record)
            else:
                matched_data.append(record)
        else:
            record['Status'] = "Kode Perisai Tidak Ditemukan di Database"
            error_log.append(record)

    return matched_data, tuntungan_data, error_log
