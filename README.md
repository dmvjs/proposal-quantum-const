# proposal-quantum-const

**Stage 0**

Introduces `QuantumDeclaration` — a `const` form that creates a pair of thenable bindings whose values are complementary, cryptographically random, and deferred until first observation.

```js
const[a, b];
const spin = await a; // 0 or 1, determined at this point
const pair = await b; // always 1 - spin
```

## Status

| Stage | Presented |
|-------|-----------|
| 0 | No |

## Motivation

This pattern emerged from writing JavaScript interfaces for quantum circuit simulators, where coordinating complementary measurement outcomes across async boundaries is a recurring problem. It is worth noting that this proposal models the *observable behaviour* of entangled pairs in classical JavaScript — it does not implement quantum computing.

The underlying need is a pair of values that are:

- **Deferred** — neither value is determined at declaration; both travel through the program as unresolved references until explicitly observed
- **Complementary** — once either is observed, both are fixed, and they always differ
- **Structurally coupled** — the pair cannot be accidentally broken; losing one side is a static error

Today this requires manual coordination that collapses immediately at the call site:

```js
const buf = Buffer.alloc(1);
crypto.randomFillSync(buf);
const a = buf[0] & 1;
const b = 1 - a;
// a and b are already determined — they cannot be passed as unresolved references
```

## Proposed Syntax

```js
const[a, b];
```

`a` and `b` are `QuantumValue` objects — thenables that participate in the Promise resolution protocol. Neither has a determined value until first awaited. The first `await` of either triggers collapse: one resolves to `0`, the other to `1`, via a cryptographically secure random source. Subsequent awaits of either return the same value.

## Examples

### Complementary deferred resolution

```js
const[a, b];

const va = await a; // collapses here — b is instantly fixed
const vb = await b; // returns the complement of va

console.log(va + vb); // always 1
```

### Independent observers, no coordination

Two async functions each receive one side of the pair. Neither communicates with the other. Complementarity is guaranteed by the shared entanglement record, not by protocol.

```js
const[left, right];

const observe = async q => await q;

const [l, r] = await Promise.all([observe(left), observe(right)]);

console.log(l + r); // always 1
```

### Deferred until point of use

The pair is created at program start and passed through several layers before either side is observed. Collapse happens at the point of use, not at the point of creation.

```js
const[primary, replica];

async function worker(role) {
  return (await role) === 1;
}

const [isPrimary, isReplica] = await Promise.all([worker(primary), worker(replica)]);

console.log(isPrimary !== isReplica); // always true — exactly one is true
```

## Why Syntax?

The equivalent userland expression is `const [a, b] = entangle()`. The syntax form provides one guarantee the function form cannot: **the pair cannot be silently broken at the declaration site**.

```js
const [a] = entangle();         // b is discarded — no error, entanglement lost
store.set("key", entangle()[0]); // one side stored, other side unreachable
```

Neither mistake is catchable at parse time with the function form. The syntax form requires both bindings to be named and present:

```js
const[a];       // SyntaxError
const[a, b];    // valid — both sides declared, both const
```

This is the same argument for destructuring syntax over array indexing: the structure of the declaration enforces the structure of the data.

## Polyfill

Available in this repository:

```js
const { entangle } = require("./polyfill");
const [a, b] = entangle();
const va = await a; // 0 or 1
const vb = await b; // always 1 - va
```

## Specification

Strawperson spec text is in the [ecma262 fork](https://github.com/dmvjs/ecma262/tree/proposal-quantum-const). Key additions:

- `QuantumEntanglementRecord` — shared record with `[[Observed]]` and `[[ResolvedValue]]`
- `QuantumValue` objects — thenables with `[[QuantumPolarity]]` (`~primary~` or `~complement~`)
- `QuantumDeclaration` — one new production added to `Declaration`
- One early error (duplicate binding names), one evaluation algorithm
