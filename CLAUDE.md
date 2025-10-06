# Claude Code Guidelines by Anthony Hanson-Harrison

## Implementation Best Practices

### 0 — Purpose  

These rules ensure maintainability, safety, and developer velocity. 
**MUST** rules are enforced by CI; **SHOULD** rules are strongly recommended.

---

### 1 — Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex work.  
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons.

---

### 2 — While Coding

- **C-1 (MUST)** Follow TDD: scaffold stub -> write failing test -> implement.
- **C-2 (MUST)** Name functions with existing domain vocabulary for consistency.  
- **C-3 (SHOULD NOT)** Introduce classes when small testable functions suffice.  
- **C-4 (SHOULD)** Prefer simple, composable, testable functions.
- **C-5 (MUST)** Prefer branded `type`s for IDs
  ```ts
  type UserId = Brand<string, 'UserId'>   // ✅ Good
  type UserId = string                    // ❌ Bad
  ```  
- **C-6 (MUST)** Use `import type { … }` for type-only imports.
- **C-7 (SHOULD NOT)** Add comments except for critical caveats; rely on self‑explanatory code.
- **C-8 (SHOULD)** Default to `type`; use `interface` only when more readable or interface merging is required. 
- **C-9 (SHOULD NOT)** Extract a new function unless it will be reused elsewhere, is the only way to unit-test otherwise untestable logic, or drastically improves readability of an opaque block.

---

### 3 — Testing

- **T-1 (MUST)** For a simple function, colocate unit tests in `*.spec.ts` in same directory as source file.
- **T-2 (MUST)** For any API change, add/extend integration tests in `app/api/**/route.integration.spec.ts`.
- **T-3 (MUST)** ALWAYS separate pure-logic unit tests from DB-touching integration tests.
- **T-4 (SHOULD)** Prefer integration tests over heavy mocking.  
- **T-5 (SHOULD)** Unit-test complex algorithms thoroughly.
- **T-6 (SHOULD)** Test the entire structure in one assertion if possible
  ```ts
  expect(result).toBe([value]) // Good

  expect(result).toHaveLength(1); // Bad
  expect(result[0]).toBe(value); // Bad
  ```

---

### 4 — Database

- **D-1 (MUST)** Use Supabase client typing with `SupabaseClient` for database operations and connection pooling.  
- **D-2 (SHOULD)** Implement database connection pooling with health checks and timeout handling.
- **D-3 (SHOULD)** Use `withDbConnection()` wrapper for optimized query execution and monitoring.

---

### 5 — Code Organization

- **O-1 (MUST)** Place shared utilities in `lib/` directory for reuse across components and API routes.
- **O-2 (SHOULD)** Group related functionality: services, utilities, types, and configurations in `lib/`.
- **O-3 (SHOULD)** Colocate tests with source files using `*.spec.ts` naming convention.

---

### 6 — Tooling Gates

- **G-1 (MUST)** `prettier --check` passes.  
- **G-2 (MUST)** `npm run typecheck && npm run lint` passes.  

---

### 7 - Git

- **GH-1 (MUST**) Use Conventional Commits format when writing commit messages: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT**) Refer to Claude or Anthropic in commit messages.

### 8 — Security

- **S-1 (MUST)** Sanitize all user inputs before validation using data sanitization middleware.
- **S-2 (MUST)** Implement XSS protection with pattern detection and removal of dangerous content.
- **S-3 (MUST)** Validate email inputs against injection attacks (CRLF, header injection).
- **S-4 (MUST)** Use whitelist approach for URL protocols and validate against suspicious patterns.
- **S-5 (MUST)** Apply comprehensive security headers via middleware (CSP, HSTS, XSS protection).
- **S-6 (SHOULD)** Implement suspicious pattern detection for enhanced rate limiting.
- **S-7 (SHOULD)** Use environment-specific security policies (stricter CSP in production).
- **S-8 (MUST)** Never log or expose sensitive data (emails, IPs) in error messages or logs.

