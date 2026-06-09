"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { setError("Fayl 5MB dan katta"); return; }
    if (!file.type.startsWith("image/")) { setError("Faqat rasm fayllari"); return; }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) { onChange(data.url); }
      else { setError(data.error || "Yuklashda xatolik"); }
    } catch {
      setError("Tarmoq xatoligi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {value && (
        <div className="relative mb-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-32">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600">×</button>
        </div>
      )}

      {!value && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <><div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" /><span className="text-xs text-gray-500">Yuklanmoqda...</span></>
            ) : (
              <><span className="text-xl">📷</span><span className="text-xs text-gray-500 dark:text-gray-400">Rasm yuklash (max 5MB)</span></>
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <button type="button" onClick={() => setUrlMode(!urlMode)} className="text-[10px] text-gray-400 hover:text-primary-500">yoki URL</button>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {urlMode && (
            <input type="text" onChange={(e) => { if (e.target.value) onChange(e.target.value); }} placeholder="https://example.com/rasm.jpg" className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300" />
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
