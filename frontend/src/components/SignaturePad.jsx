import { useRef, useEffect, useState } from 'react';

// Canvas tanda tangan sederhana: gambar bebas pakai jari/mouse/stylus,
// hasil disimpan sebagai base64 PNG lewat callback onChange.
export default function SignaturePad({ value, onChange, label }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
  }, []);

  // Load ulang gambar tiap kali `value` dari luar berubah (misal saat data
  // checklist selesai dimuat dari server, setelah komponen pertama render).
  useEffect(() => {
    if (!value) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setIsEmpty(false);
    };
    img.src = value;
  }, [value]);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing.current = true;
    lastPoint.current = getPoint(e);
  }

  function draw(e) {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint.current = point;
    setIsEmpty(false);
  }

  function endDraw() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    onChange(canvas.toDataURL('image/png'));
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange('');
  }

  return (
    <div>
      {label && <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>}
      <div className="border border-gray-300 dark:border-slate-600 rounded bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full touch-none cursor-crosshair"
          style={{ height: '150px' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-400">{isEmpty ? 'Belum ada tanda tangan' : 'Tanda tangan tersimpan'}</span>
        <button type="button" onClick={handleClear} className="text-xs text-status-error underline">
          Hapus
        </button>
      </div>
    </div>
  );
}