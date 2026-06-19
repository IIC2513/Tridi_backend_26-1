FROM node:22-alpine

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

RUN pnpm install --frozen-lockfile

# 3. Copy the rest of your application code
COPY . .

ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/server.js"]
