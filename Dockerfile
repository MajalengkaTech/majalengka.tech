FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core fontconfig && rm -rf /var/lib/apt/lists/*

COPY .output ./.output
COPY package.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
