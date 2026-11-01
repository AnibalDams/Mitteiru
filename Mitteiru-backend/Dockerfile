FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json index.ts ./
COPY src ./src
COPY static ./static

ENV NODE_ENV=production
ENV PORT=8000

RUN chown -R bun:bun /app

USER bun

EXPOSE 8000

CMD ["bun", "index.ts"]
