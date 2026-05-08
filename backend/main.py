import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
