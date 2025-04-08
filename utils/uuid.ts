import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

/**
 * Generates a random UUID v4
 * @returns A random UUID string
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Generates a UUID v5 using SHA-1 hash of namespace UUID and name
 * @param namespace - A UUID string to use as namespace
 * @param name - The name to generate UUID for
 * @returns A UUID v5 string
 */
export const generateUUIDv5 = (namespace: string, name: string): string => {
  return uuidv5(name, namespace);
};

/**
 * Validates if a string is a valid UUID
 * @param uuid - The UUID string to validate
 * @returns boolean indicating if the string is a valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}; 