import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

CSV_PATH_KEPLING = os.path.join(os.path.dirname(os.path.abspath(__file__)), "PEMBAGIAN KEPLING TERBARU - UPDATE KEPLING.csv")
CSV_PATH_FORM = os.path.join(os.path.dirname(os.path.abspath(__file__)), "FORM RESULT - FORM.csv")

def clean_nik(nik):
    if not nik: return ""
    s = str(nik).strip()
    if s.endswith('.0'): s = s[:-2]
    return s

def migrate_keplings():
    print("Starting migration: keplings...")
    if not os.path.exists(CSV_PATH_KEPLING):
        print(f"Error: {CSV_PATH_KEPLING} not found.")
        return

    df = pd.read_csv(CSV_PATH_KEPLING, dtype=str).fillna("")
    
    records = []
    for _, row in df.iterrows():
        email_col = 'EMAIL ' if 'EMAIL ' in df.columns else 'EMAIL'
        record = {
            "no": str(row.get(df.columns[0], "")).strip(),
            "pembina": str(row.get("PEMBINA", "")).strip(),
            "kecamatan": str(row.get("KECAMATAN", "")).strip(),
            "kelurahan": str(row.get("KELURAHAN", "")).strip(),
            "lingkungan": str(row.get("LINGK", "")).strip(),
            "akun_perisai": str(row.get("AKUN PERISAI", "")).strip(),
            "nama_kepling": str(row.get("NAMA KEPLING", "")).strip(),
            "rekening_aktif": str(row.get("REKENING AKTIF", "")).strip(),
            "berkas_pendaftaran": str(row.get("BERKAS PENDAFTARAN", "")).strip(),
            "nama_akun_perisai": str(row.get("NAMA AKUN PERISAI", "")).strip(),
            "nik": clean_nik(row.get("NIK", "")),
            "no_kpj": str(row.get("NO KPJ", "")).strip(),
            "no_sertifikat": str(row.get("NO SERTIFIKAT", "")).strip(),
            "no_hp": str(row.get("NO HP", "")).strip(),
            "jenjang_pendidikan": str(row.get("JENJANG PENDIDIKAN", "")).strip(),
            "email": str(row.get(email_col, "")).strip(),
            "nama_bank": str(row.get("NAMA BANK", "")).strip(),
            "nomor_rekening": str(row.get("NOMOR REKENING", "")).strip(),
            "id_akun_perisai": str(row.get("ID AKUN PERISAI", "")).strip().upper(),
            "terdaftar_bpu": str(row.get("TERDAFTAR BPU", "")).strip(),
            "perisai_sudah_aktif": str(row.get("PERISAI SUDAH AKTIF", "")).strip(),
            "perisai_sudah_proses_aktivasi": str(row.get("PERISAI YANG SUDAH PROSES AKTIVASI", "")).strip()
        }
        records.append(record)

    # Kosongkan tabel dulu agar bersih (Opsional, tapi aman untuk migrasi awal)
    # supabase.table("keplings").delete().neq("id", 0).execute()

    chunk_size = 500
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        try:
            supabase.table("keplings").upsert(chunk).execute()
            print(f"Migrated {min(i + chunk_size, len(records))} / {len(records)} kepling records.")
        except Exception as e:
            print(f"Error migrating keplings chunk: {e}")

def migrate_form_results():
    print("Starting migration: form_results...")
    if not os.path.exists(CSV_PATH_FORM):
        print(f"Error: {CSV_PATH_FORM} not found.")
        return

    # Pakai chunksize di pandas agar ramah memori jika file sangat besar
    df = pd.read_csv(CSV_PATH_FORM, dtype=str).fillna("")
    
    all_records = []
    seen_niks = set() # Untuk menghindari duplikat di dalam satu file CSV

    for _, row in df.iterrows():
        nik = clean_nik(row.get("NIK", ""))
        if not nik or len(nik) != 16 or not nik.isdigit():
            continue
        
        if nik in seen_niks:
            continue
        seen_niks.add(nik)

        record = {
            "tanggal": str(row.get("Tanggal", "")).strip(),
            "jam": str(row.get("Jam", "")).strip(),
            "nama_pengisi": str(row.get("Nama Pengisi", "")).strip(),
            "nim": str(row.get("NIM", "")).strip(),
            "wilayah": str(row.get("Wilayah", "")).strip(),
            "nik": nik,
            "nama_tk": str(row.get("Nama TK", "")).strip(),
            "no_telepon": str(row.get("No Telepon", "")).strip(),
            "tanggal_pendaftaran": str(row.get("Tanggal Pendaftaran", "")).strip()
        }
        all_records.append(record)

    print(f"Total valid records to migrate: {len(all_records)}")

    chunk_size = 200 # Lebih kecil agar aman dari timeout
    for i in range(0, len(all_records), chunk_size):
        chunk = all_records[i:i + chunk_size]
        try:
            supabase.table("form_results").upsert(chunk, on_conflict="nik").execute()
            print(f"Migrated {min(i + chunk_size, len(all_records))} / {len(all_records)} form result records.")
        except Exception as e:
            print(f"Error migrating form_results chunk at index {i}: {e}")

if __name__ == "__main__":
    migrate_keplings()
    migrate_form_results()
    print("Migration finished!")
