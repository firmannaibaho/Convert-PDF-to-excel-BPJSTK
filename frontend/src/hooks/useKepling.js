/**
 * useKepling — filter, search, pagination, and dropdown logic for keplings
 * Extracted from App.jsx (lines ~986–1092)
 */

import { useState, useMemo, useEffect } from 'react';
import { PAGE_SIZE } from '../constants/config';

export function useKepling(keplings) {
    const [keplingSearch, setKeplingSearch] = useState('');
    const [filterPembina, setFilterPembina] = useState('');
    const [filterKecamatan, setFilterKecamatan] = useState('');
    const [filterKelurahan, setFilterKelurahan] = useState('');
    const [filterLingkungan, setFilterLingkungan] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'filled' | 'vacant'
    const [keplingPage, setKeplingPage] = useState(1);

    // Reset page when any filter changes
    useEffect(() => {
        setKeplingPage(1);
    }, [filterPembina, filterKecamatan, filterKelurahan, filterLingkungan, keplingSearch, filterStatus]);

    // ---- Derived lists from full keplings ----
    const uniquePembinas = useMemo(
        () => [...new Set(keplings.map(k => k.pembina).filter(Boolean))].sort(),
        [keplings]
    );

    const uniqueKecamatans = useMemo(
        () => [...new Set(keplings.map(k => k.kecamatan).filter(Boolean))].sort(),
        [keplings]
    );

    const uniqueKelurahans = useMemo(
        () =>
            [
                ...new Set(
                    keplings
                        .filter(k => !filterKecamatan || k.kecamatan === filterKecamatan)
                        .map(k => k.kelurahan)
                        .filter(Boolean)
                )
            ].sort(),
        [keplings, filterKecamatan]
    );

    const uniqueLingkungans = useMemo(
        () =>
            [
                ...new Set(
                    keplings
                        .filter(k => !filterKelurahan || k.kelurahan === filterKelurahan)
                        .map(k => k.lingkungan)
                        .filter(Boolean)
                )
            ].sort(),
        [keplings, filterKelurahan]
    );

    const vacantKeplings = useMemo(
        () =>
            keplings.filter(
                k => !k.nama_kepling || k.nama_kepling.trim() === '-' || k.nama_kepling.trim() === ''
            ),
        [keplings]
    );

    const vacantPembinas = useMemo(
        () => [...new Set(vacantKeplings.map(k => k.pembina).filter(Boolean))].sort(),
        [vacantKeplings]
    );

    const vacantKecamatans = useMemo(
        () => [...new Set(vacantKeplings.map(k => k.kecamatan).filter(Boolean))].sort(),
        [vacantKeplings]
    );

    const getKelurahansForKecamatan = (kec) => {
        if (!kec) return [];
        return [
            ...new Set(keplings.filter(k => k.kecamatan === kec).map(k => k.kelurahan).filter(Boolean))
        ].sort();
    };

    const getLingkungansForKelurahan = (kec, kel) => {
        if (!kec || !kel) return [];
        return [
            ...new Set(
                keplings
                    .filter(k => k.kecamatan === kec && k.kelurahan === kel)
                    .map(k => k.lingkungan)
                    .filter(Boolean)
            )
        ].sort();
    };

    const getVacantKelurahansForKecamatan = (kec) => {
        if (!kec) return [];
        return [
            ...new Set(
                vacantKeplings.filter(k => k.kecamatan === kec).map(k => k.kelurahan).filter(Boolean)
            )
        ].sort();
    };

    const getVacantLingkungsForKelurahan = (kec, kel) => {
        if (!kec || !kel) return [];
        return [
            ...new Set(
                vacantKeplings
                    .filter(k => k.kecamatan === kec && k.kelurahan === kel)
                    .map(k => k.lingkungan)
                    .filter(Boolean)
            )
        ].sort();
    };

    // ---- Filtered keplings ----
    const filteredKeplings = useMemo(() => {
        return keplings.filter(k => {
            const isVacant =
                !k.nama_kepling || k.nama_kepling.trim() === '' || k.nama_kepling.trim() === '-';
            if (filterStatus === 'filled' && isVacant) return false;
            if (filterStatus === 'vacant' && !isVacant) return false;
            if (filterPembina && k.pembina !== filterPembina) return false;
            if (filterKecamatan && k.kecamatan !== filterKecamatan) return false;
            if (filterKelurahan && k.kelurahan !== filterKelurahan) return false;
            if (filterLingkungan && k.lingkungan !== filterLingkungan) return false;
            if (keplingSearch) {
                const query = keplingSearch.toLowerCase();
                return (
                    (k.nama_kepling || '').toLowerCase().includes(query) ||
                    (k.nik || '').includes(query) ||
                    (k.id_akun_perisai || '').toLowerCase().includes(query) ||
                    (k.nama_akun_perisai || '').toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [keplings, filterStatus, filterPembina, filterKecamatan, filterKelurahan, filterLingkungan, keplingSearch]);

    const totalPages = Math.ceil(filteredKeplings.length / PAGE_SIZE) || 1;

    const paginatedKeplings = useMemo(
        () =>
            filteredKeplings.slice((keplingPage - 1) * PAGE_SIZE, keplingPage * PAGE_SIZE),
        [filteredKeplings, keplingPage]
    );

    const resetFilters = () => {
        setFilterPembina('');
        setFilterKecamatan('');
        setFilterKelurahan('');
        setFilterLingkungan('');
        setKeplingSearch('');
        setFilterStatus('all');
    };

    return {
        // filter state
        keplingSearch, setKeplingSearch,
        filterPembina, setFilterPembina,
        filterKecamatan,
        setFilterKecamatan: (val) => {
            setFilterKecamatan(val);
            setFilterKelurahan('');
            setFilterLingkungan('');
        },
        filterKelurahan,
        setFilterKelurahan: (val) => {
            setFilterKelurahan(val);
            setFilterLingkungan('');
        },
        filterLingkungan, setFilterLingkungan,
        filterStatus, setFilterStatus,
        keplingPage, setKeplingPage,
        // derived
        uniquePembinas, uniqueKecamatans, uniqueKelurahans, uniqueLingkungans,
        vacantKeplings, vacantPembinas, vacantKecamatans,
        getKelurahansForKecamatan, getLingkungansForKelurahan,
        getVacantKelurahansForKecamatan, getVacantLingkungsForKelurahan,
        filteredKeplings, paginatedKeplings, totalPages,
        resetFilters,
    };
}
