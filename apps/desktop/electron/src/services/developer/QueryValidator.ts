export class QueryValidator {
  private static ALLOWED_KEYWORDS = ['SELECT', 'WITH', 'EXPLAIN', 'PRAGMA'];

  public static validate(sql: string): string {
    // Trim and normalize whitespace
    let normalizedSql = sql.trim().replace(/\s+/g, ' ');

    if (!normalizedSql) {
      throw new Error('Empty query.');
    }

    // Check for multiple statements (semicolon followed by anything other than whitespace)
    if (/;\s*\S/.test(normalizedSql)) {
      throw new Error('Forbidden: Multiple statements are not allowed.');
    }

    // Remove a trailing semicolon for keyword checking if it's there
    if (normalizedSql.endsWith(';')) {
      normalizedSql = normalizedSql.slice(0, -1).trim();
    }

    // Get the first keyword
    const firstKeyword = normalizedSql.split(' ')[0].toUpperCase();

    if (!this.ALLOWED_KEYWORDS.includes(firstKeyword)) {
      throw new Error(
        `Forbidden: Statement begins with '${firstKeyword}'. Only SELECT, WITH, EXPLAIN, and PRAGMA are allowed.`,
      );
    }

    return sql; // Return original trimmed sql if valid (to preserve exact formatting the user wanted in execution, though we could return normalized)
  }
}
