import { useState, useRef, type DragEvent } from 'react';
import { useUploadDocument } from '../../hooks/useDocuments';

const ACCEPTED_TYPES = '.pdf,.docx,.mp3,.wav,.mp4';

export function UploadCard() {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    upload.mutate(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      className={`upload-card ${isDragging ? 'upload-card--dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {upload.isPending ? (
        <p>Uploading...</p>
      ) : (
        <>
          <p>Drop a file here, or click to browse</p>
          <p className="upload-card__hint">PDF, DOCX, MP3, WAV, MP4 — up to 100MB</p>
        </>
      )}

      {upload.isError && (
        <p className="upload-card__error" role="alert">
          {upload.error instanceof Error ? upload.error.message : 'Upload failed'}
        </p>
      )}
    </div>
  );
}