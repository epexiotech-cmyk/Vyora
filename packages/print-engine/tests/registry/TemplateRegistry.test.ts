import { describe, expect, it } from 'vitest';

import { TemplateRegistry } from '../../src/registry/TemplateRegistry';

describe('TemplateRegistry', () => {
  it('registers template successfully', () => {
    TemplateRegistry.register({
      metadata: {
        id: 'test1',
        name: 'Test',
        version: '1',
        supportedDocumentTypes: ['TAX_INVOICE'],
      },
      render: async () => '<h1>Hello World</h1>',
    });

    const template = TemplateRegistry.get('test1');
    expect(template).toBeDefined();
    expect(template?.metadata.id).toBe('test1');
  });

  it('rejects duplicate registration', () => {
    TemplateRegistry.register({
      metadata: {
        id: 'test-dup',
        name: 'Test',
        version: '1',
        supportedDocumentTypes: ['TAX_INVOICE'],
      },
      render: async () => 'dup',
    });

    expect(() => {
      TemplateRegistry.register({
        metadata: {
          id: 'test-dup',
          name: 'Test2',
          version: '2',
          supportedDocumentTypes: ['TAX_INVOICE'],
        },
        render: async () => 'dup2',
      });
    }).toThrowError(/already registered/);
  });

  it('returns undefined for unknown template lookup', () => {
    const template = TemplateRegistry.get('unknown-id');
    expect(template).toBeUndefined();
  });

  it('lists all registered templates', () => {
    TemplateRegistry.register({
      metadata: {
        id: 'list1',
        name: 'L1',
        version: '1',
        supportedDocumentTypes: ['TAX_INVOICE'],
      },
      render: async () => 'l1',
    });
    TemplateRegistry.register({
      metadata: {
        id: 'list2',
        name: 'L2',
        version: '1',
        supportedDocumentTypes: ['TAX_INVOICE'],
      },
      render: async () => 'l2',
    });

    const templates = TemplateRegistry.list();
    // It should include at least the two we just added
    expect(templates.length).toBeGreaterThanOrEqual(2);
    expect(templates.map((t) => t.metadata.id)).toContain('list1');
    expect(templates.map((t) => t.metadata.id)).toContain('list2');
  });
});
