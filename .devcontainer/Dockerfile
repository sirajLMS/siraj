FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Install system dependencies (non-interactive)
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends \
  curl \
  wget \
  git \
  zsh \
  sudo \
  ca-certificates \
  unzip \
  fzf \
  openssl \
  xxd \
  postgresql-client \
  postgresql \
  postgresql-contrib \
  redis-server \
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
  libxext6 \
  libxfixes3 \
  libx11-6 \
  libxcb1 \
  libxshmfence1 \
  libnspr4 \
  libatspi2.0-0 \
  libpulse0 \
  libwebpdemux2 \
  fonts-noto-cjk \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*


# Copy Oh My Zsh installation script and config
COPY scripts/install_ohmyzsh.sh /tmp/install_ohmyzsh.sh
COPY scripts/.p10k.zsh /tmp/.p10k.zsh

# Install Oh My Zsh, Powerlevel10k, and plugins
RUN chmod +x /tmp/install_ohmyzsh.sh && \
    /tmp/install_ohmyzsh.sh && \
    rm /tmp/install_ohmyzsh.sh

# Set zsh as default shell
ENV SHELL=/usr/bin/zsh
SHELL ["/usr/bin/zsh", "-c"]

# Copy and run Node.js installation script
COPY scripts/instalNode.sh /tmp/instalNode.sh
RUN chmod +x /tmp/instalNode.sh && \
    /tmp/instalNode.sh && \
    rm /tmp/instalNode.sh
