# CI/CD Integration Tutorial

Learn how to automate sealed secret creation in your CI/CD pipelines.

## Overview

This tutorial shows you how to:
- Create sealed secrets in CI/CD pipelines
- Download sealing certificates for offline encryption
- Use `kubeseal` CLI with plugin-exported certificates
- Integrate with GitHub Actions, GitLab CI, and Jenkins

## Prerequisites

- Headlamp Sealed Secrets plugin installed
- Sealed Secrets controller running in your cluster
- Access to download sealing certificates
- CI/CD system (GitHub Actions, GitLab CI, or Jenkins)

## Step 1: Download the Sealing Certificate

The sealing certificate is the public key used to encrypt secrets. You can download it from Headlamp:

### Using Headlamp UI

1. Navigate to **Sealed Secrets → Sealing Keys**
2. Find the active certificate (no expiry warning)
3. Click **Download**
4. Save as `sealed-secrets-cert.pem`

### Using kubectl

Alternatively, fetch it directly from the controller:

```bash
kubectl get secret -n kube-system \
  -l sealedsecrets.bitnami.com/sealed-secrets-key=active \
  -o jsonpath='{.items[0].data.tls\.crt}' | base64 -d > sealed-secrets-cert.pem
```

Or use the controller's certificate endpoint:

```bash
curl http://sealed-secrets-controller.kube-system:8080/v1/cert.pem > sealed-secrets-cert.pem
```

## Step 2: Install kubeseal CLI

Install the `kubeseal` command-line tool:

**macOS (Homebrew):**
```bash
brew install kubeseal
```

**Linux:**
```bash
KUBESEAL_VERSION='0.24.0'
wget "https://github.com/bitnami-labs/sealed-secrets/releases/download/v${KUBESEAL_VERSION}/kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz"
tar -xvzf kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz kubeseal
sudo install -m 755 kubeseal /usr/local/bin/kubeseal
```

**Windows (Chocolatey):**
```powershell
choco install kubeseal
```

**Verify installation:**
```bash
kubeseal --version
# Output: kubeseal version: v0.24.0
```

## Step 3: Create Sealed Secrets in CI/CD

### GitHub Actions Example

Create `.github/workflows/sealed-secrets.yml`:

```yaml
name: Create Sealed Secrets

on:
  push:
    paths:
      - 'secrets/**'
  workflow_dispatch:

jobs:
  seal-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install kubeseal
        run: |
          KUBESEAL_VERSION='0.24.0'
          wget "https://github.com/bitnami-labs/sealed-secrets/releases/download/v${KUBESEAL_VERSION}/kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz"
          tar -xvzf kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz kubeseal
          sudo install -m 755 kubeseal /usr/local/bin/kubeseal

      - name: Download sealing certificate
        run: |
          # Option 1: From repository secret
          echo "${{ secrets.SEALED_SECRETS_CERT }}" > sealed-secrets-cert.pem

          # Option 2: From cluster (requires kubectl access)
          # kubectl get secret -n kube-system \
          #   -l sealedsecrets.bitnami.com/sealed-secrets-key=active \
          #   -o jsonpath='{.items[0].data.tls\.crt}' | base64 -d > sealed-secrets-cert.pem

      - name: Create sealed secret
        run: |
          # Create a plain Kubernetes secret
          kubectl create secret generic my-app-secret \
            --from-literal=database-password=${{ secrets.DB_PASSWORD }} \
            --from-literal=api-key=${{ secrets.API_KEY }} \
            --dry-run=client \
            -o yaml > secret.yaml

          # Seal the secret
          kubeseal --cert sealed-secrets-cert.pem \
            --format=yaml < secret.yaml > sealed-secret.yaml

          # Commit and push (optional)
          git add sealed-secret.yaml
          git commit -m "chore: update sealed secret"
          git push

      - name: Apply to cluster
        run: |
          kubectl apply -f sealed-secret.yaml
```

**Store the certificate as a GitHub Secret:**
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `SEALED_SECRETS_CERT`
4. Value: Paste contents of `sealed-secrets-cert.pem`

### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
stages:
  - seal
  - deploy

variables:
  KUBESEAL_VERSION: "0.24.0"

