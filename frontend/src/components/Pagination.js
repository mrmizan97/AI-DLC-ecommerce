"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const LIMIT_OPTIONS = [10, 20, 50, 100];

export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }) {
  if (total === 0) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-wrap justify-between items-center gap-3 mt-4 bg-white p-3 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Show</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(parseInt(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          {LIMIT_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span>
          of <span className="font-medium text-gray-900">{total}</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>

        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded hover:bg-gray-100 text-sm">
              1
            </button>
            {start > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 rounded text-sm ${
              p === page ? "bg-primary text-white" : "hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
            <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded hover:bg-gray-100 text-sm">
              {totalPages}
            </button>
          </>
        )}

        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
