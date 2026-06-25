/**
 * GIS Computation Helper
 * Computes per-kecamatan and per-kelurahan statistics from keplings + acquisitions.
 * Identical logic to the IIFE geoData calculation in the original App.jsx.
 */

/**
 * @param {Array} keplings - full keplings list from Supabase
 * @param {Array} allAcquisitions - flat list of all acquisitions with pembinaName
 * @returns {Object} kecamatanData map keyed by kecamatan name
 */
export function computeGeoData(keplings, allAcquisitions) {
    const acqMap = {};
    allAcquisitions.forEach(acq => {
        const key = (acq.wilayah || '').trim().toUpperCase();
        acqMap[key] = (acqMap[key] || 0) + 1;
    });

    const kecamatanData = {};
    const mainKecs = ['MEDAN KOTA', 'MEDAN TIMUR', 'MEDAN TUNTUNGAN'];

    mainKecs.forEach(k => {
        kecamatanData[k] = {
            name: k,
            totalKeplings: 0,
            filledKeplings: 0,
            activePerisais: 0,
            totalAcquisitions: 0,
            kelurahans: {}
        };
    });

    keplings.forEach(k => {
        const kec = (k.kecamatan || '').trim().toUpperCase();
        if (!kec) return;

        if (!kecamatanData[kec]) {
            kecamatanData[kec] = {
                name: kec,
                totalKeplings: 0,
                filledKeplings: 0,
                activePerisais: 0,
                totalAcquisitions: 0,
                kelurahans: {}
            };
        }

        const kel = (k.kelurahan || '').trim().toUpperCase();
        const lingk = (k.lingkungan || '').trim().toUpperCase();
        const regionKey = `${kec}-${kel}-${lingk}`;
        const hasAcq = acqMap[regionKey] || 0;
        const isFilled = k.nama_kepling && k.nama_kepling.trim() !== '' && k.nama_kepling.trim() !== '-';
        const isActivePerisai = k.akun_perisai === 'YA';

        if (kel) {
            if (!kecamatanData[kec].kelurahans[kel]) {
                kecamatanData[kec].kelurahans[kel] = {
                    name: kel,
                    totalKeplings: 0,
                    filledKeplings: 0,
                    activePerisais: 0,
                    totalAcquisitions: 0
                };
            }
            kecamatanData[kec].kelurahans[kel].totalKeplings += 1;
            if (isFilled) kecamatanData[kec].kelurahans[kel].filledKeplings += 1;
            if (isActivePerisai) kecamatanData[kec].kelurahans[kel].activePerisais += 1;
            kecamatanData[kec].kelurahans[kel].totalAcquisitions += hasAcq;
        }

        kecamatanData[kec].totalKeplings += 1;
        if (isFilled) kecamatanData[kec].filledKeplings += 1;
        if (isActivePerisai) kecamatanData[kec].activePerisais += 1;
        kecamatanData[kec].totalAcquisitions += hasAcq;
    });

    return kecamatanData;
}
