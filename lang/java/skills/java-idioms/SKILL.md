---
name: java-idioms
description: Java functional-style idiom checklist for cobots projects. Use when writing or reviewing Java — modern Java 21+ with records, sealed interfaces, immutability, errors as values. Every example here compiles via the bundled JBang verify script.
---

# java-idioms

Modern Java (21+ baseline), functional style. These are review-enforceable rules;
the reviewer cobot treats violations of the first block as Tier 1/2 findings.

## Rules

**Data modeling**
- ADTs are `sealed interface` + `record` cases. Never abstract-class hierarchies
  for sum types.
- Every domain concept gets a type — no primitive obsession; wrap ids and
  quantities in records.
- Records holding a `List`/`Map`/`Set`/array take a defensive copy in the compact
  constructor (`List.copyOf(...)`); arrays are cloned.
- All fields effectively final; no setters, ever. "Modification" = new instance
  (`with*` methods).

**Errors and absence**
- No `null` returns from public API: `Optional<T>` for absence, a `Result`/either
  type (or a sealed outcome type) for expected failure.
- Exceptions only for bugs and unrecoverable states, never control flow.
- Validate in constructors/factories; invalid states unrepresentable.

**Style**
- Exhaustive `switch` pattern matching over sealed types — no `default ->` arm on
  a sealed switch (it silences the compiler's exhaustiveness check).
- Streams/declarative over index loops where it stays readable.
- No reflection, no Lombok, no annotation processors in library code.
- `var` only where the right-hand side makes the type obvious.
- Javadoc with an intent paragraph on every public member.

**Tests**
- Test names: `snake_case_describing_behavior`.
- Plain fakes over mocking frameworks; JUnit Jupiter assertions suffice.

## Verified examples

`scripts/VerifyExamples.java` is a JBang single-file program containing every
pattern above as compiling code. **When adding or changing an example in this
skill, update the script and run it** — examples that don't compile don't ship:

```bash
jbang scripts/VerifyExamples.java
```

## LSP

Recommend the official `jdtls-lsp` plugin (marketplace: claude-plugins-official)
for any Java project — diagnostics after each edit catch type errors without a
build cycle. The `jdtls` binary must be installed separately.
