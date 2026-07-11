// ============================================================
// TF Arrecada+ | ImageUpload — Upload com preview e drag & drop
// ============================================================

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageUploadProps {
  value?: string;
  onChange: (base64: string) => void;
  onClear: () => void;
}

export function ImageUpload({ value, onChange, onClear }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onChange(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (value) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-neutral-100">
        <img src={value} alt="Preview" className="w-full h-48 object-cover" />
        <button
          onClick={onClear}
          type="button"
          className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5
                     hover:bg-black/70 transition-colors duration-150"
          aria-label="Remover imagem"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      className={clsx(
        'flex flex-col items-center justify-center gap-3 h-40 rounded-2xl border-2 border-dashed',
        'cursor-pointer transition-all duration-200 select-none',
        dragging
          ? 'border-brand-400 bg-brand-50 scale-[1.01]'
          : 'border-neutral-200 hover:border-brand-300 hover:bg-brand-50/40',
      )}
    >
      <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center">
        <ImagePlus size={20} className="text-brand-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-neutral-700">
          Clique ou arraste uma imagem
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">PNG, JPG · máx. 5 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ''; // allow re-selecting same file
        }}
      />
    </div>
  );
}
