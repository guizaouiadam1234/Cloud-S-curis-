# VM Deployment (Docker Compose)

This repo deploys by:
1) GitHub Actions builds/tests, builds Docker images, pushes to GHCR
2) GitHub Actions SSHes into your VM and runs a deploy script
3) The VM pulls images and runs them with `docker compose`

## 1) VM prerequisites (Ubuntu/Debian)

### Install Docker + Compose plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Create an SSH user for deploy

```bash
sudo adduser deployer
sudo usermod -aG docker deployer
```

Log out/in so group changes apply.

### Create the app directory

```bash
sudo mkdir -p /opt/cloud-securise
sudo chown deployer:deployer /opt/cloud-securise
```

### Ensure `curl` exists (required by health check)

```bash
sudo apt-get install -y curl
```

## 2) GHCR access from the VM

The VM pulls private images from GHCR.

- Create a GitHub Personal Access Token (classic) for a dedicated account (recommended)
- Scopes:
  - `read:packages`
  - plus `repo` if the packages are private and require repo access

This PAT is stored as GitHub Actions secret `GHCR_TOKEN`.

## 3) GitHub Actions secrets to configure

In your GitHub repo settings → **Settings → Secrets and variables → Actions**:

- `VM_HOST`: VM public IP / hostname
- `VM_USER`: SSH user (e.g. `deployer`)
- `SSH_PRIVATE_KEY`: **private key** content for that user (PEM/OpenSSH format)
- `GHCR_USER`: GitHub username that owns the PAT used by the VM
- `GHCR_TOKEN`: PAT with `read:packages`
- `SONAR_TOKEN` (optional): required only if you want SonarCloud analysis to run

## 4) What gets deployed

- Compose file used on the VM: `docker-compose.prod.yml`
- Deploy script used on the VM: `deploy.sh`

GitHub Actions uploads both into `/opt/cloud-securise` and runs:

```bash
/opt/cloud-securise/deploy.sh
```

The script:
- Writes `.env` containing `BACKEND_IMAGE_TAG` and `FRONTEND_IMAGE_TAG`
- Pulls the images from GHCR
- Runs `docker compose up -d`
- Checks `http://localhost:8080/actuator/health`
- Rolls back to the previous `.env` if the health check fails

## 5) Triggering a deployment

A deployment happens automatically on `push` to `main` or `master`.

If you want a manual trigger as well (workflow_dispatch), tell me and I’ll add it.
