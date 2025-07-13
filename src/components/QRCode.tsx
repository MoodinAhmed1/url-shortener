'use client';

import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
}

export default function QRCode({ value, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (value && canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [value, size]);

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-medium mb-2">QR Code</h3>
      <canvas ref={canvasRef} />
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (canvasRef.current) {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = canvasRef.current.toDataURL('image/png');
            link.click();
          }
        }}
        className="text-sm text-blue-500 hover:text-blue-700 mt-2"
      >
        Download QR Code
      </a>
    </div>
  );
}