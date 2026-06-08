import { TemplateRegistry } from '../registry/TemplateRegistry';
import { PrintPayload } from '../types';

export async function renderDocument<T = unknown>(
  templateId: string,
  payload: PrintPayload<T>,
): Promise<string> {
  const template = TemplateRegistry.get<T>(templateId);

  if (!template) {
    throw new Error(`Template with ID '${templateId}' not found in registry.`);
  }

  // Purely render the template, which returns an HTML string
  const htmlOutput = await template.render(payload);

  return htmlOutput;
}
