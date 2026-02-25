/**
 * A QuantumValue is a thenable that resolves to 0 or 1.
 * Its value is not determined until first awaited.
 * Both values in an entangled pair are always complementary.
 */
export interface QuantumValue extends PromiseLike<0 | 1> {
  then<T>(onFulfilled: (value: 0 | 1) => T): Promise<T>;
}

/**
 * Returns a pair of entangled QuantumValues.
 * The first resolves to a cryptographically random bit (0 or 1).
 * The second always resolves to the complement of the first.
 * Neither value is determined until one of them is awaited.
 *
 * @example
 * const [a, b] = entangle();
 * const va = await a; // 0 or 1
 * const vb = await b; // always 1 - va
 */
export function entangle(): [QuantumValue, QuantumValue];
