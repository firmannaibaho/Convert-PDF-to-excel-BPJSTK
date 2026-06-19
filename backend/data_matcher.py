import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # User Service Role for backend operations

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Path CSV (masih dipertahankan sebagai fallback atau download)
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "PEMBAGIAN KEPLING TERBARU - UPDATE KEPLING.csv")
UDAH_ADA_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "FORM RESULT - FORM.csv")

def fetch_all_from_supabase(table: str, columns: str = "*", page_size: int = 1000):
    """
    Fetch all rows from a Supabase table using pagination.
    Supabase defaults to max 1000 rows per query, so we paginate.
    """
    all_data = []
    offset = 0
    while True:
        try:
            response = supabase.table(table).select(columns)\
                .range(offset, offset + page_size - 1)\
                .execute()
            batch = response.data
            if not batch:
                break
            all_data.extend(batch)
            if len(batch) < page_size:
                break
            offset += page_size
        except Exception as e:
            print(f"Error fetching from {table} at offset {offset}: {e}")
            break
    return all_data

def get_all_keplings():
    """
    Fetch all keplings from Supabase database (with pagination).
    """
    return fetch_all_from_supabase("keplings")


def load_already_extracted_niks():
    """
    Load already extracted NIKs from Supabase form_results table (with pagination).
    """
    try:
        all_records = fetch_all_from_supabase("form_results", columns="nik")
        return set(item['nik'] for item in all_records)
    except Exception as e:
        print(f"Error loading extracted NIKs: {e}")
        return set()


def mark_niks_as_extracted(records, nama_pengisi="Firman Karunia Naibaho", nim="2313402074"):
    """
    Insert new records into form_results table in Supabase.
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
        
        parts = [p for p in [kec, kel, lingk] if p]
        wilayah = "-".join(parts) if parts else "-"
        
        nik = str(record.get('NIK', '')).strip()
        if nik.endswith('.0'):
            nik = nik[:-2]
            
        if not nik.isdigit() or len(nik) != 16:
            continue
            
        row = {
            'tanggal': current_date,
            'jam': current_time,
            'nama_pengisi': nama_pengisi,
            'nim': str(nim),
            'wilayah': wilayah,
            'nik': nik,
            'nama_tk': str(record.get('Nama Lengkap', '')).strip(),
            'no_telepon': str(record.get('No Telepon', '-')).strip(),
            'tanggal_pendaftaran': str(record.get('Tgl Daftar', '')).strip()
        }
        rows.append(row)
        
    if not rows:
        return
        
    try:
        # Using upsert to avoid duplicate NIK errors
        supabase.table("form_results").upsert(rows, on_conflict="nik").execute()
    except Exception as e:
        print(f"Error saving to Supabase form_results: {e}")

def match_data(extracted_data):
    """
    Match extracted data against the Supabase database.
    """
    keplings = get_all_keplings()
    already_extracted_niks = load_already_extracted_niks()
    
    # Convert keplings list to a dictionary for faster lookup by id_akun_perisai
    kepling_map = {}
    for k in keplings:
        kode = str(k.get('id_akun_perisai', '')).strip().upper()
        if kode and kode not in kepling_map:
            kepling_map[kode] = k

    matched_data = []
    tuntungan_data = []
    error_log = []

    for record in extracted_data:
        nik = str(record.get('NIK', '')).strip()
        kode_perisai = str(record.get('Kode Perisai', '')).strip().upper()
        
        match = kepling_map.get(kode_perisai)
        
        if match:
            kecamatan = str(match.get('kecamatan', '')).strip()
            kelurahan = str(match.get('kelurahan', '')).strip()
            lingkungan = str(match.get('lingkungan', '')).strip()
        else:
            kecamatan = "Data Tidak Ditemukan"
            kelurahan = "Data Tidak Ditemukan"
            lingkungan = "Data Tidak Ditemukan"
            
        record['Kecamatan'] = kecamatan
        record['Kelurahan'] = kelurahan
        record['Lingkungan'] = lingkungan
        
        if not nik or len(nik) != 16 or not nik.isdigit():
            record['Status'] = "Format NIK Tidak Valid / Kosong"
            error_log.append(record)
            continue
            
        if match:
            if nik in already_extracted_niks:
                record['Status'] = "Sudah Pernah Diekspor"
                matched_data.append(record)
            else:
                record['Status'] = "Ditemukan"
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
    Calculate acquisition statistics using Supabase data.
    Only counts acquisitions within the 3 target districts:
    Medan Kota, Medan Timur, and Medan Tuntungan.
    """
    TARGET_DISTRICTS = {"MEDAN KOTA", "MEDAN TIMUR", "MEDAN TUNTUNGAN"}
    keplings = get_all_keplings()
    
    form_results = fetch_all_from_supabase("form_results")
        
    region_to_pembina = {}
    pembina_regions_count = {}
    
    for row in keplings:
        pembina = str(row.get('pembina', '')).strip()
        if not pembina:
            continue
            
        kec = str(row.get('kecamatan', '')).strip().upper()
        # Only include keplings from the 3 target districts
        if kec not in TARGET_DISTRICTS:
            continue
        kel = str(row.get('kelurahan', '')).strip().upper()
        lingk = str(row.get('lingkungan', '')).strip().upper()
        
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

    for row in form_results:
        wilayah = str(row.get('wilayah', '')).strip().upper()
        # Only count results from the 3 target districts
        is_target = any(district in wilayah for district in TARGET_DISTRICTS)
        if not is_target:
            continue

        pembina = region_to_pembina.get(wilayah, unknown_pembina)
        
        record_detail = {
            "nik": row.get('nik'),
            "nama_tk": row.get('nama_tk'),
            "wilayah": wilayah,
            "tgl_daftar": row.get('tanggal_pendaftaran'),
            "tanggal_input": row.get('tanggal'),
            "jam_input": row.get('jam'),
            "nama_pengisi": row.get('nama_pengisi'),
            "nim": row.get('nim'),
            "no_telp": row.get('no_telepon')
        }
        
        if pembina in pembina_stats:
            pembina_stats[pembina]["total_acquisitions"] += 1
            pembina_stats[pembina]["acquisitions"].append(record_detail)

    stats_list = list(pembina_stats.values())
    stats_list = [s for s in stats_list if s["pembina"] != unknown_pembina]
    stats_list.sort(key=lambda x: x["total_acquisitions"], reverse=True)
    
    return stats_list

