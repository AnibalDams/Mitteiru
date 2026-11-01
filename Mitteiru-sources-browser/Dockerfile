FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# Instala Chromium + dependencias del sistema que necesita Patchright.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx patchright install --with-deps chromium \
    && chmod -R 755 /ms-playwright

COPY server.mjs ./
RUN chown -R node:node /app

ENV PORT=8787
ENV NODE_ENV=production
ENV HOME=/home/node

USER node

EXPOSE 8787

CMD ["node", "server.mjs"]
