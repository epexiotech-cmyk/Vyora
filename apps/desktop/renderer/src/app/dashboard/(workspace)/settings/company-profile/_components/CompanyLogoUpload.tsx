'use client';

import { ImagePlus, Trash2, Building2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

export function CompanyLogoUpload() {
  const { context, refreshContext } = useCompanyContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const company = context?.company;
  const logoPath = company?.logoPath;

  // Cleanup object URLs to avoid memory leaks
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Derive the display URL to avoid sync setState in effects
  const displayUrl =
    previewUrl ||
    (logoPath && company ? `vyora-asset://companies/${company.id}/${logoPath}` : null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PNG, JPG, WEBP, or SVG.');
      return;
    }

    try {
      setIsUploading(true);

      // Create temporary preview and revoke any existing one
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Read to ArrayBuffer for IPC
      const buffer = await file.arrayBuffer();

      const res = await window.vyora.company.uploadLogo(company.id, file.name, buffer);

      if (res.success) {
        toast.success('Logo uploaded successfully.');
        await refreshContext();
      } else {
        toast.error(res.error || 'Failed to upload logo.');
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('An unexpected error occurred during upload.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!company || !logoPath) return;

    const confirmed = window.confirm('Are you sure you want to remove the company logo?');
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const res = await window.vyora.company.deleteLogo(company.id);

      if (res.success) {
        toast.success('Logo removed successfully.');
        setPreviewUrl(null);
        await refreshContext();
      } else {
        toast.error(res.error || 'Failed to delete logo.');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('An unexpected error occurred during deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!company) return null;

  return (
    <AppCard className="mb-6 p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2 border-b pb-3">
        <ImagePlus className="text-muted-foreground h-5 w-5" />
        <h3 className="text-foreground text-sm font-semibold tracking-wide">Company Logo</h3>
      </div>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        {/* Logo Preview */}
        <div className="bg-muted border-border flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-dashed">
          {displayUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={displayUrl} alt="Company Logo" className="h-full w-full object-contain p-2" />
          ) : (
            <Building2 className="text-muted-foreground/30 h-12 w-12" />
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm">
            Upload your company logo to display on invoices and reports.
          </p>
          <p className="text-muted-foreground text-xs">
            Supported formats: PNG, JPG, WEBP, SVG. Maximum size: 5MB.
          </p>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              className="hidden"
            />
            <AppButton
              variant="outline"
              disabled={isUploading || isDeleting}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Uploading...' : logoPath ? 'Replace Logo' : 'Upload Logo'}
            </AppButton>
            {logoPath && (
              <AppButton
                variant="destructive"
                disabled={isUploading || isDeleting}
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Removing...' : 'Remove'}
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </AppCard>
  );
}
