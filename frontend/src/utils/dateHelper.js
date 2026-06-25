/**
 * Date / Time Helpers
 */

/**
 * Parse a date string in dd/mm/yyyy format combined with a time string HH:MM:SS
 * into a unix timestamp (ms). Returns 0 on failure.
 * Identical to parseDateTime() in the original App.jsx.
 */
export function parseDateTime(dStr, tStr) {
    if (!dStr) return 0;
    const parts = dStr.split('/');
    if (parts.length !== 3) return 0;
    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    return new Date(`${formattedDate}T${tStr || '00:00:00'}`).getTime() || 0;
}
