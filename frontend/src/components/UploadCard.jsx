import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, ImageIcon, X } from 'lucide-react'

export default function UploadCard({ onFileSelected }) {
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (!file) return
      setPreview(URL.createObjectURL(file))
      setFileName(file.name)
      onFileSelected(file)
    },
    [onFileSelected],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
    multiple: false,
  })

  const clear = (e) => {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
    onFileSelected(null)
  }

  return (
    <div
      {...getRootProps()}
      className={`glass-card relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 p-8 text-center transition ${
        isDragActive ? 'border-scan-cyan/60 bg-navy-light/80' : ''
      }`}
    >
      <input {...getInputProps()} />

      {preview ? (
        <div className="relative w-full">
          <img
            src={preview}
            alt="Selected incident preview"
            className="mx-auto max-h-72 rounded-xl object-contain"
          />
          <button
            onClick={clear}
            className="absolute -right-2 -top-2 rounded-full bg-navy p-1.5 text-paper/80 ring-1 ring-navy-border hover:text-alert-red"
            aria-label="Remove selected image"
          >
            <X size={16} />
          </button>
          <p className="mt-3 font-mono text-xs text-paper/50">{fileName}</p>
        </div>
      ) : (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-scan-cyan/10 text-scan-cyan">
            {isDragActive ? <ImageIcon size={26} /> : <UploadCloud size={26} />}
          </span>
          <div>
            <p className="font-display text-lg font-semibold">
              {isDragActive ? 'Drop the image to load it' : 'Drag & drop an emergency image'}
            </p>
            <p className="mt-1 text-sm text-paper/60">or click to browse · JPG, PNG, WEBP up to 10MB</p>
          </div>
        </>
      )}
    </div>
  )
}
