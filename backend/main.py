import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from pdf_processor import extract_data_from_pdf
from data_matcher import match_data

app = FastAPI(title="BPJS Ketenagakerjaan Data Extraction API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

class ExtractionResponse(BaseModel):
    matched_data: List[dict]
    tuntungan_data: List[dict]
    error_log: List[dict]
    total_extracted: int

class MarkExportedRequest(BaseModel):
    records: List[dict]
    nama_pengisi: str = "Firman Karunia Naibaho"
    nim: str = "2313402074"

class UpdateKeplingRequest(BaseModel):
    kecamatan: str
    kelurahan: str
    lingkungan: str
    nama_kepling: Optional[str] = None
    nama_akun_perisai: Optional[str] = None
    id_akun_perisai: Optional[str] = None
    nik: Optional[str] = None
    no_hp: Optional[str] = None
    nama_bank: Optional[str] = None
    nomor_rekening: Optional[str] = None
    email: Optional[str] = None
    akun_perisai: Optional[str] = None
    no_kpj: Optional[str] = None
    no_sertifikat: Optional[str] = None
    jenjang_pendidikan: Optional[str] = None
    rekening_aktif: Optional[str] = None
    berkas_pendaftaran: Optional[str] = None
    terdaftar_bpu: Optional[str] = None
    perisai_sudah_aktif: Optional[str] = None
    perisai_sudah_proses_aktivasi: Optional[str] = None

class DeleteKeplingRequest(BaseModel):
    kecamatan: str
    kelurahan: str
    lingkungan: str



@app.post("/upload", response_model=ExtractionResponse)
async def upload_pdfs(files: List[UploadFile] = File(...)):
    all_extracted_data = []
    
    try:
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                continue
                
            temp_file_path = os.path.join(TEMP_DIR, file.filename)
            
            # Save uploaded file temporarily
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            # Extract data from PDF
            extracted = extract_data_from_pdf(temp_file_path)
            all_extracted_data.extend(extracted)
            
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
        if not all_extracted_data:
            raise HTTPException(status_code=400, detail="Tidak ada data (Tgl Daftar, Nama Lengkap, NIK) yang ditemukan di dalam PDF yang diunggah.")
            
        # Match data with CSV
        matched, tuntungan, errors = match_data(all_extracted_data)
        
        return {
            "matched_data": matched,
            "tuntungan_data": tuntungan,
            "error_log": errors,
            "total_extracted": len(all_extracted_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mark-exported")
async def mark_exported(payload: MarkExportedRequest):
    try:
        from data_matcher import mark_niks_as_extracted
        mark_niks_as_extracted(payload.records, payload.nama_pengisi, payload.nim)
        return {"status": "success", "message": f"Successfully marked {len(payload.records)} records as exported."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pembina-stats")
async def get_pembina_stats():
    try:
        from data_matcher import get_pembina_statistics
        stats = get_pembina_statistics()
        return stats
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/keplings")
async def get_keplings():
    try:
        from data_matcher import get_all_keplings
        return get_all_keplings()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-kepling")
async def update_kepling(payload: UpdateKeplingRequest):
    try:
        from data_matcher import update_kepling_details
        success = update_kepling_details(payload.dict(exclude_unset=True))
        if success:
            return {"status": "success", "message": f"Kepling at {payload.kecamatan}-{payload.kelurahan}-{payload.lingkungan} successfully updated."}
        else:
            raise HTTPException(status_code=400, detail="Gagal memperbarui detail Kepling.")
    except ValueError as val_err:
        raise HTTPException(status_code=404, detail=str(val_err))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-kepling")
async def create_kepling(payload: UpdateKeplingRequest):
    try:
        from data_matcher import create_kepling_record
        success = create_kepling_record(payload.dict(exclude_unset=True))
        if success:
            return {"status": "success", "message": f"Kepling at {payload.kecamatan}-{payload.kelurahan}-{payload.lingkungan} successfully created."}
        else:
            raise HTTPException(status_code=400, detail="Gagal membuat data Kepling.")
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/delete-kepling")
async def delete_kepling(payload: DeleteKeplingRequest):
    try:
        from data_matcher import delete_kepling_record
        success = delete_kepling_record(payload.kecamatan, payload.kelurahan, payload.lingkungan)
        if success:
            return {"status": "success", "message": f"Kepling at {payload.kecamatan}-{payload.kelurahan}-{payload.lingkungan} successfully deleted."}
        else:
            raise HTTPException(status_code=400, detail="Gagal menghapus data Kepling.")
    except ValueError as val_err:
        raise HTTPException(status_code=404, detail=str(val_err))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


