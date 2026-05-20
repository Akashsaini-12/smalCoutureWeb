# Auto-deploy frontend (Ecommerce-style: build on GitHub → SCP → Docker)

Pushes to `main` run [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml):

1. Build on GitHub Actions (`npm install` + `npm run build`)
2. Upload `build/*` to VM `/home/smalcouture/website/build`
3. Copy files into **`frontend-container`** and restart (port **3000** unchanged)

Same pattern as your Ecommerce deploy; only the target path and container name differ.

## One-time on the VM

Create the build folder (if it does not exist):

```bash
mkdir -p /home/smalcouture/website/build
```

Ensure **`frontend-container`** is already running on port 3000:

```bash
docker ps --filter name=frontend-container
```

You do **not** need to clone the GitHub repo on the VM for this pipeline (build happens in Actions).

## One-time: GitHub Actions secrets

Use the **same secrets** as Ecommerce (repo **Settings → Secrets → Actions**):

| Secret | Example |
|--------|---------|
| `HOST` | VM public IP |
| `USERNAME` | `smalcouture` |
| `SSH_KEY` | Deploy SSH private key |

## Day-to-day

```bash
git push origin main
```

Check **Actions** in GitHub. Site updates at `http://<VM-IP>:3000`.

## Manual deploy on VM (optional)

If you build on the VM:

```bash
cd ~/website   # or wherever you keep the repo
npm install && npm run build
./deploy.sh
```

## Verify

```bash
docker ps --filter name=frontend-container
ls -la /home/smalcouture/website/build
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| SCP fails | Check `HOST`, `USERNAME`, `SSH_KEY`; port 22 open |
| `frontend-container` not found | Start existing container first (same name, port 3000:80) |
| Deep links 404 after deploy | Container nginx may need SPA config from `Dockerfile` / `deployment/nginx-docker.conf` (one-time image rebuild) |

`backend-container` and other Docker services are not changed.
