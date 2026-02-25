"use strict";

function randomBit() {
  const buf = new Uint8Array(1);
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    globalThis.crypto.getRandomValues(buf);
  } else {
    require("crypto").randomFillSync(buf);
  }
  return buf[0] & 1;
}

function entangle() {
  const record = { observed: false, value: 0 };

  function makeQuantumValue(complement) {
    return {
      then(onFulfilled) {
        if (!record.observed) {
          record.value = randomBit();
          record.observed = true;
        }
        onFulfilled(complement ? 1 - record.value : record.value);
      }
    };
  }

  return [makeQuantumValue(false), makeQuantumValue(true)];
}

module.exports = { entangle };
