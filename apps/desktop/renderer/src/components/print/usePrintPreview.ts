import type { WebContentsPrintOptions, PrintToPDFOptions } from 'electron';
import { useState, useEffect, useCallback } from 'react';

export function usePrintPreview(
  templateId: string,
  payload: import('@vyora/print-engine').PrintPayload<unknown> | null,
) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payloadStr = payload ? JSON.stringify(payload) : null;

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

  return {
    html,
    isLoading,
    error,
    reload,
    print,
    printToPdf,
  };
}
