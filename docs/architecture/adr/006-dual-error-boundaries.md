# ADR 006: Error Boundary with Dual Variants

**Status**: Accepted

**Date**: 2026-03-05

**Deciders**: Development Team

---

## Context

The Sealed Secrets plugin registers components at two distinct integration points in Headlamp:

1. **Route-level**: Full-page views (`SealedSecretList`, `SealingKeysView`) registered via `registerRoute`
2. **Section-level**: Injected detail sections (`SecretDetailsSection`) registered via `registerDetailsViewSection`

Each integration point has different error recovery requirements:

- **Route-level errors** typically stem from API connectivity issues (controller not found, RBAC misconfiguration). Users need troubleshooting guidance and a retry mechanism.
- **Section-level errors** are isolated failures within a host page. The error should be contained without disrupting the rest of the detail view. A simple reload is sufficient.

A single error boundary class cannot serve both needs because the error messaging, recovery actions, and visual treatment differ significantly.

---

## Decision

Implement a `BaseErrorBoundary` abstract class with a `renderError()` template method, then derive two concrete variants:

- **`ApiErrorBoundary`**: Used at route level. Displays connectivity troubleshooting guidance (check controller namespace, RBAC permissions, pod status) with a Retry button that resets the error state.
- **`GenericErrorBoundary`**: Used at section level. Displays a compact error message with a Reload button. Designed to fail gracefully without affecting the parent detail page.

Both variants use `getDerivedStateFromError` for error capture and expose a reset mechanism via `setState({ hasError: false })`.

```typescript
abstract class BaseErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  abstract renderError(error: Error): React.ReactNode;

  render() {
    if (this.state.hasError) {
      return this.renderError(this.state.error);
    }
    return this.props.children;
  }
}
```

---

## Consequences

### Positive

✅ **Appropriate error recovery**: Each integration point gets tailored error messages and recovery actions

✅ **Fault isolation**: Section-level errors don't crash the entire detail page

✅ **Shared base class**: Common error capture logic is defined once in `BaseErrorBoundary`

✅ **Consistent with React patterns**: Error boundaries are the recommended React mechanism for catching render errors

### Negative

⚠️ **Class components required**: React error boundaries must be class components, breaking the otherwise all-functional-component convention

⚠️ **Two components to maintain**: Changes to error handling patterns must be applied to both variants

### Mitigation

- The class component exception is documented and limited to `ErrorBoundary.tsx`
- Both variants share `BaseErrorBoundary`, so common logic changes propagate automatically

---

## Alternatives Considered

### 1. Single generic error boundary

**Pros**:
- Simpler — one component for all uses
- Less code to maintain

**Cons**:
- Cannot provide context-specific troubleshooting guidance
- Route-level errors need different recovery UX than section-level errors
- Generic messages are unhelpful for API connectivity issues

**Rejected**: The error recovery requirements differ too much between route and section contexts.

---

### 2. try/catch in each component

**Pros**:
- No class components needed
- Per-component error handling

**Cons**:
- Cannot catch render-phase errors (React limitation)
- Duplicated error handling logic across every component
- Inconsistent error UX

**Rejected**: React error boundaries are the only mechanism for catching render errors.

---

### 3. React error boundary library (react-error-boundary)

**Pros**:
- Functional component API via `ErrorBoundary` wrapper
- Built-in reset mechanisms
- Well-maintained

**Cons**:
- External dependency not available in plugin runtime
- Plugin cannot add npm dependencies beyond Headlamp peer dependencies

**Rejected**: Dependency constraint makes this infeasible.

---

## Implementation

- `ApiErrorBoundary` wraps `SealedSecretList` and `SealingKeysView` in `index.tsx`
- `GenericErrorBoundary` wraps `SecretDetailsSection` in `index.tsx`
- Both are defined in `src/components/ErrorBoundary.tsx`
- Uses MUI `Alert`, `Box`, `Button`, `Typography` for styled error display

---

## References

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Headlamp Plugin Registration API](https://headlamp.dev/docs/latest/development/plugins/)

---

## Related ADRs

- [ADR 005: Custom React Hooks](005-react-hooks-extraction.md) — Hooks architecture that error boundaries wrap

---

## Changelog

- **2026-03-05**: Initial decision
