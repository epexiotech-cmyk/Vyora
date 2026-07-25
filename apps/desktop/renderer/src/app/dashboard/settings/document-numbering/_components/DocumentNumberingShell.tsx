'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  DocumentType,
  DocumentNumberingConfigDto,
  documentNumberingConfigSchema,
} from '@vyora/types';
import { Save, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

const DOC_TYPE_OPTIONS = Object.keys(DocumentType).map((key) => ({
  value: key,
  label: key.replace(/_/g, ' '),
}));

const FY_FORMAT_OPTIONS = [
  { value: 'YY-YY', label: 'YY-YY (e.g. 25-26)' },
  { value: 'YYYY-YY', label: 'YYYY-YY (e.g. 2025-26)' },
  { value: 'YYYY-YYYY', label: 'YYYY-YYYY (e.g. 2025-2026)' },
  { value: 'FYYY-YY', label: 'FYYY-YY (e.g. FY25-26)' },
];

export function DocumentNumberingShell() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [selectedType, setSelectedType] = React.useState<string>(DocumentType.SALES_INVOICE);

  const router = useRouter();

  const methods = useForm<DocumentNumberingConfigDto>({
    // @ts-expect-error zodResolver type mismatch with DocumentNumberingConfigDto
    resolver: zodResolver(documentNumberingConfigSchema),
    defaultValues: {
      documentType: DocumentType.SALES_INVOICE,
      prefix: '',
      formatTemplate: '{{PREFIX}}-{{FY}}-{{SEQ}}',
      fyFormat: 'YY-YY',
      startingNumber: 1,
      zeroPadding: 4,
      resetYearly: true,
    },
  });

  const loadConfig = React.useCallback(
    async (type: string) => {
      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        const res = await window.vyora.settings.documentNumbering.get(type);
        if (res.success && res.data) {
          methods.reset(res.data);
        } else {
          // Reset to default for this type if not found (backend usually provides a default, but just in case)
          methods.reset({
            documentType: type as DocumentType,
            prefix: '',
            formatTemplate: '{{PREFIX}}-{{FY}}-{{SEQ}}',
            fyFormat: 'YY-YY',
            startingNumber: 1,
            zeroPadding: 4,
            resetYearly: true,
          });
        }
      } catch (err) {
        setErrorMsg('Failed to load document numbering configuration.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [methods],
  );

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      loadConfig(selectedType);
    }, 0);
    return () => clearTimeout(timeout);
  }, [selectedType, loadConfig]);

  const onSubmit = async (formData: unknown) => {
    const data = formData as DocumentNumberingConfigDto;
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await window.vyora.settings.documentNumbering.save(data);
      if (res.success) {
        setSuccessMsg('Configuration saved successfully.');
        methods.reset(res.data); // Reset form state to clear dirty flags
      } else {
        setErrorMsg(res.error || 'Failed to save configuration.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred while saving.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const resetYearly = useWatch({ control: methods.control, name: 'resetYearly' });
  const formatTemplate = useWatch({ control: methods.control, name: 'formatTemplate' });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-6 pb-4">
        {errorMsg && (
          <div className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-center justify-between rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
            <span>{successMsg}</span>
          </div>
        )}
        <div className="mb-2 flex items-center gap-4">
          <AppButton variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </AppButton>
          <SectionHeader
            title="Document Numbering"
            description="Configure auto-generation sequence templates for various document types."
          />
        </div>
      </div>

      <div className="scrollbar-thumb-border bg-muted/20 flex-1 scrollbar-thin scrollbar-track-transparent overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <AppCard className="p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b pb-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <h3 className="text-foreground text-sm font-semibold tracking-wide">
                Select Document Type
              </h3>
            </div>
            <div className="w-1/2">
              <label className="mb-1 block text-sm font-medium">Document Type</label>
              <select
                className="w-full rounded-md border p-2 text-sm"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                disabled={isLoading || isSaving}
              >
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </AppCard>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center p-8">
              <p className="text-muted-foreground animate-pulse text-sm">
                Loading Configuration...
              </p>
            </div>
          ) : (
            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
                id="doc-numbering-form"
              >
                <AppCard className="p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2 border-b pb-3">
                    <RefreshCw className="text-muted-foreground h-5 w-5" />
                    <h3 className="text-foreground text-sm font-semibold tracking-wide">
                      Sequence Configuration
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <AppField name="prefix" label="Prefix">
                      <FormInput name="prefix" type="text" placeholder="e.g. INV" />
                    </AppField>
                    <AppField name="formatTemplate" label="Format Template *">
                      <FormInput
                        name="formatTemplate"
                        type="text"
                        placeholder="{{PREFIX}}-{{FY}}-{{SEQ}}"
                      />
                      <p className="text-muted-foreground mt-1 text-xs">
                        Use {'{{PREFIX}}'}, {'{{FY}}'}, and {'{{SEQ}}'} tokens.
                      </p>
                    </AppField>

                    {formatTemplate?.includes('{{FY}}') && (
                      <AppField name="fyFormat" label="Financial Year Format">
                        <FormSelect name="fyFormat" options={FY_FORMAT_OPTIONS} />
                      </AppField>
                    )}

                    <AppField name="startingNumber" label="Starting Number *">
                      <FormInput name="startingNumber" type="number" min={1} />
                    </AppField>

                    <AppField name="zeroPadding" label="Zero Padding length *">
                      <FormInput name="zeroPadding" type="number" min={1} max={10} />
                      <p className="text-muted-foreground mt-1 text-xs">
                        Length of sequence (e.g. 4 makes 1 into 0001).
                      </p>
                    </AppField>

                    <div className="mt-4 flex items-center space-x-2 md:col-span-2">
                      <input
                        type="checkbox"
                        id="resetYearly"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={resetYearly ?? true}
                        onChange={(e) =>
                          methods.setValue('resetYearly', e.target.checked, { shouldDirty: true })
                        }
                      />
                      <label
                        htmlFor="resetYearly"
                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Reset sequence yearly (Requires FY to be active)
                      </label>
                    </div>
                  </div>
                </AppCard>
              </form>
            </FormProvider>
          )}
        </div>
      </div>

      <div className="bg-background border-border z-10 shrink-0 border-t p-4 px-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            {methods.formState.isDirty && (
              <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <AppButton
              type="submit"
              form="doc-numbering-form"
              disabled={isLoading || isSaving || (!methods.formState.isDirty && !errorMsg)}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
