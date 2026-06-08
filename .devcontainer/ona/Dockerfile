FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Install system dependencies (non-interactive)
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends \
  curl \
  wget \
  git \
  ca-certificates \
  unzip \
  fzf \
  openssl \
  xxd \
  postgresql-client \
  libglib2.0-0 \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libxss1 \
  libasound2t64 \
  libcups2t64 \
  libxkbcommon0 \
  libgtk-3-0t64 \
  libpangocairo-1.0-0 \
  libatk1.0-0t64 \
  libcairo-gobject2 \
  libgdk-pixbuf-2.0-0 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash \
  && mv /root/.bun /usr/local/bun \
  && ln -s /usr/local/bun/bin/bun /usr/local/bin/bun

# Verify installations
RUN bun --version && fzf --version && openssl version
