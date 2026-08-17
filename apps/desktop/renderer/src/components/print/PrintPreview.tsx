'use client';

import { AlertCircle, Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import React, { useState, useRef } from 'react';

export type PrintPreviewProps = {
  html: string;
  title?: string;
  zoom?: number;
  isLoading?: boolean;
  error?: string | null;
};

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  html,
  title = 'Document Preview',
  zoom: initialZoom = 1,
  isLoading = false,
  error = null,
}) => {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFit = React.useCallback(() => {
    if (containerRef.current) {
      // Container width minus padding (e.g. 64px for p-8 * 2)
      const availableWidth = containerRef.current.clientWidth - 64;
      const paperWidthPx = 794; // approx 210mm in pixels at 96dpi
      const calculatedZoom = Math.min(1.5, Math.max(0.2, availableWidth / paperWidthPx));
      setZoomLevel(calculatedZoom);
    } else {
      setZoomLevel(0.85);
    }
  }, []);

  React.useEffect(() => {
    if (!isLoading && html) {
      // Short delay to ensure container is fully rendered before measuring width
      const timer = setTimeout(() => {
        handleFit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, html, handleFit]);

  const hasError = error || (!isLoading && (!html || html.trim() === ''));

  if (hasError) {
    return (
      <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-neutral-300 bg-neutral-100">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-neutral-800">Preview Failed</h3>
        <p className="mt-2 max-w-sm text-center text-sm text-neutral-600">
          {error ||
            'The document could not be rendered because the HTML content is empty or malformed.'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-200">
      {/* Header Bar */}
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-neutral-300 bg-white px-4 py-3 shadow-sm">
        <h2 className="text-sm font-medium text-neutral-800">{title}</h2>
        <div className="flex items-center gap-3 rounded border border-neutral-200 bg-neutral-100 px-3 py-1.5 shadow-sm">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.2, z - 0.1))}
            className="text-neutral-500 transition-colors hover:text-neutral-900"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <input
            type="range"
            min="20"
            max="150"
            value={Math.round(zoomLevel * 100)}
            onChange={(e) => setZoomLevel(parseInt(e.target.value) / 100)}
            className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-neutral-300 accent-blue-600 outline-none"
          />

          <button
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="text-neutral-500 transition-colors hover:text-neutral-900"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <span className="w-10 text-right text-xs font-medium text-neutral-600">
            {Math.round(zoomLevel * 100)}%
          </span>

          <div className="mr-1 ml-1 h-4 w-px bg-neutral-300"></div>

          <button
            onClick={handleFit}
            className="flex items-center gap-1 text-neutral-500 transition-colors hover:text-neutral-900"
            title="Fit to screen"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div
        ref={containerRef}
        className="relative flex flex-1 items-start justify-center overflow-auto p-8"
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-200/50 backdrop-blur-sm">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-neutral-600">Rendering document...</p>
          </div>
        )}

        {/* Paper Container */}
        <div
          className="origin-top bg-white shadow-lg transition-transform duration-200 ease-in-out"
          style={{
            // Standard A4 dimensions roughly scaled for desktop viewport base size
            width: '210mm',
            minHeight: '297mm',
            transform: `scale(${zoomLevel})`,
          }}
        >
          {!isLoading && html && (
            <iframe
              srcDoc={html}
              sandbox="allow-same-origin"
              title={title}
              className="h-full min-h-[297mm] w-full border-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};
