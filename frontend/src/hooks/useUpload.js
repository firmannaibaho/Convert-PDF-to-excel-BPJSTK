/**
 * useUpload — PDF upload state and handlers
 * Extracted from App.jsx (lines ~321–352, drag/drop handlers)
 */

import { useState, useRef, useCallback } from 'react';
import { uploadPDF } from '../services/api';

export function useUpload() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ matched_data: [], tuntungan_data: [], error_log: [] });
    const [activeTab, setActiveTab] = useState('matched');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFiles = useCallback((selectedFiles) => {
        const validFiles = Array.from(selectedFiles).filter(f => f.type === 'application/pdf');
        if (validFiles.length === 0) {
            alert('Mohon unggah file dengan format PDF.');
            return;
        }
        setFiles(validFiles);
    }, []);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleChange = useCallback((e) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    }, [handleFiles]);

    const handleUpload = useCallback(async () => {
        if (!files || files.length === 0) return;

        setLoading(true);
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        try {
            const result = await uploadPDF(formData);
            setData(result);
            if (result.matched_data.length > 0) setActiveTab('matched');
            else if (result.tuntungan_data.length > 0) setActiveTab('tuntungan');
            else setActiveTab('errors');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }, [files]);

    const markRecordsAsExported = useCallback((exportedNIKs) => {
        setData(prev => {
            if (!prev) return prev;
            const updateList = (list) =>
                list.map(item => {
                    const isJustExported = exportedNIKs.includes(item['NIK']);
                    return isJustExported ? { ...item, Status: 'Sudah Pernah Diekspor' } : item;
                });
            return {
                ...prev,
                matched_data: updateList(prev.matched_data),
                tuntungan_data: updateList(prev.tuntungan_data),
                error_log: updateList(prev.error_log),
            };
        });
    }, []);

    return {
        files, loading, data, activeTab, setActiveTab, dragActive,
        fileInputRef,
        handleFiles, handleDrag, handleDrop, handleChange, handleUpload,
        markRecordsAsExported,
    };
}
