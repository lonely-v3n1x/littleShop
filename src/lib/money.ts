/**
 * The ONLY money formatter in blink (Frozen Core §0.6).
 * `GH₵` must never appear anywhere else — see the Phase A acceptance grep.
 *
 * @param pesewas integer minor units. 1000 === GH₵10.00
 */
export function formatGhs(pesewas: number): string {
  return `GH₵${(pesewas / 100).toFixed(2)}`;
}
