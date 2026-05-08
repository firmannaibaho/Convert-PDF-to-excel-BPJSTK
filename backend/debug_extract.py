from pdf_processor import extract_data_from_pdf
import json

file_path = "C:/Users/firman/Downloads/AB00260467 LIRATNA MENDROFA.pdf"
data = extract_data_from_pdf(file_path)
print(json.dumps(data, indent=2))
