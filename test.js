// Tests using the polyfill — mirrors test/quantum-const.js in the spec repo.
"use strict";
const { entangle } = require("./index");

async function run() {
  function assert(condition, message) {
    if (!condition) throw new Error("FAIL: " + message);
  }

  // Basic properties
  { const [a, b] = entangle();
    const va = await a, vb = await b;
    assert(va + vb === 1, "complementary");
    assert(va !== vb,     "distinct"); }

  { const [p, q] = entangle();
    const vp = await p;
    assert(vp === await p, "stable after collapse"); }

  { const [m, n] = entangle();
    const vn = await n;
    assert((await m) + vn === 1, "complement collapses first"); }

  // EPR Experiment
  { const [particleAlice, particleBob] = entangle();
    const detectorAlice = async q => await q;
    const detectorBob   = async q => await q;
    const [spinAlice, spinBob] = await Promise.all([
      detectorAlice(particleAlice),
      detectorBob(particleBob),
    ]);
    assert(spinAlice + spinBob === 1,
      "spins anti-correlate across independent detectors without communication"); }

  // Collapse order independence
  { const [alice, bob] = entangle();
    const bobSpin   = await bob;
    const aliceSpin = await alice;
    assert(aliceSpin + bobSpin === 1,
      "measuring the complement first instantly determines the primary"); }

  // Quantum key distribution
  { const [alice, bob] = entangle();
    const [aBit, bBit] = await Promise.all([alice, bob].map(q => Promise.resolve(q)));
    assert((aBit ^ bBit) === 1,
      "QKD: entangled pair always yields complementary bits — XOR is always 1"); }

  console.log("All tests passed.");
}

run().catch(e => { console.error(e.message); process.exit(1); });
