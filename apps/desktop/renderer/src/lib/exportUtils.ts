/**
 * Generates a safe filename for exports.
 * Removes spaces, special characters, and appends a date/timestamp if provided.
 */
export function generateExportFilename(prefix: string, asOf?: Date | string): string {
  const sanitizedPrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  let dateSuffix = '';
  if (asOf) {
    try {
      const date = typeof asOf === 'string' ? new Date(asOf) : asOf;
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateSuffix = `-${year}-${month}-${day}`;
      }
    } catch {
      // Ignore invalid dates
    }
  } else {
    // Default to current date if not specified
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dateSuffix = `-${year}-${month}-${day}`;
  }

  return `vyora-${sanitizedPrefix}${dateSuffix}`;
}
