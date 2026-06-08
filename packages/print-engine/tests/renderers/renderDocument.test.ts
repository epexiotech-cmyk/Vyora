import { beforeAll, describe, expect, it } from 'vitest';

import { TemplateRegistry } from '../../src/registry/TemplateRegistry';
import { renderDocument } from '../../src/renderers';
import { PrintPayload } from '../../src/types';

describe('renderDocument', () => {
  beforeAll(() => {
    TemplateRegistry.register({
      metadata: {
        id: 'render-test',
        name: 'Render Test',
        version: '1',
        supportedDocumentTypes: ['TAX_INVOICE'],
      },
      render: async (payload: unknown) => {
        const p = payload as PrintPayload<{ invoiceNumber: string }>;
        return `<h1>${p.data.invoiceNumber || 'No Title'}</h1>`;
      },
    });
  });

  it('renders valid template successfully', async () => {
    const output = await renderDocument('render-test', {
      documentType: 'TAX_INVOICE',
      data: { invoiceNumber: 'INV-123' },
    });

    expect(output).toBe('<h1>INV-123</h1>');
  });

  it('throws for invalid template', async () => {
    await expect(
      renderDocument('invalid-template', {
        documentType: 'TAX_INVOICE',
        data: { invoiceNumber: 'INV-123' },
      }),
    ).rejects.toThrowError(/not found in registry/);
  });
});
