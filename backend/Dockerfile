# ---- base: deps + source + generated prisma client (shared by dev/build) ----
FROM node:20-alpine AS base
# Prisma's musl query engine dlopen()s libssl at runtime; alpine doesn't ship it by default.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

# ---- dev: hot reload via nest --watch, source comes from a bind mount ----
FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# ---- build: compile to dist ----
FROM base AS build
RUN npm run build

# ---- prod: minimal runtime image ----
FROM node:20-alpine AS prod
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main"]
