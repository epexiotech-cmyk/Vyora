'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

export type PrintPreviewProps = {
  html: string;
  title?: string;
  zoom?: number;
};

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  html,
  title = 'Document Preview',
  zoom = 1,
}) => {
  const [isLoading, setIsLoading] = useState(!(!html || html.trim() === ''));
  const [hasError, setHasError] = useState(!html || html.trim() === '');
  const [prevHtml, setPrevHtml] = useState(html);

  if (html !== prevHtml) {
    setPrevHtml(html);
    const empty = !html || html.trim() === '';
    setHasError(empty);
    setIsLoading(!empty);
  }

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-neutral-300 bg-neutral-100">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-neutral-800">Preview Failed</h3>
        <p className="mt-2 max-w-sm text-center text-sm text-neutral-600">
          The document could not be rendered because the HTML content is empty or malformed.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-200">
      {/* Header Bar */}
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-neutral-300 bg-white px-4 py-3 shadow-sm">
        <h2 className="text-sm font-medium text-neutral-800">{title}</h2>
        <div className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-500">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="relative flex flex-1 items-start justify-center overflow-auto p-8">
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
            transform: `scale(${zoom})`,
          }}
        >
          <iframe
            srcDoc={html}
            sandbox="allow-same-origin"
            onLoad={handleLoad}
            onError={handleError}
            title={title}
            className="h-full min-h-[297mm] w-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
