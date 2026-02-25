// Polyfill for quantum entangled declarations.
//
// Userland equivalent of:
//   const[a, b];
//
// Usage:
//   const [a, b] = entangle();
//   const spin = await a; // 0 or 1
//   const pair = await b; // always 1 - spin

"use strict";

const { randomFillSync } = require("crypto");

function entangle() {
  const record = { observed: false, resolvedValue: null };

  function makeQuantumValue(polarity) {
    return {
      then(onFulfilled) {
        if (!record.observed) {
          const buf = Buffer.alloc(1);
          randomFillSync(buf);
          record.resolvedValue = buf[0] & 1;
          record.observed = true;
        }
        const v = polarity === "primary"
          ? record.resolvedValue
          : 1 - record.resolvedValue;
        onFulfilled(v);
      }
    };
  }

  return [makeQuantumValue("primary"), makeQuantumValue("complement")];
}

module.exports = { entangle };