seal-secrets:
  stage: seal
  image: alpine:latest
  before_script:
    - apk add --no-cache curl tar
    - curl -LO "https://github.com/bitnami-labs/sealed-secrets/releases/download/v${KUBESEAL_VERSION}/kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz"
    - tar -xvzf kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz kubeseal
    - mv kubeseal /usr/local/bin/
    - chmod +x /usr/local/bin/kubeseal
  script:
    # Get certificate from GitLab CI variable
    - echo "$SEALED_SECRETS_CERT" > sealed-secrets-cert.pem

    # Create and seal secret
    - |
      cat <<EOF > secret.yaml
      apiVersion: v1
      kind: Secret
      metadata:
        name: my-app-secret
        namespace: production
      stringData:
        database-password: "${DB_PASSWORD}"
        api-key: "${API_KEY}"
      EOF

    - kubeseal --cert sealed-secrets-cert.pem --format=yaml < secret.yaml > sealed-secret.yaml
  artifacts:
    paths:
      - sealed-secret.yaml
  only:
    - main

deploy-sealed-secret:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl apply -f sealed-secret.yaml
  dependencies:
    - seal-secrets
  only:
    - main
```

**Set GitLab CI Variables:**
1. Go to Settings → CI/CD → Variables
2. Add `SEALED_SECRETS_CERT` (type: File)
3. Add `DB_PASSWORD` and `API_KEY` (type: Masked)

### Jenkins Pipeline Example

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any

    environment {
        KUBESEAL_VERSION = '0.24.0'
        NAMESPACE = 'production'
    }

    stages {
        stage('Install kubeseal') {
            steps {
                sh '''
                    if ! command -v kubeseal &> /dev/null; then
                        wget "https://github.com/bitnami-labs/sealed-secrets/releases/download/v${KUBESEAL_VERSION}/kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz"
                        tar -xvzf kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz kubeseal
                        sudo install -m 755 kubeseal /usr/local/bin/kubeseal
                    fi
                '''
            }
        }

        stage('Download Certificate') {
            steps {
                withCredentials([file(credentialsId: 'sealed-secrets-cert', variable: 'CERT_FILE')]) {
                    sh 'cp $CERT_FILE sealed-secrets-cert.pem'
                }
            }
        }

        stage('Create Sealed Secret') {
            steps {
                withCredentials([
                    string(credentialsId: 'db-password', variable: 'DB_PASSWORD'),
                    string(credentialsId: 'api-key', variable: 'API_KEY')
                ]) {
                    sh '''
                        # Create secret manifest
                        kubectl create secret generic my-app-secret \
                            --namespace=${NAMESPACE} \
                            --from-literal=database-password=${DB_PASSWORD} \
                            --from-literal=api-key=${API_KEY} \
                            --dry-run=client \
                            -o yaml > secret.yaml

                        # Seal it
                        kubeseal --cert sealed-secrets-cert.pem \
                            --format=yaml < secret.yaml > sealed-secret.yaml

                        # Show sealed secret (safe to log)
                        cat sealed-secret.yaml
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh 'kubectl apply -f sealed-secret.yaml'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
```

## Step 4: Verify Sealed Secret

After creating the sealed secret, verify it was created and unsealed:

```bash
# Check sealed secret exists
kubectl get sealedsecret my-app-secret -n production

# Check the unsealed secret was created
kubectl get secret my-app-secret -n production

# Verify secret contains correct keys
kubectl get secret my-app-secret -n production -o jsonpath='{.data}' | jq 'keys'
# Output: ["api-key", "database-password"]
```

## Advanced Patterns

### Pattern 1: Different Secrets per Environment

Create environment-specific sealed secrets:

```bash
# Development
kubectl create secret generic my-app-secret \
  --namespace=dev \
  --from-literal=api-url=https://dev-api.example.com \
  --dry-run=client -o yaml | \
kubeseal --cert sealed-secrets-cert.pem --format=yaml > dev-sealed-secret.yaml

# Production
kubectl create secret generic my-app-secret \
  --namespace=production \
  --from-literal=api-url=https://api.example.com \
  --dry-run=client -o yaml | \
kubeseal --cert sealed-secrets-cert.pem --format=yaml > prod-sealed-secret.yaml
```

### Pattern 2: Bulk Secret Creation

