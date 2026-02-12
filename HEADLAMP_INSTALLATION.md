# Headlamp Plugin Manager Installation Guide

This guide covers installing the Sealed Secrets plugin into Headlamp.

## Prerequisites

1. **Headlamp Desktop App** (v0.13.0 or later) installed
2. **Sealed Secrets Controller** installed in your Kubernetes cluster:
   ```bash
   kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
   ```

## Installation Methods

### Method 1: Local Installation (Development/Testing)

This method is ideal for local testing or development.

1. **Build the plugin**:
   ```bash
   cd headlamp-sealed-secrets
   npm install
   npm run build
   ```

2. **Copy to Headlamp plugins directory**:

   **macOS**:
   ```bash
   mkdir -p ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets
   cp -r dist/* ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets/
   cp package.json ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets/
   ```

   **Linux**:
   ```bash
   mkdir -p ~/.config/Headlamp/plugins/headlamp-sealed-secrets
   cp -r dist/* ~/.config/Headlamp/plugins/headlamp-sealed-secrets/
   cp package.json ~/.config/Headlamp/plugins/headlamp-sealed-secrets/
   ```

   **Windows**:
   ```powershell
   mkdir $env:APPDATA\Headlamp\plugins\headlamp-sealed-secrets
   Copy-Item -Recurse dist\* $env:APPDATA\Headlamp\plugins\headlamp-sealed-secrets\
   Copy-Item package.json $env:APPDATA\Headlamp\plugins\headlamp-sealed-secrets\
   ```

3. **Restart Headlamp** - The plugin will be loaded automatically.

### Method 2: Install from NPM (Recommended for Users)

Once the plugin is published to NPM:

```bash
npm install -g headlamp-sealed-secrets
```

Then follow the same directory copy steps as Method 1.

### Method 3: Headlamp Server with Plugin Support

If you're running Headlamp in server mode with plugin support:

1. **Set plugin directory** when starting Headlamp:
   ```bash
   headlamp-server -plugins-dir=/path/to/plugins
   ```

2. **Copy plugin to the plugins directory**:
   ```bash
   cp -r dist /path/to/plugins/headlamp-sealed-secrets
   ```

### Method 4: Kubernetes Deployment with Plugins

For Kubernetes deployments of Headlamp:

1. **Create a ConfigMap** with the plugin:
   ```bash
   kubectl create configmap headlamp-sealed-secrets-plugin \
     --from-file=main.js=dist/main.js \
     --from-file=package.json=package.json \
     -n headlamp
   ```

2. **Mount the ConfigMap** in your Headlamp deployment:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: headlamp
     namespace: headlamp
   spec:
     template:
       spec:
         containers:
         - name: headlamp
           image: ghcr.io/headlamp-k8s/headlamp:latest
           volumeMounts:
           - name: plugins
             mountPath: /headlamp/plugins/headlamp-sealed-secrets
         volumes:
         - name: plugins
           configMap:
             name: headlamp-sealed-secrets-plugin
   ```

## Verifying Installation

1. **Open Headlamp** and connect to your Kubernetes cluster
2. **Check the sidebar** - You should see a new "Sealed Secrets" menu item
3. **Navigate to Sealed Secrets** to verify the plugin loaded correctly

### Expected Features

After successful installation, you'll have access to:

- **SealedSecrets List** - View all sealed secrets across namespaces
- **Create Sealed Secret** - Encrypt and create new sealed secrets
- **Sealing Keys** - View and download public sealing certificates
- **Controller Health** - Monitor sealed-secrets controller status
- **Settings** - Configure plugin behavior

## Troubleshooting

### Plugin Not Showing Up

1. **Check plugin directory location**:
   - macOS: `~/Library/Application Support/Headlamp/plugins/`
   - Linux: `~/.config/Headlamp/plugins/`
   - Windows: `%APPDATA%\Headlamp\plugins\`

2. **Verify file structure**:
   ```
   headlamp-sealed-secrets/
   ├── main.js       # Built plugin code (required)
   └── package.json  # Plugin metadata (required)
   ```

3. **Check Headlamp version**:
   ```bash
   headlamp --version  # Should be v0.13.0 or later
   ```

4. **Check console for errors**:
   - Open Headlamp Developer Tools: View → Toggle Developer Tools
   - Look for plugin loading errors in the Console tab

### Controller Not Found

If you see "Sealed Secrets controller not found":

1. **Verify controller is running**:
   ```bash
   kubectl get pods -n kube-system -l name=sealed-secrets-controller
   ```

2. **Check controller service**:
   ```bash
   kubectl get svc -n kube-system sealed-secrets-controller
   ```

3. **Install the controller** if missing:
   ```bash
   kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
   ```

### Permission Errors

If you see permission-related errors:

1. **Check RBAC permissions** - Ensure your user has permissions to:
   - List/Get/Create `SealedSecret` resources
   - Get `Service` resources (to fetch certificates)
   - List `Namespace` resources

2. **Verify CRD installation**:
   ```bash
   kubectl get crd sealedsecrets.bitnami.com
   ```

## Uninstallation

To remove the plugin:

**macOS**:
```bash
rm -rf ~/Library/Application\ Support/Headlamp/plugins/headlamp-sealed-secrets
```

**Linux**:
```bash
rm -rf ~/.config/Headlamp/plugins/headlamp-sealed-secrets
```

**Windows**:
```powershell
Remove-Item -Recurse $env:APPDATA\Headlamp\plugins\headlamp-sealed-secrets
```

Then restart Headlamp.

## Development Mode

For plugin development with hot reload:

```bash
cd headlamp-sealed-secrets
npm install
npm start
```

This starts the development server with hot reload. Any changes to the source code will automatically rebuild and reload the plugin in Headlamp.

## Plugin Updates

To update the plugin:

1. **Pull latest changes**:
   ```bash
   git pull origin main
   cd headlamp-sealed-secrets
   ```

2. **Rebuild and reinstall**:
   ```bash
   npm install
   npm run build
   # Then copy to plugins directory (see Method 1 above)
   ```

3. **Restart Headlamp** to load the updated plugin.

## Support

- **Issues**: https://github.com/privilegedescalation/headlamp-sealed-secrets-plugin/issues
- **Documentation**: See [README.md](headlamp-sealed-secrets/README.md)
- **Headlamp Docs**: https://headlamp.dev/docs/latest/
- **Sealed Secrets**: https://github.com/bitnami-labs/sealed-secrets
