import { TemplateDefinition } from '../types';

class TemplateRegistryClass {
  private templates: Map<string, TemplateDefinition<unknown>> = new Map();

  public register<T>(template: TemplateDefinition<T>): void {
    if (this.templates.has(template.metadata.id)) {
      throw new Error(`Template with id ${template.metadata.id} is already registered.`);
    }
    this.templates.set(template.metadata.id, template as unknown as TemplateDefinition<unknown>);
  }

  public get<T = unknown>(templateId: string): TemplateDefinition<T> | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;
    return template as unknown as TemplateDefinition<T>;
  }

  public list(): TemplateDefinition<unknown>[] {
    return Array.from(this.templates.values());
  }
}

export const TemplateRegistry = new TemplateRegistryClass();
