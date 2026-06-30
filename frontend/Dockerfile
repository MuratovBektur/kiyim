# ---- base: deps + source (shared by dev/build) ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ---- dev: hot reload via nuxt dev (vite HMR), source comes from a bind mount ----
FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---- build: produce .output (client + nitro server) ----
FROM base AS build
RUN npm run build

# ---- prod: minimal runtime image, .output is self-contained ----
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
