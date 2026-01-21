ARG BUILD_FROM
FROM ${BUILD_FROM}

# Home Assistant add-on base images are Alpine-based.
# We use nodejs + npm from apk and build the frontend in-image for MVP.

WORKDIR /app

RUN apk add --no-cache nodejs npm

# Copy Sunflow source (packaged in this repo under /sunflow)
COPY sunflow/ /app/

# Install deps and build frontend
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
  && npm ci \
  && npm run build \
  && npm prune --omit=dev \
  && npm cache clean --force \
  && apk del .build-deps

# Ensure persistent data dir exists
RUN mkdir -p /data

COPY run.sh /run.sh
RUN chmod +x /run.sh

EXPOSE 3000

CMD [ "/run.sh" ]
