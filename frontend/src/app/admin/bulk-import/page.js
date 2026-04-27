"use client";

import { useState, useRef } from "react";
import { Download, Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminBulkImportPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/");
  }, [user, router]);

  function parseCSVPreview(text) {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1, 6).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
      return obj;
    });
    return { headers, rows };
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }
    setSelectedFile(file);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const { headers, rows } = parseCSVPreview(text);
      setPreviewHeaders(headers);
      setPreviewRows(rows);
    };
    reader.readAsText(file);
  }

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    try {
      const r = await api.get("/bulk-import/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "product-import-template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleImport() {
    if (!selectedFile) { toast.error("Please select a CSV file first"); return; }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const r = await api.post("/bulk-import/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const result = r.data.data || r.data;
      setImportResult(result);
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} products`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} rows failed to import`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setPreviewHeaders([]);
    setPreviewRows([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Upload size={22} className="text-orange-500" /> Bulk Product Import
      </h1>

      {/* Section 1: Template Download */}
      <div className="bg-white rounded-lg border shadow p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-50 rounded-lg">
            <FileText size={28} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-800 text-lg mb-1">Step 1 — Download Template</h2>
            <p className="text-sm text-gray-500 mb-4">
              Download the CSV template with the required column headers. Fill in your product data and upload below.
            </p>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium text-sm"
            >
              <Download size={18} />
              {downloadingTemplate ? "Downloading…" : "Download CSV Template"}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Upload & Import */}
      <div className="bg-white rounded-lg border shadow p-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Upload size={28} className="text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg mb-1">Step 2 — Upload & Import</h2>
            <p className="text-sm text-gray-500">Select your completed CSV file to preview and import products.</p>
          </div>
        </div>

        {/* File Input */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            selectedFile ? "border-orange-300 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={24} className="text-orange-500" />
              <div className="text-left">
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div>
              <Upload size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">Click to select a CSV file</p>
              <p className="text-gray-400 text-xs mt-1">Only .csv files are accepted</p>
            </div>
          )}
        </div>

        {/* CSV Preview */}
        {previewRows.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Preview (first {previewRows.length} rows)
            </h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {previewHeaders.map((h) => (
                      <th key={h} className="p-2 text-left text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className={`border-t ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                      {previewHeaders.map((h) => (
                        <td key={h} className="p-2 text-gray-700 max-w-[140px] truncate" title={row[h]}>
                          {row[h] || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Button */}
        {selectedFile && (
          <div className="mt-5">
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
            >
              <Upload size={18} />
              {importing ? "Importing…" : "Import Products"}
            </button>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="mt-5 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">{importResult.total ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Rows</p>
              </div>
              <div className="border border-green-200 bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{importResult.imported ?? 0}</p>
                <p className="text-xs text-green-600 mt-0.5">Imported</p>
              </div>
              <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{importResult.failed ?? 0}</p>
                <p className="text-xs text-red-600 mt-0.5">Failed</p>
              </div>
            </div>

            {/* Error Table */}
            {importResult.errors?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                  <AlertCircle size={14} /> Import Errors
                </h3>
                <div className="overflow-x-auto rounded-lg border border-red-100">
                  <table className="w-full text-xs">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="p-2 text-left text-red-600">Row</th>
                        <th className="p-2 text-left text-red-600">Error</th>
                        <th className="p-2 text-left text-red-600">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((err, i) => (
                        <tr key={i} className={`border-t ${i % 2 === 1 ? "bg-red-50/50" : ""}`}>
                          <td className="p-2 font-medium text-red-700">Row {err.row ?? i + 2}</td>
                          <td className="p-2 text-red-600">{err.message || err.error || "Unknown error"}</td>
                          <td className="p-2 text-gray-500 max-w-[200px] truncate" title={JSON.stringify(err.data)}>
                            {err.data ? JSON.stringify(err.data) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importResult.imported > 0 && importResult.failed === 0 && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                <CheckCircle size={18} />
                All products imported successfully!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
