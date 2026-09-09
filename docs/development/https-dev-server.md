# Development Guide: HTTPS Dev Server (`bun run dev:https`)

This guide explains how `bun run dev:https` works under the hood, and how to configure your OS so the HTTPS dev server starts cleanly instead of falling back to plain HTTP.

---

## 1. What `dev:https` Does

```bash
NEXT_DIST_DIR=.next-dev next dev --turbopack --experimental-https -p 3000 -H 0.0.0.0
```

With `--experimental-https`, Next.js provisions a locally-trusted TLS certificate via **mkcert**:

| Artifact | Location |
|---|---|
| mkcert binary (v1.4.4, auto-downloaded) | `~/.cache/mkcert/mkcert-v1.4.4-linux-amd64` |
| mkcert local CA (CAROOT) | `~/.local/share/mkcert/rootCA.pem` + `rootCA-key.pem` |
| Site certificate + key (per repo) | `<repo>/certificates/localhost.pem` + `localhost-key.pem` |

Hosts covered: `localhost`, `127.0.0.1`, `::1`, `0.0.0.0`.

Next.js runs this exact command (see `node_modules/next/dist/lib/mkcert.js`):

```bash
mkcert -install -key-file certificates/localhost-key.pem \
  -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1 0.0.0.0
```

Key behaviors to know:

- **Existing valid certs are reused.** If `certificates/localhost.pem` + `localhost-key.pem` exist, are valid for the host, and match each other, Next logs `Using already generated self signed certificate` and skips `mkcert -install` entirely.
- **`certificates/` must stay gitignored.** Never commit private keys. (Next appends it to `.gitignore` automatically on first generation.)
- On success, Next also sets `NODE_EXTRA_CA_CERTS=<CAROOT>/rootCA.pem` for the dev server process, so server-side fetches to itself trust the CA.

---

## 2. Common Failure: "Failed to generate self-signed certificate. Falling back to http."

mkcert's `-install` step copies the CA into your OS trust store and then runs an OS-specific "refresh trust store" command. **Which command it runs is decided purely by which directory exists**:

| If this directory exists | mkcert assumes | Refresh command |
|---|---|---|
| `/etc/pki/tls/certs` | Fedora/RHEL/openSUSE | `update-ca-trust extract` |
| `/usr/local/share/ca-certificates` | **Debian/Ubuntu** | `update-ca-certificates` |
| `/etc/ca-certificates/trust-source/anchors` | Arch Linux | `trust extract-compat` |

### The Arch Linux trap

On Arch, tools that were written for Debian sometimes create `/usr/local/share/ca-certificates/` (e.g. local proxy/MitM tooling). Once that directory exists, mkcert picks the Debian branch and runs `update-ca-certificates`, which does not exist on Arch — so the whole `mkcert -install` run exits 1 and Next falls back to HTTP:

```text
sudo: update-ca-certificates: command not found
ERROR: failed to execute "update-ca-certificates": exit status 1
⨯ Failed to generate self-signed certificate. Falling back to http.
```

Diagnose by running the exact command Next runs and reading the real error:

```bash
~/.cache/mkcert/mkcert-v1.4.4-linux-amd64 -install \
  -key-file certificates/localhost-key.pem \
  -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1 0.0.0.0
```

---

## 3. OS Setup

### 3.1 Arch Linux (the fix for the trap above)

The idea: **do the trust-store installation yourself using Arch-native tooling**, so mkcert's broken auto-detection never runs. Once the CA is in the system store, mkcert's "is the CA already installed?" check (Go `x509.Verify` against system roots) succeeds, so even future `mkcert -install` invocations — including the ones Next.js runs — pass.

```bash
# 0. Prerequisites (once): CA tooling + NSS tooling (certutil) for browsers
sudo pacman -S ca-certificates-utils nss

# 1. Pre-generate the site certificate WITHOUT -install
#    (writes only certificates/*.pem; does not touch any trust store)
~/.cache/mkcert/mkcert-v1.4.4-linux-amd64 \
  -key-file certificates/localhost-key.pem \
  -cert-file certificates/localhost.pem \
  localhost 127.0.0.1 ::1 0.0.0.0

# 2. Install the CA into the Arch system trust store
sudo install -Dm644 ~/.local/share/mkcert/rootCA.pem \
  /etc/ca-certificates/trust-source/anchors/mkcert-rootCA.crt
sudo update-ca-trust

# 3. Install the CA into the NSS stores (Chrome/Chromium/Firefox).
#    TRUST_STORES=nss tells mkcert to skip the (mis-detected) system store.
TRUST_STORES=nss ~/.cache/mkcert/mkcert-v1.4.4-linux-amd64 -install
```

Then **restart all browsers** (they only load new NSS CAs at launch) and run `bun run dev:https`.

Optional cleanup: if a previous failed `mkcert -install` left a stray
`/usr/local/share/ca-certificates/mkcert_development_CA_*.crt`, remove it — that
directory is inert on Arch (nothing consumes it) and its mere existence is what
triggers mkcert's wrong Debian detection:

```bash
sudo rm -f /usr/local/share/ca-certificates/mkcert_development_CA_*.crt
```

> **Caution:** only remove the `mkcert_development_CA_*.crt` file. Other entries in that
> directory may belong to other tools that placed them there deliberately.

### 3.2 Debian / Ubuntu

Works out of the box — mkcert finds `update-ca-certificates` and sudo-installs the CA. The first `bun run dev:https` may prompt for your password.

### 3.3 Fedora / RHEL / openSUSE

Works out of the box (`update-ca-trust`). May prompt for your password on first run.

### 3.4 macOS

Works out of the box; adds the CA to the login Keychain. May prompt for your password on first run.

-----

## 4. Verification

```bash
bun run dev:https
# Expected output includes:
#   - Local:   https://localhost:3000
#   - Network: https://0.0.0.0:3000

# System trust store check (NO -k flag: curl must validate the chain):
curl -I https://localhost:3000        # → 200 (or 307), no TLS error
```

In the browser, `https://localhost:3000` should show a valid lock icon with **no certificate warning** (after a browser restart, per section 3.1).

---

## 5. Reset / Regenerate

The cert is valid for ~2–3 years from creation. To force regeneration (e.g. after hostname changes or CA rotation):

```bash
rm -f certificates/localhost.pem certificates/localhost-key.pem
bun run dev:https   # regenerates; on Arch this now succeeds too (section 3.1 step 2 made mkcert idempotent)
```

To fully uninstall the mkcert CA from an Arch machine:

```bash
sudo rm -f /etc/ca-certificates/trust-source/anchors/mkcert-rootCA.crt
sudo update-ca-trust
TRUST_STORES=nss ~/.cache/mkcert/mkcert-v1.4.4-linux-amd64 -uninstall
```

---

## 6. Quick Reference

| Symptom | Cause | Fix |
|---|---|---|
| `sudo: update-ca-certificates: command not found` | Arch + stray `/usr/local/share/ca-certificates/` → mkcert picks Debian mode | Section 3.1 |
| `Falling back to http.` | Any `mkcert -install` failure | Run the mkcert command manually (section 2) to see the real error |
| Browser warns "not private" but `curl` passes | CA missing from NSS browser store | `TRUST_STORES=nss mkcert -install`, restart browser |
| `certificates/*.pem` exist but stale hostnames | Next reuses them silently | Delete both files, re-run (section 5) |
