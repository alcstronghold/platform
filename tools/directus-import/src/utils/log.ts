/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

/**
 * Logging utilities with colored output
 */
export const log = {
  info: (message: string): void => {
    console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
  },

  success: (message: string): void => {
    console.log(`${colors.green}[OK]${colors.reset} ${message}`);
  },

  warn: (message: string): void => {
    console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
  },

  error: (message: string, details?: unknown): void => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`);
    if (details) {
      const formatted = formatErrorDetails(details);
      console.error(`${colors.dim}${formatted}${colors.reset}`);
    }
  },

  header: (message: string): void => {
    console.log(`\n${colors.cyan}${colors.bold}─── ${message} ───${colors.reset}`);
  },

  summary: (message: string): void => {
    console.log(`${colors.cyan}${message}${colors.reset}`);
  },

  item: (status: 'created' | 'updated' | 'failed', identifier: string, details?: string): void => {
    const icons = {
      created: `${colors.green}+${colors.reset}`,
      updated: `${colors.blue}~${colors.reset}`,
      failed: `${colors.red}✗${colors.reset}`,
    };
    const msg = details ? `${identifier}: ${details}` : identifier;
    console.log(`  ${icons[status]} ${msg}`);
  },

  progress: (current: number, total: number, label: string): void => {
    const percentage = Math.round((current / total) * 100);
    console.log(`${colors.dim}[${current}/${total}] ${percentage}% - ${label}${colors.reset}`);
  },

  pass: (passNumber: number, pending: number): void => {
    console.log(`\n${colors.yellow}▸ Pass ${passNumber}${colors.reset} (${pending} items pending)`);
  },
};

/**
 * Format error details for display
 */
function formatErrorDetails(details: unknown): string {
  if (details instanceof Error) {
    // Extract Directus API errors if present
    const anyError = details as unknown as Record<string, unknown>;
    if (anyError.errors && Array.isArray(anyError.errors)) {
      return anyError.errors
        .map((e: Record<string, unknown>) => {
          const msg = e.message || 'Unknown error';
          const ext = e.extensions as Record<string, unknown> | undefined;
          return ext?.code ? `[${ext.code}] ${msg}` : String(msg);
        })
        .join('\n');
    }
    return details.message;
  }

  if (typeof details === 'object') {
    return JSON.stringify(details, null, 2);
  }

  return String(details);
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  // Handle Error instances
  if (error instanceof Error) {
    const anyError = error as unknown as Record<string, unknown>;

    // Directus API error with errors array
    if (anyError.errors && Array.isArray(anyError.errors)) {
      return anyError.errors
        .map((e: Record<string, unknown>) => e.message || 'Unknown')
        .join('; ');
    }

    return error.message;
  }

  // Handle plain objects (Directus sometimes throws non-Error objects)
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;

    // Directus error structure: { errors: [{ message: "..." }] }
    if (obj.errors && Array.isArray(obj.errors)) {
      return obj.errors
        .map((e) => {
          if (typeof e === 'object' && e !== null) {
            const errObj = e as Record<string, unknown>;
            return errObj.message || JSON.stringify(e);
          }
          return String(e);
        })
        .join('; ');
    }

    // Single error object with message
    if (obj.message && typeof obj.message === 'string') {
      return obj.message;
    }

    // Response object with status and data
    if (obj.response && typeof obj.response === 'object') {
      const resp = obj.response as Record<string, unknown>;
      if (resp.data && typeof resp.data === 'object') {
        const data = resp.data as Record<string, unknown>;
        if (data.errors && Array.isArray(data.errors)) {
          return data.errors
            .map((e) => {
              if (typeof e === 'object' && e !== null) {
                const errObj = e as Record<string, unknown>;
                return errObj.message || JSON.stringify(e);
              }
              return String(e);
            })
            .join('; ');
        }
      }
    }

    // Fallback: stringify the object
    try {
      return JSON.stringify(obj);
    } catch {
      return '[Object could not be serialized]';
    }
  }

  return String(error);
}