def update_kepling_details(data: dict):
    """
    Update kepling details in Supabase.
    """
    kec = str(data.get('kecamatan', '')).strip().upper()
    kel = str(data.get('kelurahan', '')).strip().upper()
    lingk = str(data.get('lingkungan', '')).strip().upper()

    # Define value mapping
    update_vals = {}
    if 'nama_kepling' in data: update_vals['nama_kepling'] = str(data['nama_kepling']).strip()
    if 'nama_akun_perisai' in data: update_vals['nama_akun_perisai'] = str(data['nama_akun_perisai']).strip()
    if 'id_akun_perisai' in data: update_vals['id_akun_perisai'] = str(data['id_akun_perisai']).strip().upper()
    if 'nik' in data: update_vals['nik'] = str(data['nik']).strip()
    if 'no_hp' in data: update_vals['no_hp'] = str(data['no_hp']).strip()
    if 'nama_bank' in data: update_vals['nama_bank'] = str(data['nama_bank']).strip()
    if 'nomor_rekening' in data: update_vals['nomor_rekening'] = str(data['nomor_rekening']).strip()
    if 'email' in data: update_vals['email'] = str(data['email']).strip()
    if 'akun_perisai' in data: update_vals['akun_perisai'] = str(data['akun_perisai']).strip()
    if 'no_kpj' in data: update_vals['no_kpj'] = str(data['no_kpj']).strip()
    if 'no_sertifikat' in data: update_vals['no_sertifikat'] = str(data['no_sertifikat']).strip()
    if 'jenjang_pendidikan' in data: update_vals['jenjang_pendidikan'] = str(data['jenjang_pendidikan']).strip()
    if 'rekening_aktif' in data: update_vals['rekening_aktif'] = str(data['rekening_aktif']).strip()
    if 'berkas_pendaftaran' in data: update_vals['berkas_pendaftaran'] = str(data['berkas_pendaftaran']).strip()
    if 'terdaftar_bpu' in data: update_vals['terdaftar_bpu'] = str(data['terdaftar_bpu']).strip()
    if 'perisai_sudah_aktif' in data: update_vals['perisai_sudah_aktif'] = str(data['perisai_sudah_aktif']).strip()
    if 'perisai_sudah_proses_aktivasi' in data: update_vals['perisai_sudah_proses_aktivasi'] = str(data['perisai_sudah_proses_aktivasi']).strip()

    try:
        res = supabase.table("keplings").update(update_vals)\
            .eq("kecamatan", kec)\
            .eq("kelurahan", kel)\
            .eq("lingkungan", lingk)\
            .execute()
        
        if res.data:
            return True
        else:
            raise ValueError(f"Kepling di wilayah {kec}-{kel}-{lingk} tidak ditemukan.")
    except Exception as e:
        print(f"Error updating kepling in Supabase: {e}")
        raise e

