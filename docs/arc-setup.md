# Actions Runner Controller (ARC) setup

This guide aligns with GitHub’s official ARC docs and shows how to run GitHub Actions runners inside your Kubernetes cluster and deploy Acegrocer with the Helm-based CD workflow using in-cluster auth.

Assumptions:
- Single cluster
- Separate namespaces: controller (operator) vs runners vs app
  - Controller namespace: actions-runner-system (operator)
  - Runners namespace: acegrocer-runners (ephemeral runner pods)
  - App namespace: acegrocer-system (where Helm deploys the app)
- You have cluster-admin (or equivalent) to install controllers and RBAC

References:
- Quickstart: https://docs.github.com/en/actions/tutorials/use-actions-runner-controller/quickstart
- Deploy runner scale sets: https://docs.github.com/en/actions/tutorials/use-actions-runner-controller/deploy-runner-scale-sets
- Authenticate to the API: https://docs.github.com/en/actions/tutorials/use-actions-runner-controller/authenticate-to-the-api
- Use ARC in a workflow: https://docs.github.com/en/actions/tutorials/use-actions-runner-controller/use-arc-in-a-workflow
- Security Hardening of self-hosted runners: https://docs.github.com/en/actions/reference/security/secure-use#hardening-for-self-hosted-runners

## 1) Install the ARC controller (Helm)

Install the GitHub-supported ARC controller chart into the controller namespace.

```bash
# Controller namespace
kubectl create namespace arc-system --dry-run=client -o yaml | kubectl apply -f -

# Install the controller (CRDs + controller manager)
helm install arc \
  --namespace arc-system \
  --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller
```

Note: cert-manager is NOT required for the GitHub-supported ARC charts.

## 2) Create GitHub credentials (GitHub App recommended)

Per official docs, authenticate ARC to the GitHub API using a GitHub App or a PAT. GitHub App is recommended.

Steps (summary):
- Create a GitHub App owned by your github user account or org and install it to your org/repo.
  - GitHub → Settings → Developer settings → GitHub Apps → New GitHub App
  - Permissions (minimum):
    - Actions: Read & write
    - Checks: Read & write
    - Contents: Read-only
    - Metadata: Read-only
    - Pull requests: Read & write (recommended)
  - Generate a private key and note:
    - APP ID
    - INSTALLATION ID (after installing the App on your org/repo)
    - PRIVATE KEY (PEM)

- Capture APP ID, INSTALLATION ID, and generate a private key (PEM).

Create a secret in the RUNNER namespace (not the controller namespace):

```bash
# Runners namespace
kubectl create namespace arc-runners --dry-run=client -o yaml | kubectl apply -f -

# GitHub App credentials secret (create in runners namespace!)
kubectl -n arc-runners create secret generic github-app-credentials \
  --from-literal=github_app_id=<APP_ID> \
  --from-literal=github_app_installation_id=<INSTALLATION_ID> \
  --from-file=github_app_private_key=<path-to-private-key.pem>
```

Alternative: You can use a PAT or fine-grained PAT; see “Authenticate to the API” docs for scopes and secret shape.

## 3) Install a runner scale set (Helm)

ARC runner scale sets are installed via a separate chart in the runners namespace. The Helm release name (installation name) becomes the single label to target in workflows (`runs-on`). Additional labels are not supported for ARC runners.

Recommended values to support Docker image builds (our CI builds and pushes images) use Docker-in-Docker (dind) mode:

```bash
INSTALLATION_NAME="arc-runnerset"
NAMESPACE="arc-runners"
GITHUB_CONFIG_URL="https://github.com/kunlecreates/arc-deploy" # A separate private repo was used based on the security doc. See: “Security Hardening of self-hosted runners” docs linked above.

helm install "$INSTALLATION_NAME" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --set githubConfigUrl="$GITHUB_CONFIG_URL" \
  --set githubConfigSecret="github-app-credentials" \
  --set containerMode.type="dind" \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set
```

Notes:
- If you prefer specifying GitHub App values inline instead of a secret (not recommended), see the docs’ `githubConfigSecret` object.
- If you do not need to build container images, in your private ARC repo, you can omit `containerMode.type="dind"`.

