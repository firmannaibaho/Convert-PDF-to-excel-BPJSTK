import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Menggunakan Service Role Key dari .env

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

CSV_PATH_KEPLING = os.path.join(os.path.dirname(os.path.abspath(__file__)), "PEMBAGIAN KEPLING TERBARU - UPDATE KEPLING.csv")
CSV_PATH_FORM = os.path.join(os.path.dirname(os.path.abspath(__file__)), "FORM RESULT - FORM.csv")

def migrate_keplings():
    print("Starting migration: keplings...")
    if not os.path.exists(CSV_PATH_KEPLING):
        print(f"Error: {CSV_PATH_KEPLING} not found.")
        return

    df = pd.read_csv(CSV_PATH_KEPLING, dtype=str).fillna("")
    
    # Mapping CSV columns to DB columns
    # Note: adjust these mappings based on your CSV headers
    records = []
    for _, row in df.iterrows():
        email_col = 'EMAIL ' if 'EMAIL ' in df.columns else 'EMAIL'
        record = {
            "no": str(row.get(df.columns[0], "")),
            "pembina": str(row.get("PEMBINA", "")),
            "kecamatan": str(row.get("KECAMATAN", "")),
            "kelurahan": str(row.get("KELURAHAN", "")),
            "lingkungan": str(row.get("LINGK", "")),
            "akun_perisai": str(row.get("AKUN PERISAI", "")),
            "nama_kepling": str(row.get("NAMA KEPLING", "")),
            "rekening_aktif": str(row.get("REKENING AKTIF", "")),
            "berkas_pendaftaran": str(row.get("BERKAS PENDAFTARAN", "")),
            "nama_akun_perisai": str(row.get("NAMA AKUN PERISAI", "")),
            "nik": str(row.get("NIK", "")),
            "no_kpj": str(row.get("NO KPJ", "")),
            "no_sertifikat": str(row.get("NO SERTIFIKAT", "")),
            "no_hp": str(row.get("NO HP", "")),
            "jenjang_pendidikan": str(row.get("JENJANG PENDIDIKAN", "")),
            "email": str(row.get(email_col, "")),
            "nama_bank": str(row.get("NAMA BANK", "")),
            "nomor_rekening": str(row.get("NOMOR REKENING", "")),
            "id_akun_perisai": str(row.get("ID AKUN PERISAI", "")),
            "terdaftar_bpu": str(row.get("TERDAFTAR BPU", "")),
            "perisai_sudah_aktif": str(row.get("PERISAI SUDAH AKTIF", "")),
            "perisai_sudah_proses_aktivasi": str(row.get("PERISAI YANG SUDAH PROSES AKTIVASI", ""))
        }
        records.append(record)

    # Batch insert (Supabase limit is usually around 1000 records per request)
    chunk_size = 500
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        try:
            supabase.table("keplings").insert(chunk).execute()
            print(f"Migrated {i + len(chunk)} / {len(records)} kepling records.")
        except Exception as e:
            print(f"Error migrating chunk: {e}")

def migrate_form_results():
    print("Starting migration: form_results...")
    if not os.path.exists(CSV_PATH_FORM):
        print(f"Error: {CSV_PATH_FORM} not found.")
        return

    df = pd.read_csv(CSV_PATH_FORM, dtype=str).fillna("")
    
    records = []
    for _, row in df.iterrows():
        record = {
            "tanggal": str(row.get("Tanggal", "")),
            "jam": str(row.get("Jam", "")),
            "nama_pengisi": str(row.get("Nama Pengisi", "")),
            "nim": str(row.get("NIM", "")),
            "wilayah": str(row.get("Wilayah", "")),
            "nik": str(row.get("NIK", "")),
            "nama_tk": str(row.get("Nama TK", "")),
            "no_telepon": str(row.get("No Telepon", "")),
            "tanggal_pendaftaran": str(row.get("Tanggal Pendaftaran", ""))
        }
        # Only add valid looking NIKs for uniqueness
        if len(record['nik']) == 16:
            records.append(record)

    if records:
        try:
            # Using upsert on NIK to avoid duplicate errors
            supabase.table("form_results").upsert(records, on_conflict="nik").execute()
            print(f"Migrated {len(records)} form result records.")
        except Exception as e:
            print(f"Error migrating form results: {e}")

if __name__ == "__main__":
    migrate_keplings()
    migrate_form_results()
    print("Migration finished!")
