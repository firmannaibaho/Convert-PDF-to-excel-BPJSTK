import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors

data = [
    ["Tgl Daftar", "Nama Lengkap", "NIK"],
    ["2024-05-01", "Budi Santoso", "1234567890123456"], # Valid, fake NIK (won't be in CSV, should go to Error Log)
    ["2024-05-02", "Siti Aminah", "123"], # Invalid NIK (Error Log)
    ["2024-05-03", "Andi", ""], # Empty NIK (Error Log)
]

pdf = SimpleDocTemplate("c:\\Users\\firman\\Documents\\magang\\akuisisi\\dummy.pdf", pagesize=letter)
table = Table(data)

style = TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.grey),
    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('BOTTOMPADDING', (0,0), (-1,0), 12),
    ('BACKGROUND', (0,1), (-1,-1), colors.beige),
    ('GRID', (0,0), (-1,-1), 1, colors.black)
])
table.setStyle(style)

pdf.build([table])
print("Dummy PDF created")
