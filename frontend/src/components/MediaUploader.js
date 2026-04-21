"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, Star } from "lucide-react";
import toast from "react-hot-toast";
import { uploadMedia, deleteMedia, setThumbnail } from "@/lib/media";

// multiple: true → gallery (Product). false → single (profile/cover).
export default function MediaUploader({
  mediable_type,
  mediable_id,
  collection = "default",
  multiple = false,
  items = [],
  onChange,
  label = "Upload image",
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (fileList) => {
    if (!mediable_id) {
      toast.error("Save the record first, then add images");
      return;
    }
    setBusy(true);
    try {
      for (const file of fileList) {
        await uploadMedia({
          file,
          mediable_type,
          mediable_id,
          collection,
          is_thumbnail: multiple && items.length === 0,
        });
      }
      toast.success("Uploaded");
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this image?")) return;
    try {
      await deleteMedia(id);
      toast.success("Deleted");
      onChange?.();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSetThumb = async (id) => {
    try {
      await setThumbnail(id);
      toast.success("Thumbnail updated");
      onChange?.();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="bg-primary text-white text-sm px-3 py-2 rounded hover:bg-primary-dark flex items-center gap-2 disabled:opacity-50"
        >
          <Upload size={16} /> {busy ? "Uploading…" : label}
        </button>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((m) => (
            <div key={m.id} className="relative group aspect-square border rounded overflow-hidden bg-gray-50">
              <img src={m.url} alt="" className="w-full h-full object-cover" />
              {m.is_thumbnail && (
                <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded">
                  Thumbnail
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {multiple && !m.is_thumbnail && (
                  <button
                    type="button"
                    onClick={() => handleSetThumb(m.id)}
                    title="Set as thumbnail"
                    className="bg-white p-1.5 rounded-full hover:bg-yellow-100"
                  >
                    <Star size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  title="Delete"
                  className="bg-white p-1.5 rounded-full hover:bg-red-100 text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