## 4) RBAC: allow runners to deploy the app to the app namespace

We deploy our app into `acegrocer-system`. Create a Role there and bind it to the runners’ ServiceAccount from the runners namespace. You may optionally set `template.spec.serviceAccountName` in your scale set values to a predictable name (e.g., `arc-runner-sa`).

Example ServiceAccount (in runners namespace):

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: arc-runner-sa
  namespace: arc-runners
```

Role in the app namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployer
  namespace: acegrocer-system
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps", "secrets", "persistentvolumeclaims", "endpoints", "events"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["ingresses"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
```

RoleBinding in the app namespace, binding to the runners’ ServiceAccount across namespaces:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployer-binding
  namespace: acegrocer-system
subjects:
  - kind: ServiceAccount
    name: arc-runner-sa
    namespace: arc-runners
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: deployer
```

Apply:

```bash
kubectl create namespace acegrocer-system --dry-run=client -o yaml | kubectl apply -f -
# If you use a specific SA in your scale set, create it first in the runners namespace
kubectl apply -f k8s/arc/role-deployer.yaml
kubectl apply -f k8s/arc/rolebinding-deployer.yaml
```

Tip: If you set a custom ServiceAccount in your scale set, include in your values file:

```yaml
template:
  spec:
    serviceAccountName: arc-runner-sa
```

## 5) Private GHCR pulls for the app (not ARC itself)

Our CD workflow can create/update a `ghcr-pull-secret` in the app namespace when these repo secrets exist:
- GHCR_READ_USERNAME → your GitHub username (or bot user)
- GHCR_READ_TOKEN → a PAT with scope `read:packages`

The workflow passes `--set imagePullSecrets[0].name=ghcr-pull-secret` to Helm. Alternatively, add it in your values file:

```yaml
imagePullSecrets:
  - name: ghcr-pull-secret
```

## 6) Use ARC runners in workflows (runs-on)

When using ARC runner scale sets, you target them with a single label equal to the Helm installation name (the `INSTALLATION_NAME`), e.g., `arc-runnerset`. Additional labels (like `self-hosted`, `linux`, `k8s`) are not supported for ARC runners.

Example workflow job:

```yaml
jobs:
  deploy:
    runs-on: arc-runnerset
    steps:
      - uses: actions/checkout@v4
      - run: echo "Using ARC scale set runner"
```

See: “Use ARC in a workflow” docs linked above.

## 7) CD workflow and in-cluster auth

The CD workflow requires running on an ARC in-cluster runner. It detects in-cluster by checking `KUBERNETES_SERVICE_HOST` and builds a kubeconfig from the Pod’s service account automatically. There is no external kubeconfig fallback in this setup.

## 8) Run the deploy

- Ensure the ARC controller and runner scale set Helm releases are Deployed, and the listener is Running in the runners namespace.
- In GitHub → Actions → "CD - Kubernetes (Helm)" → Run workflow:
  - namespace: acegrocer-system (or your target)
  - values_file: k8s/staging.values.yaml (or prod)
  - image_repo/image_tag: optional (defaults to ghcr.io/kunlecreates/ace-next and commit SHA)

The workflow will lint the chart, create/update the app Secret and the registry pull secret (if configured), run `helm upgrade --install`, and smoke test the service.

## Next steps

1. Complete in-cluster runner installation (steps 1–3), confirm a runner Pod becomes Ready in the `arc-runners` namespace.
2. Apply cross-namespace RBAC (step 4) so the runner can deploy into your target app namespace (default `acegrocer-system`).
3. Add repo secrets: `JWT_SECRET` (required), and optionally `GHCR_READ_USERNAME`/`GHCR_READ_TOKEN` for private GHCR pulls.
4. Trigger the "CD - Kubernetes (Helm)" workflow targeting your staging namespace and values file. Verify Helm lint and upgrade succeed.
5. Validate ingress health by hitting `/api/health` and basic pages. Optionally check `/api/metrics`.
6. When ready, deploy to prod by setting `use_prod: true` and `prod_namespace`, and considering a protected GitHub Environment for approvals.
