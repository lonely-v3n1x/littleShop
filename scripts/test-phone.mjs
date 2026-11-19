/**
 * Unit tests for src/lib/phone.ts.
 * Imports the REAL functions so the tests exercise the actual contract.
 * Run with: node scripts/test-phone.mjs
 * (Node v22.6+ strips TypeScript types natively; no test runner required.)
 */

import assert from "node:assert/strict";
import { normaliseGhanaPhone, networkHintForE164 } from "../src/lib/phone.ts";

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

console.log(`Node version: ${process.version}`);
console.log("phone.normaliseGhanaPhone / networkHintForE164");

test("normaliseGhanaPhone('0541234567') -> +233541234567", () => {
  const result = normaliseGhanaPhone("0541234567");
  assert.equal(result.ok, true);
  assert.equal(result.e164, "+233541234567");
});

test("normaliseGhanaPhone('+233541234567') -> +233541234567 (unchanged)", () => {
  const result = normaliseGhanaPhone("+233541234567");
  assert.equal(result.ok, true);
  assert.equal(result.e164, "+233541234567");
});

test("normaliseGhanaPhone('233541234567') -> +233541234567", () => {
  const result = normaliseGhanaPhone("233541234567");
  assert.equal(result.ok, true);
  assert.equal(result.e164, "+233541234567");
});

test("normaliseGhanaPhone('not a number') -> ok:false with error", () => {
  const result = normaliseGhanaPhone("not a number");
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, "string");
});

test("networkHintForE164('+233541234567') -> 'mtn'", () => {
  assert.equal(networkHintForE164("+233541234567"), "mtn");
});

// Extra coverage for the remaining documented network hints.
test("networkHintForE164 telecel / at / unknown prefixes", () => {
  assert.equal(networkHintForE164("+233201234567"), "telecel");
  assert.equal(networkHintForE164("+233231234567"), "at");
  assert.equal(networkHintForE164("+233991234567"), "unknown");
});

console.log(`\n${passed} test(s) passed.`);
