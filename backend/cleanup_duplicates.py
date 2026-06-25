import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_all_keplings():
    print("Fetching all keplings...")
    all_data = []
    offset = 0
    page_size = 1000
    while True:
        res = supabase.table("keplings").select("*").range(offset, offset + page_size - 1).execute()
        batch = res.data
        if not batch:
            break
        all_data.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    print(f"Fetched {len(all_data)} records.")
    return all_data

def score_record(r):
    """
    Score a record based on how many fields are filled.
    """
    score = 0
    for k, v in r.items():
        if k in ['id', 'created_at', 'no']: continue
        if v and str(v).strip():
            score += 1
    return score

def cleanup():
    keplings = fetch_all_keplings()
    
    # Key: (kec, kel, lingk) standardized
    # Value: List of records matching this key
    groups = {}
    
    for r in keplings:
        kec = str(r.get('kecamatan', '')).strip().upper()
        kel = str(r.get('kelurahan', '')).strip().upper()
        lingk = str(r.get('lingkungan', '')).strip().upper()
        
        key = (kec, kel, lingk)
        if key not in groups:
            groups[key] = []
        groups[key].append(r)
    
    to_delete = []
    to_update = []
    
    print(f"Found {len(groups)} unique wilayah groups.")
    
    for key, records in groups.items():
        if len(records) > 1:
            # Sort by score descending, then by id ascending (keep older one if scores tie)
            records.sort(key=lambda x: (score_record(x), -x['id']), reverse=True)
            
            winner = records[0]
            losers = records[1:]
            
            print(f"Group {key}: Found {len(records)} records. Keeping ID {winner['id']}, deleting IDs {[l['id'] for l in losers]}")
            
            for l in losers:
                to_delete.append(l['id'])
            
            # Standardize winner's wilayah (trim any spaces)
            to_update.append({
                "id": winner["id"],
                "kecamatan": key[0],
                "kelurahan": key[1],
                "lingkungan": key[2]
            })
        else:
            # Even if no duplicate, standardize the wilayah spaces
            r = records[0]
            if r['kecamatan'] != key[0] or r['kelurahan'] != key[1] or r['lingkungan'] != key[2]:
                to_update.append({
                    "id": r["id"],
                    "kecamatan": key[0],
                    "kelurahan": key[1],
                    "lingkungan": key[2]
                })

    # Perform updates
    if to_update:
        print(f"Standardizing whitespace for {len(to_update)} records...")
        for r in to_update:
            supabase.table("keplings").update({
                "kecamatan": r["kecamatan"],
                "kelurahan": r["kelurahan"],
                "lingkungan": r["lingkungan"]
            }).eq("id", r["id"]).execute()

    # Perform deletions
    if to_delete:
        print(f"Deleting {len(to_delete)} duplicate records...")
        # Supabase doesn't support bulk delete by ID list easily in a single generic .in_ call sometimes 
        # depending on client version, but we can loop or use .in_("id", list)
        chunk_size = 100
        for i in range(0, len(to_delete), chunk_size):
            chunk = to_delete[i:i + chunk_size]
            supabase.table("keplings").delete().in_("id", chunk).execute()
            print(f"Deleted {min(i + chunk_size, len(to_delete))} / {len(to_delete)}")

    print("Cleanup finished!")

if __name__ == "__main__":
    confirm = input("This will delete duplicate records from Supabase. Continue? (y/n): ")
    if confirm.lower() == 'y':
        cleanup()
    else:
        print("Cleanup cancelled.")
