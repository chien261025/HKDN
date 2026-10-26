import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSvgProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 42,
  displayValue = true,
  fontSize = 11,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          font: 'monospace',
          textMargin: 3,
          margin: 4,
          background: 'transparent',
          lineColor: '#0f172a',
        });
      } catch (err) {
        console.warn('JsBarcode render notice:', err);
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (!value) return null;

  return <svg ref={svgRef} className={`max-w-full ${className}`} />;
};
