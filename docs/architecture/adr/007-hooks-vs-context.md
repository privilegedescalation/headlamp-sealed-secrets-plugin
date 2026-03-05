# ADR 007: Custom Hooks Architecture vs Data Context

**Status**: Accepted

**Date**: 2026-03-05

**Deciders**: Development Team

---

## Context

All other Headlamp plugins in this project family (polaris, rook, intel-gpu, kube-vip, tns-csi) use a single React Context provider (`*DataProvider`) to centralize data fetching and share state across components. This is the established pattern.

The Sealed Secrets plugin has different requirements:

1. **Multiple independent data domains**: Controller health, RBAC permissions, SealedSecret CRUD, and encryption are logically separate concerns with different lifecycles.
2. **CRD class extension**: `SealedSecret` extends Headlamp's `KubeObject` class, providing its own `useList()` hook — making a centralized fetch redundant for the primary resource.
3. **Write-heavy workflows**: Unlike read-only plugins, sealed-secrets creates, encrypts, and rotates resources. The encryption workflow involves multi-step state (certificate fetch → encrypt → create resource).
4. **Independent refresh cadences**: Controller health polls every 30 seconds; SealedSecret list is reactive via `useList()`; RBAC checks run once on mount.

A single context provider would either become a monolithic "god context" or force artificial coupling between unrelated concerns.

---

## Decision

Use **independent custom hooks** instead of a shared data context:

- **`useControllerHealth(autoRefresh?, intervalMs?)`**: Polls controller `/healthz` endpoint. Returns `{ healthy, checking, error, refresh }`.
- **`usePermissions()`**: Queries RBAC capabilities on mount. Returns permission flags for create, delete, encrypt operations.
- **`useSealedSecretEncryption()`**: Orchestrates the encryption workflow (fetch cert → encrypt values → build manifest). Returns workflow state and action functions.
- **`SealedSecret.useList()`**: Headlamp's built-in `KubeObject.useList()` — reactive to cluster changes, no custom fetch needed.

Each hook manages its own loading, error, and refresh state. Components compose multiple hooks as needed.

```typescript
function SealedSecretList() {
  const [secrets, error] = SealedSecret.useList();
  const { healthy } = useControllerHealth(true);
  const { canCreate } = usePermissions();
  // Each concern is independent
}
```

---

## Consequences

### Positive

✅ **Separation of concerns**: Each hook encapsulates a single domain (health, permissions, encryption, CRUD)

✅ **Independent lifecycles**: Controller health polls at 30s; RBAC checks once; list is reactive — no unnecessary coupling

✅ **Composable**: Components pick only the hooks they need, avoiding unnecessary data in scope

✅ **Testable in isolation**: Each hook can be unit-tested independently without mocking an entire context provider

✅ **Leverages Headlamp's KubeObject**: `SealedSecret.useList()` provides reactive list updates without custom fetch logic

### Negative

⚠️ **Diverges from project convention**: Other plugins use the `*DataProvider` pattern — contributors must learn a different approach for this plugin

⚠️ **No single source of truth**: State is distributed across hooks rather than centralized — harder to debug "what data does the plugin have right now?"

⚠️ **Potential duplicate fetches**: If two components both call `useControllerHealth()`, the health endpoint is polled twice

### Mitigation

- The convention divergence is documented in `CLAUDE.md` and this ADR
- Controller health polling is lightweight (single `/healthz` call)
- `SealedSecret.useList()` is internally deduplicated by Headlamp's hook system

---

## Alternatives Considered

### 1. Single SealedSecretsDataProvider context

**Pros**:
- Consistent with other plugins in the project
- Single source of truth for all sealed-secrets data
- Deduplicates fetches automatically

**Cons**:
- Would become a "god context" with 10+ fields spanning unrelated concerns
- All consumers re-render when any field changes (health poll triggers list re-render)
- Encryption workflow state doesn't belong in shared context (it's dialog-scoped)
- `SealedSecret.useList()` already provides reactive CRUD — wrapping it in context adds indirection

**Rejected**: The data domains are too independent; a single context would create artificial coupling.

---

### 2. Multiple specialized contexts

**Pros**:
- Separation of concerns (like hooks)
- Consistent with React Context pattern

**Cons**:
- Three or four nested providers in `index.tsx` — deep nesting
- More boilerplate than hooks (provider + context + consumer hook per domain)
- No benefit over standalone hooks when providers don't need to share state

**Rejected**: Contexts add boilerplate without benefit when data domains are independent.

---

### 3. State management library (Zustand, Jotai)

**Pros**:
- Lightweight, no provider nesting
- Built-in deduplication and memoization

**Cons**:
- External dependency not available in plugin runtime
- Plugins cannot add npm dependencies beyond Headlamp peer dependencies

**Rejected**: Dependency constraint makes this infeasible.

---

## Implementation

```
src/hooks/
├── useControllerHealth.ts       # Health polling with configurable interval
├── usePermissions.ts            # RBAC capability check (runs once)
└── useSealedSecretEncryption.ts # Multi-step encryption workflow
```

- Components in `src/components/` import hooks directly
- No provider wrapping needed in `index.tsx` (except error boundaries)
- `SealedSecret` class in `src/lib/SealedSecretCRD.ts` extends `KubeObject` for `useList()`/`useGet()`

---

## References

- [React Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Headlamp KubeObject API](https://headlamp.dev/docs/latest/development/api/classes/lib_k8s_cluster.KubeObject/)

---

## Related ADRs

- [ADR 005: Custom React Hooks](005-react-hooks-extraction.md) — Details the hook extraction process
- [ADR 006: Dual Error Boundaries](006-dual-error-boundaries.md) — Error handling that wraps hook-based components

---

## Changelog

- **2026-03-05**: Initial decision
