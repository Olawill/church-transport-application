import { useDebouncedCallback } from "use-debounce";

/**
 * Creates a debounced version of the provided function.
 *
 * @param callback - The function to debounce.
 * @param delay - Delay in milliseconds.
 * @returns A debounced version of the function.
 */
export function useDebounceFn<Args extends unknown[], Return>(
  callback: (...args: Args) => Return,
  delay: number
) {
  return useDebouncedCallback<(...args: Args) => Return>(callback, delay);
}
