'use client';

import { CheckCircle2, Trash2, FileSignature, Plus, ChevronDown } from 'lucide-react';
import * as React from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'sonner';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

const MAX_FILE_SIZE = 500 * 1024; // 500 KB limit for signature
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const COMMON_DESIGNATIONS = [
  'Authorized Signatory',
  'Proprietor',
  'Owner',
  'Director',
  'Managing Director',
  'Executive Director',
  'Additional Director',
  'Partner',
  'Managing Partner',
  'Designated Partner',
  'CEO',
  'CFO',
  'COO',
  'CTO',
  'Company Secretary',
  'Manager',
  'General Manager',
  'Assistant General Manager',
  'Deputy Manager',
  'Assistant Manager',
  'President',
  'Vice President',
  'Chairman',
  'Vice Chairman',
  'Trustee',
  'Secretary',
  'Treasurer',
  'Authorized Representative',
  'Legal Representative',
];

function DesignationDropdown({
  initialValue,
  options,
  onSave,
  disabled,
}: {
  initialValue: string;
  options: string[];
  onSave: (val: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = React.useState(initialValue);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          const finalVal =
            (value || '').trim() === '' ? 'Authorized Signatory' : (value || '').trim();
          setValue(finalVal);
          if (finalVal !== initialValue) {
            onSave(finalVal);
          }
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, value, initialValue, onSave]);

  const isExactMatch = options.some((o) => o.toLowerCase() === value.toLowerCase().trim());
  const filteredOptions = isExactMatch
    ? options
    : options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

  const handleSelect = (opt: string) => {
    setValue(opt);
    setIsOpen(false);
    if (opt !== initialValue) {
      onSave(opt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsOpen(false);
      const finalVal = (value || '').trim() === '' ? 'Authorized Signatory' : (value || '').trim();
      setValue(finalVal);
      if (finalVal !== initialValue) {
        onSave(finalVal);
      }
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 pr-8 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Type or select designation..."
      />
      <div
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
      >
        <ChevronDown className="h-4 w-4" />
      </div>

      {isOpen && !disabled && (
        <div className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-md">
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className="relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-slate-100 hover:text-slate-900"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                >
                  {opt}
                </div>
              ))}
              <div
                className="text-primary border-border relative mt-1 flex w-full cursor-pointer items-center rounded-sm border-t px-2 py-1.5 text-sm font-medium outline-none select-none hover:bg-slate-100"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue('');
                  // Keep focus in the input so they can type
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Custom Designation
              </div>
            </>
          ) : (
            <div
              className="relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-slate-100 hover:text-slate-900"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(value.trim() || 'Authorized Signatory');
              }}
            >
              Create &quot;{value}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CompanySignatureUpload() {
  const { context, refreshContext } = useCompanyContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = React.useState(false);
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);
  const [isSettingDefaultId, setIsSettingDefaultId] = React.useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [originalFile, setOriginalFile] = React.useState<File | null>(null);
  const [originalSrc, setOriginalSrc] = React.useState<string | null>(null);

  const imgRef = React.useRef<HTMLImageElement>(null);
  const [crop, setCrop] = React.useState<Crop>();

  // Background Removal Strength (1: Low, 2: Medium, 3: High)
  const [bgStrength, setBgStrength] = React.useState<number>(2);
  const [processedPreview, setProcessedPreview] = React.useState<string | null>(null);
  const [finalBlob, setFinalBlob] = React.useState<Blob | null>(null);

  const company = context?.company;
  const signatures = React.useMemo(() => company?.signatures || [], [company?.signatures]);

  const availableDesignations = React.useMemo(() => {
    // Merge COMMON_DESIGNATIONS with any unique designations already assigned to signatures
    const existing = signatures.map((s) => s.designation).filter(Boolean);
    return Array.from(new Set([...COMMON_DESIGNATIONS, ...existing]));
  }, [signatures]);

  const [isUpdatingDesignationId, setIsUpdatingDesignationId] = React.useState<string | null>(null);

  const handleUpdateDesignation = async (signatureId: string, designation: string) => {
    if (!company) return;
    try {
      setIsUpdatingDesignationId(signatureId);
      // @ts-expect-error IPC typings may take a moment to propagate
      const response = await window.vyora.company.updateSignatureDesignation(
        company.id,
        signatureId,
        designation,
      );
      if (response.success) {
        toast.success('Designation updated');
        await refreshContext();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update designation');
    } finally {
      setIsUpdatingDesignationId(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (originalSrc) URL.revokeObjectURL(originalSrc);
      if (processedPreview) URL.revokeObjectURL(processedPreview);
    };
  }, [originalSrc, processedPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 500KB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PNG, JPG, or WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setOriginalFile(file);
    const objectUrl = URL.createObjectURL(file);
    setOriginalSrc(objectUrl);
    setCrop(undefined); // Reset crop
    setBgStrength(2); // Reset strength to Medium
    setIsEditModalOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input so same file can be selected again
    }
  };

  const cancelEdit = () => {
    setIsEditModalOpen(false);
    if (originalSrc) URL.revokeObjectURL(originalSrc);
    if (processedPreview) URL.revokeObjectURL(processedPreview);
    setOriginalFile(null);
    setOriginalSrc(null);
    setProcessedPreview(null);
    setFinalBlob(null);
  };

  const processSignatureImage = async (
    imgSource: HTMLImageElement,
    currentCrop: Crop | undefined,
    strength: number,
    origFile?: File | null,
  ): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const scaleX = imgSource.naturalWidth / imgSource.width;
      const scaleY = imgSource.naturalHeight / imgSource.height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = imgSource.naturalWidth;
      let sourceHeight = imgSource.naturalHeight;

      if (currentCrop && currentCrop.width > 0 && currentCrop.height > 0) {
        sourceX = currentCrop.x * scaleX;
        sourceY = currentCrop.y * scaleY;
        sourceWidth = currentCrop.width * scaleX;
        sourceHeight = currentCrop.height * scaleY;
      }

      let targetWidth = sourceWidth;
      let targetHeight = sourceHeight;
      const MAX_DIMENSION = 1500;

      if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
          targetWidth = MAX_DIMENSION;
        } else {
          targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
          targetHeight = MAX_DIMENSION;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(
        imgSource,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight,
      );

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Threshold map: 1=Low(0.95), 2=Medium(0.85), 3=High(0.70)
      const bgThreshold = strength === 1 ? 0.95 : strength === 3 ? 0.7 : 0.85;
      const inkThreshold = strength === 1 ? 0.6 : strength === 3 ? 0.4 : 0.5;

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

        if (luminance > bgThreshold) {
          data[i + 3] = 0;
        } else if (luminance < inkThreshold) {
          data[i] = 20;
          data[i + 1] = 20;
          data[i + 2] = 20;
          data[i + 3] = 255;
        } else {
          const alphaScale = 1 - (luminance - inkThreshold) / (bgThreshold - inkThreshold);
          data[i] = 20;
          data[i + 1] = 20;
          data[i + 2] = 20;
          data[i + 3] = Math.round(a * alphaScale);
        }

        // Track bounding box for non-transparent pixels
        if (data[i + 3] > 0) {
          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Handle completely empty/transparent image
      if (minX > maxX || minY > maxY) {
        minX = 0;
        minY = 0;
        maxX = canvas.width - 1;
        maxY = canvas.height - 1;
      }

      const trimmedWidth = maxX - minX + 1;
      const trimmedHeight = maxY - minY + 1;

      // 1000px Preferred Normalization
      const PREFERRED_MAX_DIMENSION = 1000;
      let finalWidth = trimmedWidth;
      let finalHeight = trimmedHeight;
      let isNormalized = false;

      if (finalWidth > PREFERRED_MAX_DIMENSION || finalHeight > PREFERRED_MAX_DIMENSION) {
        isNormalized = true;
        if (finalWidth > finalHeight) {
          finalHeight = Math.round((finalHeight * PREFERRED_MAX_DIMENSION) / finalWidth);
          finalWidth = PREFERRED_MAX_DIMENSION;
        } else {
          finalWidth = Math.round((finalWidth * PREFERRED_MAX_DIMENSION) / finalHeight);
          finalHeight = PREFERRED_MAX_DIMENSION;
        }
      }

      console.log(
        `[Signature] Original Dimensions: ${imgSource.naturalWidth}x${imgSource.naturalHeight}`,
      );
      console.log(`[Signature] Resized Dimensions: ${canvas.width}x${canvas.height}`);
      console.log(`[Signature] Cropped/Trimmed Dimensions: ${trimmedWidth}x${trimmedHeight}`);
      console.log(`[Signature] Final Dimensions: ${finalWidth}x${finalHeight}`);
      console.log(`[Signature] Resolution Normalized: ${isNormalized ? 'Yes' : 'No'}`);

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = finalWidth;
      finalCanvas.height = finalHeight;
      const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });

      if (!finalCtx) {
        reject(new Error('Failed to create final canvas context'));
        return;
      }

      finalCtx.drawImage(
        canvas,
        minX,
        minY,
        trimmedWidth,
        trimmedHeight, // source
        0,
        0,
        finalWidth,
        finalHeight, // destination
      );

      const generateBlob = (cvs: HTMLCanvasElement): Promise<Blob> => {
        return new Promise((res, rej) => {
          cvs.toBlob(
            (b) => (b ? res(b) : rej(new Error('Failed to generate PNG blob'))),
            'image/png',
          );
        });
      };

      try {
        let currentBlob = await generateBlob(finalCanvas);
        let currentWidth = finalWidth;
        let currentHeight = finalHeight;
        const MIN_DIMENSION = 250;

        // Progressive reduction if over 500KB
        while (currentBlob.size > 500 * 1024) {
          if (Math.max(currentWidth, currentHeight) <= MIN_DIMENSION) {
            break;
          }

          let scale = 0.8; // Reduce by 20%
          let nextWidth = Math.round(currentWidth * scale);
          let nextHeight = Math.round(currentHeight * scale);

          // Enforce minimum dimension
          if (Math.max(nextWidth, nextHeight) < MIN_DIMENSION) {
            scale = MIN_DIMENSION / Math.max(currentWidth, currentHeight);
            nextWidth = Math.round(currentWidth * scale);
            nextHeight = Math.round(currentHeight * scale);
          }

          const nextCanvas = document.createElement('canvas');
          nextCanvas.width = nextWidth;
          nextCanvas.height = nextHeight;
          const nextCtx = nextCanvas.getContext('2d', { willReadFrequently: true });

          if (nextCtx) {
            // Draw from the original high-res canvas to prevent generation loss
            nextCtx.drawImage(
              finalCanvas,
              0,
              0,
              finalWidth,
              finalHeight,
              0,
              0,
              nextWidth,
              nextHeight,
            );
            currentBlob = await generateBlob(nextCanvas);
          }

          currentWidth = nextWidth;
          currentHeight = nextHeight;
        }

        if (origFile) {
          console.log(`[Signature] Original File Size: ${(origFile.size / 1024).toFixed(2)} KB`);
        }
        console.log(`[Signature] Processed PNG Size: ${(currentBlob.size / 1024).toFixed(2)} KB`);

        resolve(currentBlob);
      } catch (err) {
        reject(err);
      }
    });
  };

  // Live preview effect
  React.useEffect(() => {
    if (!originalSrc || !imgRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const blob = await processSignatureImage(imgRef.current!, crop, bgStrength, originalFile);
        if (processedPreview) {
          URL.revokeObjectURL(processedPreview);
        }
        setProcessedPreview(URL.createObjectURL(blob));
        setFinalBlob(blob);
      } catch (err) {
        console.error('Live preview failed:', err);
      }
    }, 150); // Debounce to prevent lag during dragging

    return () => clearTimeout(timer);
  }, [crop, bgStrength, originalSrc, processedPreview, originalFile]);

  const confirmUpload = async () => {
    if (!finalBlob || !originalFile || !company) return;

    if (finalBlob.size > MAX_FILE_SIZE) {
      toast.error('Processed image is too large. Please crop tighter or use a smaller image.');
      return;
    }

    try {
      setIsUploading(true);
      const arrayBuffer = await finalBlob.arrayBuffer();

      const response = await window.vyora.company.uploadSignature(
        company.id,
        originalFile.name,
        arrayBuffer,
      );

      if (response.success) {
        toast.success('Signature uploaded successfully');
        await refreshContext();
        cancelEdit();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload signature');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (signatureId: string) => {
    if (!company) return;

    try {
      setIsDeletingId(signatureId);
      // @ts-expect-error Types might not be fully propagated yet
      const response = await window.vyora.company.deleteSignatureById(company.id, signatureId);
      if (response.success) {
        toast.success('Signature removed');
        await refreshContext();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove signature');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSetDefault = async (signatureId: string) => {
    if (!company) return;
    try {
      setIsSettingDefaultId(signatureId);
      // @ts-expect-error Types might not be fully propagated yet
      const response = await window.vyora.company.setSignatureAsDefault(company.id, signatureId);
      if (response.success) {
        toast.success('Default signature updated');
        await refreshContext();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set default signature');
    } finally {
      setIsSettingDefaultId(null);
    }
  };

  return (
    <AppCard className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Company Signatures</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage signatures for your invoices. Only one signature can be the default.
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />
          <AppButton
            variant="default"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Signature
          </AppButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {signatures.length === 0 ? (
          <div className="text-muted-foreground bg-secondary/20 col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
            <FileSignature className="text-muted-foreground/50 mb-3 h-12 w-12" />
            <p>No signatures uploaded yet.</p>
            <AppButton variant="link" onClick={() => fileInputRef.current?.click()}>
              Upload your first signature
            </AppButton>
          </div>
        ) : (
          signatures.map((sig) => (
            <div
              key={sig.id}
              className="group hover:border-primary/50 relative flex flex-col rounded-lg border bg-white p-4 shadow-sm transition-colors"
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                .checkerboard-bg {
                  background-image: 
                    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
                  background-size: 20px 20px;
                  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }
              `,
                }}
              />

              {/* Header section with Label and Badge */}
              <div className="mb-3 flex items-center justify-between">
                <span className="truncate pr-2 text-sm font-medium">{sig.label}</span>
                {sig.isDefault && (
                  <span className="focus:ring-ring text-primary-foreground inline-flex flex-shrink-0 items-center rounded-full border border-transparent bg-green-600 px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:outline-none">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Default
                  </span>
                )}
              </div>

              {/* Image Preview */}
              <div className="checkerboard-bg relative mb-4 flex min-h-[120px] flex-1 items-center justify-center overflow-hidden rounded border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={company ? `vyora-asset://companies/${company.id}/${sig.filePath}` : ''}
                  alt={sig.label}
                  className="max-h-[100px] max-w-full object-contain"
                />
              </div>

              {/* Designation Selector */}
              <div className="relative mb-4">
                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                  Designation
                </label>
                <DesignationDropdown
                  key={`${sig.id}-${sig.designation || 'Authorized Signatory'}`}
                  initialValue={sig.designation || 'Authorized Signatory'}
                  options={availableDesignations}
                  onSave={(val) => handleUpdateDesignation(sig.id, val)}
                  disabled={isUpdatingDesignationId === sig.id}
                />
                {isUpdatingDesignationId === sig.id && (
                  <div className="absolute top-6 right-2">
                    <span className="border-primary flex h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-auto flex items-center justify-end gap-2 border-t pt-3">
                {!sig.isDefault && (
                  <AppButton
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={isSettingDefaultId === sig.id || isDeletingId === sig.id}
                    onClick={() => handleSetDefault(sig.id)}
                  >
                    {isSettingDefaultId === sig.id ? 'Setting...' : 'Set Default'}
                  </AppButton>
                )}
                <AppButton
                  variant="destructive"
                  size="sm"
                  className={sig.isDefault ? 'w-full' : ''}
                  disabled={isDeletingId === sig.id || isSettingDefaultId === sig.id}
                  onClick={() => handleDelete(sig.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeletingId === sig.id ? 'Removing...' : 'Remove'}
                </AppButton>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={(open: boolean) => !open && cancelEdit()}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Crop & Tune Signature</DialogTitle>
            <DialogDescription>
              Drag the box around your signature.
              <br />
              <span className="text-primary font-semibold">
                Only the selected area will be kept.
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Custom styles to force a dark overlay and clear crop borders */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            .ReactCrop {
              background-color: rgba(0, 0, 0, 0.6) !important;
            }
            .ReactCrop__crop-selection {
              border: 2px dashed #3b82f6 !important;
              box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.6) !important;
              background-color: rgba(255, 255, 255, 0.1);
            }
            .ReactCrop__drag-handle {
              width: 12px !important;
              height: 12px !important;
              background-color: #3b82f6 !important;
              border: 1px solid white !important;
            }
          `,
            }}
          />

          <div className="flex flex-col gap-6 py-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Original (Crop Area)</span>
                </div>
                <div
                  className="bg-muted border-border relative flex items-center justify-center overflow-hidden rounded-md border"
                  style={{ maxHeight: '250px' }}
                >
                  {originalSrc && (
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      className="relative max-h-[250px] w-auto"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imgRef}
                        src={originalSrc}
                        alt="Original Upload"
                        style={{ maxHeight: '250px', objectFit: 'contain' }}
                        onLoad={(e) => {
                          const { width, height } = e.currentTarget;
                          // Auto-select center with 10% margin
                          const cropW = width * 0.8;
                          const cropH = height * 0.8;
                          setCrop({
                            unit: 'px',
                            x: (width - cropW) / 2,
                            y: (height - cropH) / 2,
                            width: cropW,
                            height: cropH,
                          });
                        }}
                      />
                      {crop && (
                        <div
                          className="pointer-events-none absolute top-1 left-1 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white select-none"
                          style={{
                            transform: `translate(${crop.x}px, ${crop.y}px)`,
                            opacity: crop.width > 0 ? 1 : 0,
                          }}
                        >
                          CROP AREA
                        </div>
                      )}
                    </ReactCrop>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Live Preview</span>
                <div className="border-border checkerboard-bg relative flex h-full min-h-[150px] items-center justify-center overflow-hidden rounded-md border bg-white">
                  {processedPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={processedPreview}
                      alt="Processed Preview"
                      className="relative z-10 max-h-full max-w-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-muted-foreground z-10 flex h-full w-full flex-col items-center justify-center opacity-50">
                      <span className="text-sm">Processing...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 flex flex-col gap-2 rounded-md border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">Background Removal Strength</span>
                <span className="text-muted-foreground bg-background rounded border px-2 py-1 text-xs shadow-sm">
                  {bgStrength === 1 ? 'Low' : bgStrength === 2 ? 'Medium' : 'High'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground w-8 text-right text-xs font-medium">
                  Less
                </span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={bgStrength}
                  onChange={(e) => setBgStrength(parseInt(e.target.value))}
                  className="bg-secondary accent-primary h-2 flex-1 cursor-pointer appearance-none rounded-lg"
                />
                <span className="text-muted-foreground w-8 text-xs font-medium">More</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <AppButton variant="outline" onClick={cancelEdit} disabled={isUploading}>
              Cancel
            </AppButton>
            <AppButton onClick={confirmUpload} disabled={isUploading || !finalBlob}>
              {isUploading ? 'Processing...' : 'Confirm'}
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppCard>
  );
}
