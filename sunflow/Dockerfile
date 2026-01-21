ARG BUILD_FROM=ghcr.io/hassio-addons/base:15.0.7
ARG BUILD_VERSION=dev
ARG BUILD_ARCH=amd64
FROM node:20-alpine AS build

WORKDIR /app

# Copy Sunflow source (packaged in this repo under /sunflow)
COPY sunflow/ /app/

# Build native deps + frontend in the builder image.
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
  && npm ci \
  && npm run build \
  && npm prune --omit=dev \
  && npm cache clean --force

FROM ${BUILD_FROM}

ARG BUILD_VERSION
ARG BUILD_ARCH

LABEL \
  io.hass.version=${BUILD_VERSION} \
  io.hass.type="addon" \
  io.hass.arch=${BUILD_ARCH}

# Home Assistant add-on base images are Alpine-based.
# We install only the runtime requirements here.

WORKDIR /app

RUN apk add --no-cache nodejs

COPY --from=build /app/ /app/

# Ensure persistent data dir exists
RUN mkdir -p /data

COPY run.sh /run.sh
RUN chmod +x /run.sh

EXPOSE 3000

CMD [ "/run.sh" ]