---

### 9 — Production Readiness

- **PR-1 (MUST)** Implement structured logging with correlation IDs for request tracing.
- **PR-2 (MUST)** Add performance monitoring with metrics collection (counters, histograms, gauges).
- **PR-3 (MUST)** Use database connection pooling with health checks and timeout handling.
- **PR-4 (SHOULD)** Implement email notification system with template-based messaging and priority detection.
- **PR-5 (SHOULD)** Add comprehensive error handling with graceful degradation (email/webhook failures don't fail core operations).
- **PR-6 (SHOULD)** Use rate limiting with endpoint-specific configurations and suspicious pattern detection.
- **PR-7 (MUST)** Implement health check endpoints with system status reporting (database, connection pool, memory usage).
- **PR-8 (SHOULD)** Add proper observability: request timing, database query performance, email delivery metrics.
- **PR-9 (MUST)** Use environment-specific configurations with proper secret management.

---

### 10 — UI/Animation Standards

- **UI-1 (MUST)** Use layered animation approach: Tailwind keyframes → Framer Motion → Canvas (in order of performance priority).
- **UI-2 (MUST)** Implement `prefers-reduced-motion` support for all animations to respect user accessibility preferences.
- **UI-3 (SHOULD)** Use CSS transforms (`translate`, `scale`, `rotate`) over JavaScript for performance (hardware acceleration).
- **UI-4 (MUST)** Use `requestAnimationFrame` for Canvas animations, never `setInterval` or `setTimeout`.
- **UI-5 (MUST)** Use Class Variance Authority (CVA) for component variants following exact patterns from Button component.
- **UI-6 (MUST)** Implement all standard button variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `gradient`, `glass`, `neon`.
- **UI-7 (SHOULD)** Use Radix UI primitives for accessibility (dialog, accordion, select, checkbox, etc.).
- **UI-8 (MUST)** Follow exact animation timings: 300ms for hover effects, 700ms for complex transitions.
- **UI-9 (SHOULD)** Use `will-change` property sparingly and remove after animations complete.
- **UI-10 (MUST)** Implement intersection observer patterns for scroll-triggered animations using `useInView` hook.
- **UI-11 (SHOULD)** Batch DOM reads/writes to prevent layout thrashing in complex animations.
- **UI-12 (MUST)** Use exact glow effects: `box-shadow: 0 0 20px hsl(var(--orange) / 0.3)` for standard glow.
- **UI-13 (MUST)** Implement glass morphism with `backdrop-blur-lg border border-white/20 bg-white/10`.
- **UI-14 (MUST)** Use text gradients with exact HSL values: `hsl(var(--orange))` to `hsl(var(--orange-light))`.
- **UI-15 (SHOULD)** Implement shimmer effects with transform-based animations, not opacity changes.
- **UI-16 (MUST)** Use fluid typography with `clamp()` functions for all text sizes: `clamp(min, preferred, max)`.
- **UI-17 (MUST)** Implement staggered animation delays (200ms, 400ms, 600ms) for sequential element reveals.
- **UI-18 (SHOULD)** Scale animation durations based on viewport size for responsive feel.
- **UI-19 (MUST)** Ensure touch interactions have appropriate feedback (hover states adapted for mobile).
- **UI-20 (MUST)** Handle device pixel ratio for crisp Canvas rendering: `canvas.width = clientWidth * dpr`.
- **UI-21 (MUST)** Implement resize listeners with proper cleanup for Canvas animations.
- **UI-22 (SHOULD)** Use object pooling for particle systems to prevent garbage collection issues.
- **UI-23 (MUST)** Use `mix-blend-mode` for visual compositing effects in layered animations.

**Animation Performance Standards:**
```ts
// Good: CSS transform-based animation
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

// Bad: Layout-affecting animation
const badVariants = {
  hidden: { marginTop: '20px' },
  visible: { marginTop: '0px' }
}
```

**Accessibility Requirements:**
```css
/* MUST include for all animations */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Canvas Animation Template:**
```ts
// MUST follow this pattern for Canvas animations
function setupCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function animate() {
  // Animation logic here
  requestAnimationFrame(animate);
}
```

**UI Testing Requirements:**
- **UI-T1 (MUST)** Test animation performance with Chrome DevTools Performance tab.
- **UI-T2 (SHOULD)** Test with `prefers-reduced-motion: reduce` enabled.
- **UI-T3 (MUST)** Verify animations work across viewport sizes (320px to 2560px).
- **UI-T4 (SHOULD)** Implement visual regression testing for complex animations.
- **UI-T5 (MUST)** Test Canvas animations at different device pixel ratios.

---

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not, use this checklist:

1. Can you read the function and HONESTLY easily follow what it's doing? If yes, then stop here.
2. Does the function have very high cyclomatic complexity? (number of independent paths, or, in a lot of cases, number of nesting if if-else as a proxy). If it does, then it's probably sketchy.
3. Are there any common data structures and algorithms that would make this function much easier to follow and more robust? Parsers, trees, stacks / queues, etc.
4. Are there any unused parameters in the function?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Is the function easily testable without mocking core features (e.g. sql queries, redis, etc.)? If not, can this function be tested as part of an integration test?
7. Does it have any hidden untested dependencies or any values that can be factored out into the arguments instead? Only care about non-trivial dependencies that can actually change or affect the function.
8. Brainstorm 3 better function names and see if the current name is the best, consistent with rest of codebase.

IMPORTANT: you SHOULD NOT refactor out a separate function unless there is a compelling need, such as:
  - the refactored function is used in more than one place
  - the refactored function is easily unit testable while the original function is not AND you can't test it any other way
  - the original function is extremely hard to follow and you resort to putting comments everywhere just to explain it

## Writing Tests Best Practices

When evaluating whether a test you've implemented is good or not, use this checklist:

1. SHOULD parameterize inputs; never embed unexplained literals such as 42 or "foo" directly in the test.
2. SHOULD NOT add a test unless it can fail for a real defect. Trivial asserts (e.g., expect(2).toBe(2)) are forbidden.
3. SHOULD ensure the test description states exactly what the final expect verifies. If the wording and assert don’t align, rename or rewrite.
4. SHOULD compare results to independent, pre-computed expectations or to properties of the domain, never to the function’s output re-used as the oracle.
5. SHOULD follow the same lint, type-safety, and style rules as prod code (prettier, ESLint, strict types).
6. SHOULD express invariants or axioms (e.g., commutativity, idempotence, round-trip) rather than single hard-coded cases whenever practical. Use `fast-check` library e.g.
```
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { getCharacterCount } from './string';

describe('properties', () => {
  test('concatenation functoriality', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (a, b) =>
          getCharacterCount(a + b) ===
          getCharacterCount(a) + getCharacterCount(b)
      )
    );
  });
});
```

**Security Testing Example:**
```
// Security property testing
test('sanitization is idempotent', () => {
  fc.assert(
    fc.property(
      fc.string(),
      (input) => {
        const sanitized = sanitizer.sanitizeString(input)
        const doubleSanitized = sanitizer.sanitizeString(sanitized)
        return sanitized === doubleSanitized
      }
    )
  )
})