def create_kepling_record(data: dict):
    """
    Create or update a kepling record in Supabase.
    """
    kec = str(data.get('kecamatan', '')).strip().upper()
    kel = str(data.get('kelurahan', '')).strip().upper()
    lingk = str(data.get('lingkungan', '')).strip().upper()
    
    new_record = {
        "pembina": str(data.get('pembina', '')).strip(),
        "kecamatan": kec,
        "kelurahan": kel,
        "lingkungan": lingk,
        "nama_kepling": str(data.get('nama_kepling', '')).strip(),
        "nama_akun_perisai": str(data.get('nama_akun_perisai', '')).strip(),
        "id_akun_perisai": str(data.get('id_akun_perisai', '')).strip().upper(),
        "nik": str(data.get('nik', '')).strip(),
        "no_hp": str(data.get('no_hp', '')).strip(),
        "nama_bank": str(data.get('nama_bank', '')).strip(),
        "nomor_rekening": str(data.get('nomor_rekening', '')).strip(),
        "email": str(data.get('email', '')).strip(),
        "akun_perisai": str(data.get('akun_perisai', '')).strip(),
        "no_kpj": str(data.get('no_kpj', '')).strip(),
        "no_sertifikat": str(data.get('no_sertifikat', '')).strip(),
        "jenjang_pendidikan": str(data.get('jenjang_pendidikan', '')).strip(),
        "rekening_aktif": str(data.get('rekening_aktif', '')).strip(),
        "berkas_pendaftaran": str(data.get('berkas_pendaftaran', 'LENGKAP')).strip(),
        "terdaftar_bpu": str(data.get('terdaftar_bpu', '')).strip(),
        "perisai_sudah_aktif": str(data.get('perisai_sudah_aktif', '')).strip(),
        "perisai_sudah_proses_aktivasi": str(data.get('perisai_sudah_proses_aktivasi', '')).strip()
    }
    
    try:
        # Check if exists
        check = supabase.table("keplings").select("id")\
            .eq("kecamatan", kec)\
            .eq("kelurahan", kel)\
            .eq("lingkungan", lingk)\
            .execute()
            
        if check.data:
            supabase.table("keplings").update(new_record).eq("id", check.data[0]['id']).execute()
        else:
            supabase.table("keplings").insert(new_record).execute()
        return True
    except Exception as e:
        print(f"Error creating kepling in Supabase: {e}")
        raise e

def delete_kepling_record(kecamatan: str, kelurahan: str, lingkungan: str):
    """
    Clear kepling details in Supabase (don't delete row, just clear fields to match original CSV logic).
    """
    kec = str(kecamatan).strip().upper()
    kel = str(kelurahan).strip().upper()
    lingk = str(lingkungan).strip().upper()
    
    clear_vals = {
        'nama_kepling': "",
        'nama_akun_perisai': "",
        'id_akun_perisai': "",
        'nik': "",
        'no_hp': "",
        'nama_bank': "",
        'nomor_rekening': "",
        'akun_perisai': "",
        'email': "",
        'no_kpj': "",
        'no_sertifikat': "",
        'jenjang_pendidikan': "",
        'rekening_aktif': "",
        'berkas_pendaftaran': "TIDAK LENGKAP",
        'terdaftar_bpu': "",
        'perisai_sudah_aktif': "",
        'perisai_sudah_proses_aktivasi': ""
    }
    
    try:
        res = supabase.table("keplings").update(clear_vals)\
            .eq("kecamatan", kec)\
            .eq("kelurahan", kel)\
            .eq("lingkungan", lingk)\
            .execute()
        if res.data:
            return True
        else:
            raise ValueError(f"Kepling di wilayah {kec}-{kel}-{lingk} tidak ditemukan.")
    except Exception as e:
        print(f"Error clearing kepling in Supabase: {e}")
        raise e
