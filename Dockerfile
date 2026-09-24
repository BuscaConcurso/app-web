FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# O Next grava NEXT_PUBLIC_* no bundle do navegador durante o build.
ARG NEXT_PUBLIC_BC_API_URL
ARG NEXT_PUBLIC_GTM_ID=""
# O acervo que o build pré-renderiza (home, sitemap). O CI não alcança a API
# interna, então o build lê a pública; em runtime o container define
# BC_API_URL=http://api:8788/v1, e este ENV não passa para o estágio abaixo.
ARG BC_API_URL
ENV NEXT_PUBLIC_BC_API_URL=$NEXT_PUBLIC_BC_API_URL NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID BC_API_URL=$BC_API_URL NEXT_TELEMETRY_DISABLED=1
RUN test -n "$NEXT_PUBLIC_BC_API_URL" && test -n "$BC_API_URL" && pnpm build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
