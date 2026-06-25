/**
 * Excel Export Helpers
 * All Excel export logic extracted from App.jsx — identical logic, no changes.
 */

import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Internal: Auto-fit column widths
// ---------------------------------------------------------------------------

export function fitColumns(ws, headerRow, dataRows) {
    const colWidths = headerRow.map((h, i) => {
        let maxLen = h.toString().length;
        dataRows.forEach(row => {
            const keys = Object.keys(row);
            const val = row[keys[i]];
            if (val !== undefined && val !== null) {
                maxLen = Math.max(maxLen, val.toString().length);
            }
        });
        return { wch: maxLen + 4 };
    });
    ws['!cols'] = colWidths;
}

// ---------------------------------------------------------------------------
// Export matched/tuntungan/error table data
// ---------------------------------------------------------------------------

export function exportExtractedToExcel(tableData, fileName, namaPengisi, nim, onMarkExported) {
    const newRecordsToExport = tableData.filter(row => row['Status'] !== 'Sudah Pernah Diekspor');

    if (newRecordsToExport.length === 0) {
        alert('Semua data di tabel ini sudah pernah diekspor sebelumnya.');
        return null;
    }

    const formattedData = newRecordsToExport.map(row => {
        const kecamatan = row['Kecamatan'] || '';
        const kelurahan = row['Kelurahan'] || '';
        const lingkungan = row['Lingkungan'] || '';
        const wilayah = `${kecamatan}-${kelurahan}-${lingkungan}`;

        return {
            'Wilayah': wilayah,
            'NIK': row['NIK'] || '',
            'Nama': row['Nama Lengkap'] || '',
            'No Telepon': '-',
            'Tanggal Pendaftaran': row['Tgl Daftar'] || ''
        };
    });

    const ws = XLSX.utils.aoa_to_sheet([
        ["LAPORAN DATA PESERTA AKUISISI BARU"],
        [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')} | Waktu: ${new Date().toLocaleTimeString('id-ID')}`],
        [],
        ["Wilayah", "NIK", "Nama", "No Telepon", "Tanggal Pendaftaran"]
    ]);

    XLSX.utils.sheet_add_json(ws, formattedData, { origin: "A5", skipHeader: true });

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
    ];

    fitColumns(ws, ["Wilayah", "NIK", "Nama", "No Telepon", "Tanggal Pendaftaran"], formattedData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    return newRecordsToExport;
}

// ---------------------------------------------------------------------------
// Export all pembina performance report (multi-sheet)
// ---------------------------------------------------------------------------

export function exportPembinaToExcel(stats) {
    const summaryData = stats.map((s, index) => ({
        'No': index + 1,
        'Nama Pembina': s.pembina,
        'Jumlah Wilayah': s.assigned_regions_count,
        'Total Akuisisi': s.total_acquisitions
    }));

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet([
        ["LAPORAN RINGKASAN AKUISISI PEMBINA"],
        [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')} | Waktu: ${new Date().toLocaleTimeString('id-ID')}`],
        [],
        ["No", "Nama Pembina", "Jumlah Wilayah di-Assign", "Total Akuisisi"]
    ]);

    XLSX.utils.sheet_add_json(wsSummary, summaryData, { origin: "A5", skipHeader: true });

    wsSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
    ];

    fitColumns(wsSummary, ["No", "Nama Pembina", "Jumlah Wilayah di-Assign", "Total Akuisisi"], summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Pembina");

    stats.forEach(s => {
        if (s.total_acquisitions > 0) {
            const pembinaDetails = s.acquisitions.map((a, index) => ({
                'No': index + 1,
                'Nama TK': a.nama_tk || '-',
                'NIK': a.nik || '-',
                'Wilayah': a.wilayah || '-',
                'Tanggal Pendaftaran': a.tgl_daftar || '-',
                'Tanggal Input': a.tanggal_input || '-',
                'Jam Input': a.jam_input || '-',
                'Nama Pengisi': a.nama_pengisi || '-',
                'NIM': a.nim || '-'
            }));

            let sheetName = s.pembina.slice(0, 30).replace(/[\\\/\?\*\[\]]/g, '');
            if (!sheetName) sheetName = `Pembina_${s.pembina.slice(0, 10)}`;

            const wsPembina = XLSX.utils.aoa_to_sheet([
                [`LAPORAN DETAIL AKUISISI - ${s.pembina.toUpperCase()}`],
                [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`],
                [],
                ["No", "Nama TK", "NIK", "Wilayah", "Tanggal Pendaftaran", "Tanggal Input", "Jam Input", "Nama Pengisi (Mahasiswa)", "NIM"]
            ]);

            XLSX.utils.sheet_add_json(wsPembina, pembinaDetails, { origin: "A5", skipHeader: true });

            wsPembina['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
            ];

            fitColumns(
                wsPembina,
                ["No", "Nama TK", "NIK", "Wilayah", "Tanggal Pendaftaran", "Tanggal Input", "Jam Input", "Nama Pengisi (Mahasiswa)", "NIM"],
                pembinaDetails
            );
            XLSX.utils.book_append_sheet(wb, wsPembina, sheetName);
        }
    });

    XLSX.writeFile(wb, `Laporan_Pembina_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ---------------------------------------------------------------------------
// Export acquisitions for a specific kepling
// ---------------------------------------------------------------------------

export function exportKeplingAcquisitionsToExcel(keplingData) {
    const { kepling, acquisitions } = keplingData;
    if (!acquisitions || acquisitions.length === 0) {
        alert('Tidak ada data akuisisi untuk diekspor.');
        return;
    }

    const formattedData = acquisitions.map((item, index) => ({
        'No': index + 1,
        'Nama Peserta (TK)': item.nama_tk || '',
        'NIK': item.nik || '',
        'No Telepon': item.no_telp || '-',
        'Tanggal Daftar': item.tgl_daftar || '-',
        'Waktu Input': `${item.tanggal_input || ''} ${item.jam_input || ''}`.trim(),
        'Operator': `${item.nama_pengisi || ''} (${item.nim || ''})`
    }));

    const title = `LAPORAN DATA AKUISISI KEPLING - ${(kepling.nama_kepling || 'Belum Terisi').toUpperCase()}`;
    const subtitleInfo = `Wilayah: Kecamatan ${kepling.kecamatan} | Kelurahan ${kepling.kelurahan} | Lingkungan ${kepling.lingkungan}`;
    const subtitlePembina = `Pembina Wilayah: ${kepling.pembina || '-'}`;
    const subtitleTime = `Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')} | Waktu: ${new Date().toLocaleTimeString('id-ID')}`;

    const ws = XLSX.utils.aoa_to_sheet([
        [title],
        [subtitleInfo],
        [subtitlePembina],
        [subtitleTime],
        [],
        ['No', 'Nama Peserta (TK)', 'NIK', 'No Telepon', 'Tanggal Daftar', 'Waktu Input', 'Operator']
    ]);

    XLSX.utils.sheet_add_json(ws, formattedData, { origin: "A7", skipHeader: true });

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }
    ];

    fitColumns(
        ws,
        ['No', 'Nama Peserta (TK)', 'NIK', 'No Telepon', 'Tanggal Daftar', 'Waktu Input', 'Operator'],
        formattedData
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Akuisisi Kepling");

    const safeName = (kepling.nama_kepling || 'Kepling').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Laporan_Akuisisi_${safeName}_${kepling.kecamatan}_${kepling.kelurahan}_L${kepling.lingkungan}.xlsx`);
}
