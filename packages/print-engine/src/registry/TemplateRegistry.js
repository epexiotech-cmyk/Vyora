class TemplateRegistryClass {
  templates = new Map();
  register(template) {
    if (this.templates.has(template.metadata.id)) {
      throw new Error(`Template with id ${template.metadata.id} is already registered.`);
    }
    this.templates.set(template.metadata.id, template);
  }
  get(templateId) {
    const template = this.templates.get(templateId);
    if (!template) return undefined;
    return template;
  }
  list() {
    return Array.from(this.templates.values());
  }
}
export const TemplateRegistry = new TemplateRegistryClass();
