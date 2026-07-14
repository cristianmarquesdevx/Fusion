/** @format */

/**
 * Adds CSV export and data download utilities
 */
export function exportToCSV(data, filename = 'export.csv', headers = []) {
  if (!data || data.length === 0) return false;

  const headerRow = headers.length > 0
    ? headers.join(',')
    : Object.keys(data[0]).join(',');

  const rows = data.map((item) => {
    if (headers.length > 0) {
      return headers
        .map((h) => {
          const key = Object.keys(data[0]).find(
            (k) => k.toLowerCase() === h.toLowerCase()
          );
          const val = key ? item[key] : '';
          return formatCSVCell(val);
        })
        .join(',');
    }
    return Object.values(item)
      .map((v) => formatCSVCell(v))
      .join(',');
  });

  const csv = [headerRow, ...rows].join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

function formatCSVCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Opens a confirmation dialog and returns a promise
 */
export function confirmAction(message = 'Tem certeza?') {
  return new Promise((resolve) => {
    // Simple implementation - can be enhanced with a modal
    const result = window.confirm(message);
    resolve(result);
  });
}
