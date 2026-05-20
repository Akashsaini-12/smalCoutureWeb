# Auto-deploy frontend (Git push → Docker on VM)

Pushes to `main` run [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml), SSH into your VM, and run `~/website/deploy.sh`. That script pulls code, rebuilds `website-frontend:latest`, and restarts **`frontend-container`** on **port 3000** (same as before).

## One-time: link VM `~/website` to GitHub

Your VM folder was separate from GitHub. Run once on the VM as `smalcouture`:

```bash
cp -a ~/website ~/website.backup.$(date +%Y%m%d)
cd ~
mv website website_old
git clone https://github.com/Akashsaini-12/smalCoutureWeb.git website
cp website_old/.env.production website/ 2>/dev/null || true
chmod +x ~/website/deploy.sh
```

**Private repo:** use a [deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) on the VM so `git pull` works without a password.

First manual deploy after clone:

```bash
~/website/deploy.sh
```

## One-time: GitHub Actions secrets

In the repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Example |
|--------|---------|
| `VM_HOST` | Public IP or hostname of your VM |
| `VM_USER` | `smalcouture` |
| `VM_SSH_KEY` | Full private key (PEM) for deploy SSH |

## One-time: SSH key on the VM

On your Mac (or VM), create a key used only for deploys:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy_smalcouture -N ""
```

- Add **`github_deploy_smalcouture.pub`** to `~/.ssh/authorized_keys` on the VM (user `smalcouture`).
- Paste the **private** key contents into GitHub secret `VM_SSH_KEY`.

Ensure port **22** is reachable from the internet (for GitHub Actions).

## Day-to-day

```bash
git add .
git commit -m "Your message"
git push origin main
```

Watch **Actions** in GitHub. When green, the site at `http://<VM-IP>:3000` should show the new build.

## Verify on the VM

```bash
docker ps --filter name=frontend-container
docker images website-frontend
```

You should see `frontend-container` on `0.0.0.0:3000->80/tcp` and a recent image build time.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `git pull` fails on VM | Set up deploy key or HTTPS token; check `git remote -v` in `~/website` |
| SSH connection refused | Open firewall port 22; confirm `VM_HOST` / `VM_USER` |
| `docker build` fails | Check Actions log; run `~/website/deploy.sh` manually on VM for full output |
| Deep links 404 | SPA routing uses `deployment/nginx-docker.conf` in the image |

Other containers (`backend-container`, `react-frontend`, etc.) are not changed by this pipeline.
