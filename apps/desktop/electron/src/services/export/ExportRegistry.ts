import { ExportProvider } from './ExportProvider';

class ExportRegistryClass {
  private providers = new Map<string, ExportProvider<Record<string, unknown>>>();

  public register(provider: ExportProvider<Record<string, unknown>>): void {
    if (this.providers.has(provider.id)) {
      console.warn(
        `ExportProvider with ID '${provider.id}' is already registered and will be overwritten.`,
      );
    }
    this.providers.set(provider.id, provider);
  }

  public get(id: string): ExportProvider<Record<string, unknown>> {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`ExportProvider with ID '${id}' not found in registry.`);
    }
    return provider;
  }

  public has(id: string): boolean {
    return this.providers.has(id);
  }
}

export const exportRegistry = new ExportRegistryClass();
