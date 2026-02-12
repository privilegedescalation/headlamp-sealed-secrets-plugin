# Release v0.2.7 Status

**Release Date:** 2026-02-12
**Status:** ✅ COMPLETE

## Critical Bug Fix Release

This release fixes a critical bug where the plugin failed to load in the browser due to using internal Headlamp API paths.

### Issue
The plugin was importing from internal paths like `@kinvolk/headlamp-plugin/lib/lib/k8s/cluster` instead of using the official public API. This caused the following error in the browser:

```
TypeError: undefined is not an object (evaluating 'Ot.KubeObject')
```

The plugin would appear in backend logs as loaded, but the sidebar would not appear in the UI.

### Root Cause
- Used internal import paths: `@kinvolk/headlamp-plugin/lib/lib/k8s/*`
- These paths are not in the Vite build system's externals list
- Headlamp doesn't provide these internal modules to plugins
- Result: `undefined` when plugin tries to access `KubeObject`, `apiFactoryWithNamespace`, etc.

### Solution
Updated all imports to use the official public API:

**Before (v0.2.5, v0.2.6):**
```typescript
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { apiFactoryWithNamespace } from '@kinvolk/headlamp-plugin/lib/lib/k8s/apiProxy';
```

**After (v0.2.7):**
```typescript
import { K8s, ApiProxy } from '@kinvolk/headlamp-plugin/lib';

const { KubeObject } = K8s.cluster;
const { apiFactoryWithNamespace } = ApiProxy;
```

### Files Modified
1. `src/types.ts` - Use `K8s.cluster.KubeObjectInterface`
2. `src/lib/SealedSecretCRD.ts` - Use official K8s and ApiProxy imports
3. `package.json` - Moved node-forge to dependencies (from devDependencies)
4. `vite.config.js` - NEW - Custom globals config (not actually needed after import fix)

### Commits
- `f2a8ec4` - fix: use official Headlamp API instead of internal paths
- `5675517` - chore: bump version to 0.2.7
- `73cb990` - fix: sort imports for linter
- `7828f02` - chore: release v0.2.7 (automated by CI)

### Release Details
- **Version:** v0.2.7
- **Tag:** v0.2.7
- **GitHub Release:** https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/tag/v0.2.7
- **Tarball:** headlamp-sealed-secrets-0.2.7.tar.gz
- **Checksum:** `sha256:b2ca7d70e22839178fe46f3618abe6fc6b9dc9b51b9c52a6faa4759d4f756152`
- **Archive URL:** https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/releases/download/v0.2.7/headlamp-sealed-secrets-0.2.7.tar.gz

### Build Metrics
- Bundle: 357.92 kB (98.00 kB gzipped) - slightly smaller than v0.2.5/v0.2.6
- Build time: ~1s (optimized)
- TypeScript: ✅ No errors
- Linter: ✅ No warnings

### Verification

#### Local Testing
- ✅ Plugin builds successfully
- ✅ Plugin packages into tarball
- ✅ Tarball structure validated
- ✅ Checksum computed and verified

#### Kubernetes Deployment
- ✅ Plugin installed in Headlamp pod
- ✅ Plugin loaded by Headlamp backend
- ✅ Plugin appears in browser (sidebar visible)
- ✅ No JavaScript errors in browser console
- ✅ All functionality working

#### CI/CD
- ✅ Release workflow completed successfully
- ✅ GitHub release created with tarball
- ✅ Metadata updated in `artifacthub-pkg.yml`
- ✅ Tag v0.2.7 pushed to origin

### Artifact Hub Sync
- **Status:** Pending (5-10 minutes expected)
- **Package Name:** `sealed-secrets` (not `headlamp-sealed-secrets`)
- **URL:** https://artifacthub.io/packages/headlamp/privilegedescalation/sealed-secrets
- **Monitoring:** Background task checking every 60 seconds

### Key Learnings

1. **Always use official Headlamp plugin API**
   - Import from `@kinvolk/headlamp-plugin/lib`
   - Never use internal paths like `/lib/lib/k8s/*`

2. **Build system behavior**
   - Headlamp build system has hardcoded externals list in Vite config
   - `.pluginrc` file is NOT actually read by the build system
   - Custom `vite.config.js` can override externals but not needed with proper imports

3. **Dependency placement matters**
   - Third-party dependencies (like node-forge) must be in `dependencies`
   - Headlamp build system externalizes devDependencies by default

4. **Testing approach**
   - Backend logs showing plugin loaded ≠ plugin working in browser
   - Always check browser console for JavaScript errors
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) required after plugin updates

## Next Steps

1. ✅ Release v0.2.7 - COMPLETE
2. ⏳ Monitor Artifact Hub sync (5-10 minutes)
3. 📋 Update memory/MEMORY.md with learnings - COMPLETE
4. 📋 Create RELEASE_0.2.7_STATUS.md - COMPLETE
5. ⏳ Test plugin installation from Artifact Hub when synced
6. 📋 Verify plugin works in fresh Headlamp instance

## Conclusion

✅ **v0.2.7 Successfully Released**

The critical bug preventing the plugin from loading in the browser has been fixed by using the official Headlamp plugin API instead of internal paths. The plugin now loads correctly and all functionality is working as expected.

Users on v0.2.5 or v0.2.6 should upgrade to v0.2.7 immediately.
