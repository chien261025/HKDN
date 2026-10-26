import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 80,
  level = 'M',
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (value) {
      QRCode.toDataURL(value, {
        width: size * 2, // 2x for sharp print quality
        margin: 1,
        errorCorrectionLevel: level,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(setDataUrl)
        .catch((err) => console.warn('QRCode generation notice:', err));
    }
  }, [value, size, level]);

  if (!value || !dataUrl) return null;

  return (
    <img
      src={dataUrl}
      alt={`QR-${value}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`rounded-md ${className}`}
    />
  );
};