// XSS attack vector testing
test('removes XSS patterns', () => {
  const xssInputs = [
    '<script>alert("xss")</script>',
    'javascript:alert(1)',
    '<img onerror="alert(1)" src="x">'
  ]
  
  for (const input of xssInputs) {
    const result = sanitizer.sanitizeString(input)
    expect(result).not.toContain('script')
    expect(result).not.toContain('javascript:')
    expect(result).not.toContain('onerror')
  }
})
```

7. Unit tests for a function should be grouped under `describe(functionName, () => ...`.
8. Use `expect.any(...)` when testing for parameters that can be anything (e.g. variable ids).
9. ALWAYS use strong assertions over weaker ones e.g. `expect(x).toEqual(1)` instead of `expect(x).toBeGreaterThanOrEqual(1)`.
10. SHOULD test edge cases, realistic input, unexpected input, and value boundaries.
11. SHOULD NOT test conditions that are caught by the type checker.
12. **T-7 (MUST)** Test XSS attack vectors with realistic malicious payloads.
13. **T-8 (MUST)** Test email injection attempts using CRLF and header injection patterns.
14. **T-9 (SHOULD)** Test rate limiting with suspicious pattern detection.
15. **T-10 (SHOULD)** Test sanitization functions with edge cases (unicode, very long strings).
16. **T-11 (SHOULD)** Use property-based testing for security-critical functions.
17. **T-12 (MUST)** Test error conditions don't leak sensitive information.

## Code Organization

- `app/` - Next.js 14 App Router pages and API routes
  - `app/api/` - API route handlers with integration tests
  - `app/layout.tsx` - Root layout with metadata and initialization
- `lib/` - Shared utilities, services, and configurations
  - `lib/validations.ts` - Zod schemas for form and API validation
  - `lib/sanitization.ts` - Data sanitization and XSS protection
  - `lib/email.ts` - Email notification service with templates
  - `lib/monitoring.ts` - Performance monitoring and metrics collection
  - `lib/rate-limiter.ts` - Rate limiting with suspicious pattern detection
  - `lib/db.ts` - Database connection pooling and query optimization
  - `lib/logger.ts` - Structured logging with correlation IDs
- `components/` - Reusable React components
- `public/` - Static assets and media files
- `middleware.ts` - Security headers, rate limiting, and CORS handling

## Remember Shortcuts

Remember the following shortcuts which the user may invoke at any time.

### QNEW

When I type "qnew", this means:

```
Understand all BEST PRACTICES listed in CLAUDE.md.
Your code SHOULD ALWAYS follow these best practices.
```

### QPLAN
When I type "qplan", this means:
```
Analyze similar parts of the codebase and determine whether your plan:
- is consistent with rest of codebase
- introduces minimal changes
- reuses existing code
```

## QCODE

When I type "qcode", this means:

```
Implement your plan and make sure your new tests pass.
Always run tests to make sure you didn't break anything else.
Always run `prettier` on the newly created files to ensure standard formatting.
Always run `npm run typecheck && npm run lint` to make sure type checking and linting passes.
```

### QCHECK

When I type "qcheck", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR code change you introduced (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
2. CLAUDE.md checklist Writing Tests Best Practices.
3. CLAUDE.md checklist Implementation Best Practices.
4. CLAUDE.md checklist UI/Animation Standards (if UI/animation changes were made).
```

### QCHECKF

When I type "qcheckf", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR function you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
```

### QCHECKT

When I type "qcheckt", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR test you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Tests Best Practices.
```

### QCHECKUI

When I type "qcheckui", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR UI component or animation you added or edited (skip minor changes):

1. CLAUDE.md checklist UI/Animation Standards (UI-1 through UI-23).
2. CLAUDE.md checklist UI Testing Requirements (UI-T1 through UI-T5).
```

### QUX

When I type "qux", this means:

```
Imagine you are a human UX tester of the feature you implemented. 
Output a comprehensive list of scenarios you would test, sorted by highest priority.
```

### QGIT

When I type "qgit", this means:

```
Add all changes to staging, create a commit, and push to remote.

Follow this checklist for writing your commit message:
- SHOULD use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0
- SHOULD NOT refer to Claude or Anthropic in the commit message.
- SHOULD structure commit message as follows:
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]
- commit SHOULD contain the following structural elements to communicate intent: 
fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.
types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.
footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.
```
