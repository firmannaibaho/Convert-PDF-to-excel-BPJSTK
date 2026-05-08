import pdfplumber
import sys

file_path = "C:/Users/firman/Downloads/AB00260467 LIRATNA MENDROFA.pdf"

try:
    with pdfplumber.open(file_path) as pdf:
        print("=== TEXT EXTRACT ===")
        for i, page in enumerate(pdf.pages):
            print(f"--- Page {i} ---")
            print(page.extract_text())
            print("\n")
            
        print("=== TABLE EXTRACT ===")
        for i, page in enumerate(pdf.pages):
            print(f"--- Page {i} ---")
            tables = page.extract_tables()
            for t in tables:
                print(t)
            print("\n")
except Exception as e:
    print(f"Error: {e}")
