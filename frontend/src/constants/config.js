// =============================================================================
// Application Constants
// =============================================================================

/** Base URL for the backend API */
export const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://convert-pdf-to-excel-bpjstk-72bq.vercel.app';

/** Target acquisitions per pembina */
export const PEMBINA_TARGET = 80;

/** Target acquisitions per kepling area */
export const KEPLING_TARGET = 25;

/** Number of keplings shown per page in the kepling table */
export const PAGE_SIZE = 10;

/** Number of recent activities shown in the activity feed */
export const ACTIVITY_FEED_LIMIT = 8;

/** Number of pembinas shown in the top chart */
export const TOP_CHART_LIMIT = 5;

/** Height of the GIS Leaflet map in pixels */
export const GIS_MAP_HEIGHT = 380;

/** The 3 target kecamatans for statistics */
export const TARGET_DISTRICTS = ['MEDAN KOTA', 'MEDAN TIMUR', 'MEDAN TUNTUNGAN'];
