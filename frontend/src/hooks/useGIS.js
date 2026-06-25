/**
 * useGIS — GIS map interaction state and Leaflet lifecycle
 * Extracted from App.jsx (lines ~87–221)
 */

import { useState, useRef, useEffect } from 'react';

export function useGIS() {
    const [selectedGisKecamatan, setSelectedGisKecamatan] = useState(null);
    const [gisSearchKelurahan, setGisSearchKelurahan] = useState('');
    const [gisSortOrder, setGisSortOrder] = useState('acquisitions');
    const [gisHoveredKecamatan, setGisHoveredKecamatan] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const mapRef = useRef(null);

    const handleGisMapHover = (kec, e) => {
        setGisHoveredKecamatan(kec);
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    const handleGisMapMouseMove = (e) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    const handleGisMapLeave = () => {
        setGisHoveredKecamatan(null);
    };

    const handleGisMapClick = (kec) => {
        setSelectedGisKecamatan(prev => (prev === kec ? null : kec));
    };

    // Leaflet map lifecycle — identical to the useEffect in original App.jsx
    const initLeafletMap = (isActive) => {
        if (!isActive) {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            return;
        }

        const timer = setTimeout(() => {
            const L = window.L;
            if (!L) {
                console.warn('Leaflet library not loaded, falling back to SVG map.');
                return;
            }

            const mapContainer = document.getElementById('gis-map');
            if (!mapContainer || mapRef.current) return;

            const map = L.map('gis-map', {
                center: [3.565, 98.660],
                zoom: 12,
                zoomControl: true,
                scrollWheelZoom: false
            });
            mapRef.current = map;

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                maxZoom: 19
            }).addTo(map);

            const districts = [
                {
                    name: 'MEDAN TIMUR',
                    color: 'var(--accent-purple)',
                    coords: [[3.630, 98.675], [3.622, 98.712], [3.585, 98.705], [3.593, 98.668]]
                },
                {
                    name: 'MEDAN KOTA',
                    color: 'var(--primary)',
                    coords: [[3.582, 98.670], [3.578, 98.703], [3.550, 98.698], [3.554, 98.665]]
                },
                {
                    name: 'MEDAN TUNTUNGAN',
                    color: 'var(--accent-cyan)',
                    coords: [[3.545, 98.580], [3.538, 98.640], [3.475, 98.630], [3.482, 98.570]]
                }
            ];

            districts.forEach(d => {
                const polygon = L.polygon(d.coords, {
                    color: '#1a1a1a',
                    fillColor: d.color,
                    fillOpacity: 0.5,
                    weight: 3.5
                }).addTo(map);

                polygon.on('mouseover', function (e) {
                    this.setStyle({ fillOpacity: 0.8, weight: 4.5 });
                    setGisHoveredKecamatan(d.name);
                    setTooltipPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                });

                polygon.on('mousemove', function (e) {
                    setTooltipPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                });

                polygon.on('mouseout', function () {
                    this.setStyle({ fillOpacity: 0.5, weight: 3.5 });
                    setGisHoveredKecamatan(null);
                });

                polygon.on('click', function () {
                    setSelectedGisKecamatan(prev => (prev === d.name ? null : d.name));
                });
            });

            return timer;
        }, 100);

        return () => {
            clearTimeout(timer);
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    };

    return {
        selectedGisKecamatan, setSelectedGisKecamatan,
        gisSearchKelurahan, setGisSearchKelurahan,
        gisSortOrder, setGisSortOrder,
        gisHoveredKecamatan,
        tooltipPos,
        mapRef,
        handleGisMapHover, handleGisMapMouseMove, handleGisMapLeave, handleGisMapClick,
        initLeafletMap,
    };
}
