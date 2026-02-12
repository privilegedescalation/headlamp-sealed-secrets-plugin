/**
 * Runtime validators and type guards
 *
 * Provides validation functions for user input, configuration values,
 * and runtime type checking for SealedSecret objects.
 */

import { SealedSecretInterface, SealedSecretScope } from '../types';
import { SealedSecret } from './SealedSecretCRD';

/**
 * Runtime type guard for SealedSecret
 *
 * @param obj Object to check
 * @returns true if obj is a SealedSecret instance
 */
export function isSealedSecret(obj: any): obj is SealedSecret {
  return (
    obj instanceof SealedSecret &&
    obj.jsonData &&
    'spec' in obj.jsonData &&
    'encryptedData' in obj.jsonData.spec
  );
}

/**
 * Validate SealedSecret structure
 *
 * @param obj Object to validate
 * @returns true if obj has valid SealedSecret structure
 */
export function validateSealedSecretInterface(obj: any): obj is SealedSecretInterface {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'spec' in obj &&
    typeof obj.spec === 'object' &&
    'encryptedData' in obj.spec &&
    typeof obj.spec.encryptedData === 'object'
  );
}

/**
 * Validate scope value
 *
 * @param value Value to check
 * @returns true if value is a valid SealedSecretScope
 */
export function isSealedSecretScope(value: any): value is SealedSecretScope {
  return ['strict', 'namespace-wide', 'cluster-wide'].includes(value);
}

/**
 * Validate Kubernetes resource name
 *
 * Must match DNS-1123 subdomain:
 * - lowercase alphanumeric characters, '-' or '.'
 * - start and end with alphanumeric character
 * - max 253 characters
 *
 * @param name Name to validate
 * @returns true if valid Kubernetes resource name
 */
export function isValidK8sName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 253) {
    return false;
  }

  // DNS-1123 subdomain format
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(name);
}

/**
 * Validate Kubernetes label/annotation key
 *
 * @param key Key to validate
 * @returns true if valid Kubernetes key
 */
export function isValidK8sKey(key: string): boolean {
  if (!key || key.length === 0 || key.length > 253) {
    return false;
  }

  // Simple alphanumeric key validation
  return /^[a-zA-Z0-9]([-_.a-zA-Z0-9]*[a-zA-Z0-9])?$/.test(key);
}

/**
 * Validate PEM certificate format
 *
 * Checks for BEGIN/END CERTIFICATE markers and basic structure
 *
 * @param value String to validate
 * @returns true if valid PEM format
 */
export function isValidPEM(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Check for PEM markers and basic structure
  const pemRegex = /^-----BEGIN CERTIFICATE-----\s+[\s\S]+\s+-----END CERTIFICATE-----\s*$/;
  return pemRegex.test(value.trim());
}

/**
 * Validate that a value is not empty
 *
 * @param value Value to check
 * @returns true if value is non-empty string
 */
export function isNonEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate namespace name
 *
 * Same rules as resource names
 *
 * @param namespace Namespace to validate
 * @returns true if valid namespace name
 */
export function isValidNamespace(namespace: string): boolean {
  return isValidK8sName(namespace);
}

/**
 * Validation result with error message
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate secret name with detailed error message
 *
 * @param name Secret name to validate
 * @returns Validation result with error message if invalid
 */
export function validateSecretName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Secret name is required' };
  }

  if (name.length > 253) {
    return { valid: false, error: 'Secret name must be 253 characters or less' };
  }

  if (!isValidK8sName(name)) {
    return {
      valid: false,
      error:
        'Secret name must be lowercase alphanumeric, may contain hyphens and dots, and must start/end with alphanumeric',
    };
  }

  return { valid: true };
}

/**
 * Validate secret key name with detailed error message
 *
 * @param key Key name to validate
 * @returns Validation result with error message if invalid
 */
export function validateSecretKey(key: string): ValidationResult {
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'Key name is required' };
  }

  if (key.length > 253) {
    return { valid: false, error: 'Key name must be 253 characters or less' };
  }

  if (!isValidK8sKey(key)) {
    return {
      valid: false,
      error: 'Key name must be alphanumeric and may contain hyphens, underscores, and dots',
    };
  }

  return { valid: true };
}

/**
 * Validate secret value (plaintext)
 *
 * @param value Secret value to validate
 * @returns Validation result with error message if invalid
 */
export function validateSecretValue(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: 'Secret value is required' };
  }

  // Check for reasonable size limit (1MB)
  if (value.length > 1024 * 1024) {
    return { valid: false, error: 'Secret value must be less than 1MB' };
  }

  return { valid: true };
}

/**
 * Validate PEM certificate with detailed error message
 *
 * @param pem PEM certificate to validate
 * @returns Validation result with error message if invalid
 */
export function validatePEMCertificate(pem: string): ValidationResult {
  if (!pem || pem.trim().length === 0) {
    return { valid: false, error: 'Certificate is required' };
  }

  if (!isValidPEM(pem)) {
    return {
      valid: false,
      error: 'Invalid PEM format. Must contain BEGIN CERTIFICATE and END CERTIFICATE markers',
    };
  }

  return { valid: true };
}

/**
 * Validate plugin configuration
 *
 * @param config Configuration to validate
 * @returns Validation result with error message if invalid
 */
export function validatePluginConfig(config: {
  controllerName?: string;
  controllerNamespace?: string;
  controllerPort?: number;
}): ValidationResult {
  if (!config.controllerName || !isValidK8sName(config.controllerName)) {
    return { valid: false, error: 'Invalid controller name' };
  }

  if (!config.controllerNamespace || !isValidNamespace(config.controllerNamespace)) {
    return { valid: false, error: 'Invalid controller namespace' };
  }

  if (!config.controllerPort || config.controllerPort < 1 || config.controllerPort > 65535) {
    return { valid: false, error: 'Invalid controller port (must be 1-65535)' };
  }

  return { valid: true };
}
