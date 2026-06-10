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
  const [urlInput, setUrlInput] = useState("");
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
      if (res.ok && data.url) {
        onChange(data.url);
        setError("");
      } else {
        // Upload xato — avtomatik URL rejimiga o'tish
        setError(data.error || "Yuklash ishlamadi. URL orqali kiriting.");
        setUrlMode(true);
      }
    } catch {
      setError("Tarmoq xatoligi. URL orqali kiriting.");
      setUrlMode(true);
    } finally {
      setUploading(false);
      // input reset
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput && (urlInput.startsWith("http://") || urlInput.startsWith("https://"))) {
      onChange(urlInput);
      setUrlInput("");
      setError("");
    } else {
      setError("To'g'ri URL kiriting (https://...)");
    }
  };

  return (
    <div className={className}>
      {/* Preview */}
      {value && (
        <div className="relative mb-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-32">
          <img src={value} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ""; setError("Rasm yuklanmadi"); onChange(""); }} />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600 shadow-md">×</button>
        </div>
      )}

      {/* Upload / URL */}
      {!value && (
        <div className="space-y-2">
          {/* File upload tugmasi */}
          {!urlMode && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Yuklanmoqda...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">📷</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Rasm yuklash (max 5MB)</span>
                  <span className="text-[10px] text-gray-400">jpg, png, webp</span>
                </>
              )}
            </button>
          )}

          {/* URL input */}
          {urlMode && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUrlSubmit(); } }}
                  placeholder="https://example.com/rasm.jpg"
                  className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <button type="button" onClick={handleUrlSubmit} className="px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors">
                  ✓
                </button>
              </div>
            </div>
          )}

          {/* Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <button type="button" onClick={() => setUrlMode(!urlMode)} className="text-[10px] text-gray-400 hover:text-primary-500 transition-colors">
              {urlMode ? "📷 Fayl yuklash" : "🔗 URL orqali"}
            </button>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
