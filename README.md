# proposal-quantum-const

**Stage 0**

A TC39 proposal to introduce `QuantumDeclaration` — a new form of `const` that creates a pair of thenable bindings with guaranteed complementary values, determined non-deterministically at the moment of first observation.

## Motivation

There is no way in ECMAScript to create two values that are:

1. **Const** — neither can be reassigned after creation
2. **Passable** — each can travel independently through the program before being observed
3. **Complementary** — once either is observed, both are instantly determined, and their values always differ
4. **Cryptographically random** — the outcome is not predictable before observation

Today this requires manual coordination:

```js
import { randomFillSync } from "crypto";
const buf = Buffer.alloc(1);
randomFillSync(buf);
const aBit = buf[0] & 1;
const bBit = 1 - aBit;
```

This collapses immediately at the call site, couples the two values at creation, and provides no enforcement that they stay paired or immutable as they travel through the program.

## Proposed Syntax

```js
const[a, b];
```

`a` and `b` are `QuantumValue` objects — thenables that participate in the Promise resolution protocol. Neither has a determined value until first awaited. The first `await` of either one collapses the pair: one resolves to `0`, the other to `1`, using a cryptographically secure random source. Subsequent awaits return the same value.

## Examples

### Bell Pair

The canonical entangled pair. Two particles, one observation determines both.

```js
const[spin0, spin1];

const s0 = await spin0; // collapses — triggers entanglement
const s1 = await spin1; // instantly determined by spin0's collapse

console.log(s0 + s1); // always 1
console.log(s0 ^ s1); // always 1
```

### EPR Experiment

Two independent detectors. No classical channel between them. Anti-correlation is guaranteed by entanglement, not coordination.

```js
const[particleAlice, particleBob];

const detectorAlice = async qubit => await qubit;
const detectorBob   = async qubit => await qubit;

const [spinAlice, spinBob] = await Promise.all([
  detectorAlice(particleAlice),
  detectorBob(particleBob),
]);

console.log(spinAlice + spinBob); // always 1
```

### Quantum Key Distribution

Alice and Bob each receive one quantum reference. They observe independently and always get complementary bits — a shared secret established without any classical communication.

```js
const[alice, bob];

// References travel to separate parties — no value yet
const [aBit, bBit] = await Promise.all([alice, bob].map(q => Promise.resolve(q)));

console.log(aBit ^ bBit); // always 1 — guaranteed one-time pad segment
```

### Leader Election

Two workers each receive one quantum reference. Exactly one will observe `1` and proceed. No shared state, no lock, no coordination protocol.

```js
const[primary, replica];

async function worker(role, name) {
  return (await role) === 1 ? `${name} is leader` : null;
}

const [leader] = (await Promise.all([
  worker(primary, "node-a"),
  worker(replica, "node-b"),
])).filter(Boolean);

console.log(leader); // "node-a is leader" or "node-b is leader"
```

## Why Syntax?

The equivalent userland code is `const [a, b] = Quantum.entangle()`. The syntax form provides two things that the API form cannot:

1. **Const enforcement on both bindings** — the compiler can statically guarantee neither `a` nor `b` is reassigned, without needing runtime checks or Proxy wrappers.
2. **Lexical pairing** — the two bindings are visually and structurally coupled at the declaration site. It is impossible to accidentally pass the same reference to both sides, or to declare one without the other.

## Early Error

Duplicate binding names are a syntax error:

```js
const[x, x]; // SyntaxError
```

## Polyfill

```
npm install proposal-quantum-const
```

```js
const { entangle } = require("proposal-quantum-const");
const [a, b] = entangle();
const spin = await a; // 0 or 1
const pair = await b; // always 1 - spin
```

## Specification

Formal spec text lives in the [ecma262 fork](https://github.com/dmvjs/ecma262/tree/proposal-quantum-const). The key additions are:

- `QuantumEntanglementRecord` — shared record holding `[[Observed]]` and `[[ResolvedValue]]`
- `QuantumValue` objects — thenables with `[[QuantumPolarity]]` (`~primary~` or `~complement~`)
- `QuantumDeclaration` — new production in the `Declaration` grammar
- One early error, one evaluation algorithm

## Status

| Stage | Status |
|-------|--------|
| 0 | Strawperson |
| 1 | Not yet presented |
