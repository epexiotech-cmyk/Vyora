import { ExportFormat } from '@vyora/types';

import { CsvExporter } from './CsvExporter';
import { JsonExporter } from './JsonExporter';
import { IExporter } from './types';

class ExporterRegistryClass {
  private exporters = new Map<ExportFormat, IExporter>();

  public register(exporter: IExporter): void {
    if (this.exporters.has(exporter.format)) {
      console.warn(
        `Exporter for format '${exporter.format}' is already registered and will be overwritten.`,
      );
    }
    this.exporters.set(exporter.format, exporter);
  }

  public get(format: ExportFormat): IExporter {
    const exporter = this.exporters.get(format);
    if (!exporter) {
      throw new Error(`Exporter for format '${format}' not found in registry.`);
    }
    return exporter;
  }

  public has(format: ExportFormat): boolean {
    return this.exporters.has(format);
  }
}

export const exporterRegistry = new ExporterRegistryClass();

// Auto-register built-in exporters
exporterRegistry.register(new CsvExporter());
exporterRegistry.register(new JsonExporter());
