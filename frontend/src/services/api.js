/**
 * API Service Layer
 * All fetch calls to the backend in one place.
 * Endpoints are identical to the original App.jsx — nothing changed.
 */

import { BACKEND_URL } from '../constants/config';

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getPembinaStats() {
    const res = await fetch(`${BACKEND_URL}/pembina-stats`);
    if (!res.ok) throw new Error('Gagal mengambil statistik pembina');
    return res.json();
}

// ---------------------------------------------------------------------------
// Keplings
// ---------------------------------------------------------------------------

export async function getKeplings() {
    const res = await fetch(`${BACKEND_URL}/keplings`);
    if (!res.ok) throw new Error('Gagal mengambil data keplings');
    return res.json();
}

export async function updateKepling(payload) {
    const res = await fetch(`${BACKEND_URL}/update-kepling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Gagal menyimpan detail Kepling');
    return data;
}

export async function createKepling(payload) {
    const res = await fetch(`${BACKEND_URL}/create-kepling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Gagal menambahkan Kepling baru');
    return data;
}

export async function deleteKepling(kecamatan, kelurahan, lingkungan) {
    const res = await fetch(`${BACKEND_URL}/delete-kepling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kecamatan, kelurahan, lingkungan }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Gagal menghapus data Kepling');
    return data;
}

// ---------------------------------------------------------------------------
// PDF Extraction
// ---------------------------------------------------------------------------

export async function uploadPDF(formData) {
    const res = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Terjadi kesalahan saat memproses PDF');
    return data;
}

export async function markExported(records, namaPengisi, nim) {
    const res = await fetch(`${BACKEND_URL}/mark-exported`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, nama_pengisi: namaPengisi, nim }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Gagal menandai data sebagai diekspor di database');
    return data;
}

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------

export function getDownloadFormsUrl() {
    return `${BACKEND_URL}/download/forms`;
}

export function getDownloadKeplingsUrl() {
    return `${BACKEND_URL}/download/keplings`;
}
