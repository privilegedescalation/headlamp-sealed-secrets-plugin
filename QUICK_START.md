# Quick Start Guide - Publishing to Artifact Hub & NPM

## 🚀 Fast Track (5 Steps)

### 1. Create GitHub Repository

```bash
# On GitHub, create: cpfarhood/headlamp-sealed-secrets-plugin
# Then run:

git remote add origin https://github.com/cpfarhood/headlamp-sealed-secrets-plugin.git
git push -u origin main
```

### 2. Configure NPM Token for GitHub Actions

1. Go to https://www.npmjs.com/settings/cpfarhood/tokens
2. Create new **Automation** token
3. Copy the token
4. Go to https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/settings/secrets/actions
5. Create secret: `NPM_TOKEN` = your token

### 3. Tag and Release

```bash
# Create version tag
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin v0.1.0
```

### 4. Verify Automated Publishing

The GitHub Action will automatically:
- ✅ Build the plugin
- ✅ Run tests
- ✅ Publish to NPM
- ✅ Create GitHub Release

Check progress at: https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/actions

### 5. Verify Artifact Hub Sync

**Artifact Hub is already configured!**
- Repository ID: `5574d37c-c4ae-45ab-a378-ef24aaba5b4c`
- Points to: `main` branch
- Auto-syncs every few hours

To verify after ~30 minutes:
1. Go to https://artifacthub.io/control-panel/repositories
2. Find your repository
3. Check last sync status

## 📦 What's Included

All files are ready:
- ✅ `package.json` - NPM metadata
- ✅ `artifacthub-pkg.yml` - Artifact Hub metadata
- ✅ `artifacthub-repo.yml` - Repository config
- ✅ `.github/workflows/publish.yml` - Auto-publish on tag
- ✅ `.github/workflows/ci.yml` - CI on push/PR
- ✅ `LICENSE` - Apache 2.0
- ✅ `README.md` - Full documentation
- ✅ Built plugin in `dist/` (339KB)

## 🔍 Verify After Publishing

### NPM (within minutes)
```bash
npm view headlamp-sealed-secrets
# or visit: https://www.npmjs.com/package/headlamp-sealed-secrets
```

### GitHub Release (within minutes)
https://github.com/cpfarhood/headlamp-sealed-secrets-plugin/releases

### Artifact Hub (within hours)
https://artifacthub.io/packages/headlamp/headlamp-sealed-secrets

## 🛠 Manual Publish (Alternative)

If you prefer to publish manually:

```bash
cd headlamp-sealed-secrets

# Login to NPM (first time only)
npm login

# Publish
npm publish --access public
```

## 📋 Pre-Publish Checklist

Before running step 1:
- [x] Code is complete and tested
- [x] `npm run build` succeeds
- [x] `npm run tsc` passes
- [x] `npm run lint` passes
- [x] README.md is complete
- [x] LICENSE file exists
- [x] Artifact Hub metadata is correct
- [x] GitHub Actions workflows configured

## 🎯 Success Criteria

Your plugin is successfully published when:
1. ✅ NPM package is live: `npm install -g headlamp-sealed-secrets`
2. ✅ GitHub Release exists with artifacts
3. ✅ Artifact Hub shows the package (may take 24h for initial sync)
4. ✅ Installation instructions work

## 🔄 Future Updates

For version 0.1.1, 0.2.0, etc.:

```bash
# Update version
cd headlamp-sealed-secrets
npm version patch  # or minor/major

# Update artifacthub-pkg.yml to match
# Edit version: 0.1.1

# Commit, tag, push
cd ..
git add .
git commit -m "Release v0.1.1"
git tag -a v0.1.1 -m "Release version 0.1.1"
git push origin main
git push origin v0.1.1
```

## 📚 Full Documentation

For detailed instructions, see:
- **PUBLISHING.md** - Complete publishing guide
- **README.md** - User documentation
- **IMPLEMENTATION_SUMMARY.md** - Technical details

## ⚡ TL;DR - One Command

After setting up GitHub repo and NPM token:

```bash
git remote add origin https://github.com/cpfarhood/headlamp-sealed-secrets-plugin.git
git push -u origin main
git tag -a v0.1.0 -m "Release version 0.1.0" && git push origin v0.1.0
```

Then wait for GitHub Actions to complete! 🎉

---

**Current Status:**
- ✅ Code committed to `main` branch
- 🔲 Pushed to GitHub
- 🔲 NPM token configured
- 🔲 Version tagged
- 🔲 Published to NPM
- 🔲 Listed on Artifact Hub
