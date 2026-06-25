/**
 * useDashboard — computed statistics from pembinaStats + keplings
 * Extracted from App.jsx (lines ~879–984)
 */

import { useMemo } from 'react';
import { computeGeoData } from '../utils/gisHelper';
import { parseDateTime } from '../utils/dateHelper';
import { TOP_CHART_LIMIT, ACTIVITY_FEED_LIMIT } from '../constants/config';

export function useDashboard(pembinaStats, keplings) {
    const totalAcquisitions = useMemo(
        () => pembinaStats.reduce((sum, p) => sum + (p.total_acquisitions || 0), 0),
        [pembinaStats]
    );

    const totalPembinas = pembinaStats.length;

    const totalAssignedRegions = useMemo(
        () => pembinaStats.reduce((sum, p) => sum + (p.assigned_regions_count || 0), 0),
        [pembinaStats]
    );

    const activePembinas = useMemo(
        () => pembinaStats.filter(p => p.total_acquisitions > 0).length,
        [pembinaStats]
    );

    const topPembinas = useMemo(
        () =>
            [...pembinaStats]
                .sort((a, b) => b.total_acquisitions - a.total_acquisitions)
                .slice(0, TOP_CHART_LIMIT),
        [pembinaStats]
    );

    const maxAcquisitions = useMemo(
        () => Math.max(...pembinaStats.map(p => p.total_acquisitions), 1),
        [pembinaStats]
    );

    const allAcquisitions = useMemo(
        () =>
            pembinaStats.flatMap(p =>
                (p.acquisitions || []).map(acq => ({ ...acq, pembinaName: p.pembina }))
            ),
        [pembinaStats]
    );

    const recentAcquisitions = useMemo(
        () =>
            [...allAcquisitions]
                .sort(
                    (a, b) =>
                        parseDateTime(b.tanggal_input, b.jam_input) -
                        parseDateTime(a.tanggal_input, a.jam_input)
                )
                .slice(0, ACTIVITY_FEED_LIMIT),
        [allAcquisitions]
    );

    const geoData = useMemo(
        () => computeGeoData(keplings, allAcquisitions),
        [keplings, allAcquisitions]
    );

    const filledKeplingCount = useMemo(
        () =>
            keplings.filter(
                k => k.nama_kepling && k.nama_kepling.trim() !== '-' && k.nama_kepling.trim() !== ''
            ).length,
        [keplings]
    );

    const vacantKeplingCount = keplings.length - filledKeplingCount;

    const totalActivePerisais = useMemo(
        () => keplings.filter(k => k.akun_perisai === 'YA').length,
        [keplings]
    );

    const getAcquisitionsForKepling = (k) => {
        const kec = (k.kecamatan || '').trim().toUpperCase();
        const kel = (k.kelurahan || '').trim().toUpperCase();
        const lingk = (k.lingkungan || '').trim().toUpperCase();
        const regionKey = `${kec}-${kel}-${lingk}`;
        return allAcquisitions.filter(
            acq => (acq.wilayah || '').trim().toUpperCase() === regionKey
        );
    };

    return {
        totalAcquisitions,
        totalPembinas,
        totalAssignedRegions,
        activePembinas,
        topPembinas,
        maxAcquisitions,
        allAcquisitions,
        recentAcquisitions,
        geoData,
        filledKeplingCount,
        vacantKeplingCount,
        totalActivePerisais,
        getAcquisitionsForKepling,
    };
}
