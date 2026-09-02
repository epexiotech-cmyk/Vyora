import type { WebContentsPrintOptions, PrintToPDFOptions } from 'electron';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';

export function usePrintPreview(
  templateId: string,
  payload: import('@vyora/print-engine').PrintPayload<unknown> | null,
) {
  const { context: companyContext } = useCompanyContext();
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = companyContext?.currency;

  const payloadWithMeta = useMemo(() => {
    if (!payload || !currency) return null;
    return {
      ...payload,
      currencyMeta: currency,
    };
  }, [payload, currency]);

  const payloadStr = payloadWithMeta ? JSON.stringify(payloadWithMeta) : null;

  const reload = useCallback(async () => {
    if (!templateId || !payloadStr) {
      Promise.resolve().then(() => setHtml(''));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const parsedPayload = JSON.parse(payloadStr);
      const result = await window.vyora.print.render(templateId, parsedPayload);
      setHtml(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [templateId, payloadStr]);

  useEffect(() => {
    Promise.resolve().then(() => reload());
  }, [reload]);

  const print = useCallback(
    async (options?: WebContentsPrintOptions) => {
      if (!payloadStr) return { success: false, failureReason: 'No payload provided' };
      return await window.vyora.print.print(templateId, JSON.parse(payloadStr), options);
    },
    [templateId, payloadStr],
  );

  const printToPdf = useCallback(
    async (options?: PrintToPDFOptions) => {
      if (!payloadStr) throw new Error('No payload provided');
      return await window.vyora.print.printToPdf(templateId, JSON.parse(payloadStr), options);
    },
    [templateId, payloadStr],
  );

  const saveTempPdfAndShare = useCallback(
    async (fileName: string, options?: PrintToPDFOptions) => {
      if (!payloadStr) throw new Error('No payload provided');
      return await window.vyora.print.saveTempPdfAndShare(
        templateId,
        JSON.parse(payloadStr),
        fileName,
        options,
      );
    },
    [templateId, payloadStr],
  );

  return {
    html,
    isLoading,
    error,
    print,
    printToPdf,
    saveTempPdfAndShare,
    reload,
  };
}
