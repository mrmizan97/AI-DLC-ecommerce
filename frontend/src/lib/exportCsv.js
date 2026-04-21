function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(filename, headers, rows) {
  const headerRow = headers.map((h) => escapeCell(h.label)).join(",");
  const dataRows = rows.map((row) =>
    headers.map((h) => escapeCell(typeof h.value === "function" ? h.value(row) : row[h.value])).join(",")
  );
  const csv = [headerRow, ...dataRows].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
