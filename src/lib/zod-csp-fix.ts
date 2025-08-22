/**
 * Zod CSP compatibility fix
 *
 * This module handles Zod's CSP compatibility by letting it naturally
 * detect that eval is not available and fall back to the slower path.
 *
 * No intervention needed - Zod handles CSP gracefully on its own.
 */

export function initZodCSPFix() {
  // Zod v4.0.17 handles CSP gracefully without intervention
  // The util.js:149 error is expected and Zod catches it internally
  console.debug('Zod CSP: Using natural CSP handling (no patches needed)');
}