Create multiple secrets from a directory:

```bash
#!/bin/bash
# seal-all-secrets.sh

CERT="sealed-secrets-cert.pem"
SECRETS_DIR="plain-secrets"
OUTPUT_DIR="sealed-secrets"

mkdir -p "$OUTPUT_DIR"

for secret_file in "$SECRETS_DIR"/*.yaml; do
    filename=$(basename "$secret_file")
    kubeseal --cert "$CERT" --format=yaml < "$secret_file" > "$OUTPUT_DIR/$filename"
    echo "Sealed: $filename"
done
```

### Pattern 3: Update Existing Sealed Secret

To update a sealed secret, re-seal it completely:

```bash
# Get current secret
kubectl get sealedsecret my-app-secret -o yaml > current-sealed.yaml

# Extract metadata
# ... modify as needed ...

# Create new version
kubectl create secret generic my-app-secret \
  --from-literal=database-password=NEW_PASSWORD \
  --from-literal=api-key=NEW_KEY \
  --dry-run=client -o yaml | \
kubeseal --cert sealed-secrets-cert.pem --format=yaml > updated-sealed-secret.yaml

# Apply
kubectl apply -f updated-sealed-secret.yaml
```

## Best Practices

### 1. Certificate Management

✅ **DO:**
- Store certificate in CI/CD secrets (encrypted at rest)
- Download fresh certificate periodically (before expiry)
- Use certificate from same cluster where secrets will be deployed

❌ **DON'T:**
- Commit certificate to Git (it's public, but still clutters repo)
- Use expired certificates
- Mix certificates from different clusters

### 2. Secret Rotation

```bash
# Check certificate expiry in Headlamp
# Sealed Secrets → Sealing Keys → Check "Valid Until"

# Download new certificate before expiry
# Re-seal all secrets with new certificate
# Deploy new sealed secrets
```

### 3. Scope Selection

- **Use strict scope** for production secrets:
  ```bash
  kubeseal --cert cert.pem --scope strict < secret.yaml
  ```

- **Use namespace-wide** for shared secrets:
  ```bash
  kubeseal --cert cert.pem --scope namespace-wide < secret.yaml
  ```

- **Use cluster-wide** only for truly global secrets:
  ```bash
  kubeseal --cert cert.pem --scope cluster-wide < secret.yaml
  ```

### 4. GitOps Integration

Store sealed secrets in Git alongside manifests:

```
my-app/
├── deployment.yaml
├── service.yaml
└── sealed-secret.yaml  # Safe to commit!
```

Apply with:
```bash
kubectl apply -f my-app/
```

## Troubleshooting

### "no key could decrypt secret"

**Cause**: Certificate mismatch or secret was sealed for different namespace/name.

**Solution**:
```bash
# Verify you're using the correct certificate
kubeseal --cert sealed-secrets-cert.pem --validate < sealed-secret.yaml

# Re-seal with correct scope and metadata
kubectl create secret generic EXACT_NAME \
  --namespace EXACT_NAMESPACE \
  --from-literal=key=value \
  --dry-run=client -o yaml | \
kubeseal --cert sealed-secrets-cert.pem --scope strict --format=yaml > sealed-secret.yaml
```

### "certificate has expired"

**Solution**: Download fresh certificate from Headlamp:
```bash
# Check expiry
openssl x509 -in sealed-secrets-cert.pem -noout -enddate

# Download new one from Headlamp UI or kubectl
```

### CI/CD pipeline fails to seal

**Check:**
1. `kubeseal` is installed: `kubeseal --version`
2. Certificate file exists and is valid
3. Input secret YAML is well-formed
4. Namespace exists in cluster

## Next Steps

- **[Multi-Cluster Setup](multi-cluster-setup.md)** - Manage secrets across multiple clusters
- **[Secret Rotation](secret-rotation.md)** - Rotate secrets and certificates
- **[RBAC Permissions](../user-guide/rbac-permissions.md)** - Configure access control

## Resources

- [kubeseal CLI Documentation](https://github.com/bitnami-labs/sealed-secrets#usage)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitLab CI Variables](https://docs.gitlab.com/ee/ci/variables/)
- [Jenkins Credentials](https://www.jenkins.io/doc/book/using/using-credentials/)
