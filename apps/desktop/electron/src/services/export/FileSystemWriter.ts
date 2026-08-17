import type * as fs from 'fs';

import { IExportWriter } from './types';

export class FileSystemWriter implements IExportWriter {
  private stream: fs.WriteStream | null = null;
  private filePath: string;
  private size: number = 0;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async open(): Promise<void> {
    const fs = await import('fs');
    this.stream = fs.createWriteStream(this.filePath, 'utf8');
  }

  public async write(chunk: string | Buffer): Promise<void> {
    if (!this.stream) {
      await this.open();
    }

    return new Promise((resolve, reject) => {
      if (!this.stream) return reject(new Error('Stream not initialized'));

      this.size += Buffer.byteLength(chunk);

      if (!this.stream.write(chunk)) {
        this.stream.once('drain', resolve);
      } else {
        resolve();
      }
    });
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.stream) return resolve();
      this.stream.end(() => {
        resolve();
      });
      this.stream.on('error', reject);
    });
  }

  public getFilePath(): string {
    return this.filePath;
  }

  public getSize(): number {
    return this.size;
  }
}
