import type { AuthPort, AuthResult, LoginCredentials } from '../../ports';

/**
 * Simple email validation without regex (avoids ReDoS vulnerabilities)
 * Checks: non-empty, has exactly one @, has text before/after @, has dot after @
 */
function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;

  const atIndex = trimmed.indexOf('@');
  if (atIndex < 1) return false; // Must have char before @
  if (trimmed.slice(atIndex + 1).includes('@')) return false; // Only one @

  const domain = trimmed.slice(atIndex + 1);
  if (domain.length < 3) return false; // At least "a.b"
  if (!domain.includes('.')) return false; // Must have dot in domain

  return true;
}

/**
 * Login Use Case
 * Validates credentials and delegates to auth port
 */
export class LoginUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(credentials: LoginCredentials): Promise<AuthResult> {
    // Validate required fields
    if (!credentials.email?.trim()) {
      return { success: false, error: 'El email es obligatorio' };
    }

    if (!credentials.password) {
      return { success: false, error: 'La contraseña es obligatoria' };
    }

    // Validate email format (simple check, no regex)
    if (!isValidEmail(credentials.email)) {
      return { success: false, error: 'El formato del email no es válido' };
    }

    // Delegate to auth port
    return this.authPort.login({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });
  }
}
