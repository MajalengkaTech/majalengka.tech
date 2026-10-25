# Build di dalam image: modul native (libsql, sharp, resvg) jadi cocok dengan server (Linux ARM64),
# dan path data yang tertanam saat build menjadi /app/.data, sama dengan volume di docker-compose.yml.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=oven/bun:1.3.14 /usr/local/bin/bun /usr/local/bin/bun
# Build Nuxt kehabisan memori dengan heap bawaan.
ENV NODE_OPTIONS=--max-old-space-size=8192
COPY . .
RUN bun install --frozen-lockfile
# Prerender halaman docs memanggil better-auth, yang menolak jalan tanpa secret. Secret acak ini hanya untuk build;
# saat runtime nilainya ditimpa NUXT_BETTER_AUTH_SECRET dari .env.
RUN NUXT_BETTER_AUTH_SECRET="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")" bun run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Font untuk merender kartu kreator (PNG/SVG) di server.
RUN apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core fontconfig && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
