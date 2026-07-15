# ---- base: deps + source (shared by dev/build) ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

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
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["sh", "-c", "npm run migration:run:prod && node dist/main"]
