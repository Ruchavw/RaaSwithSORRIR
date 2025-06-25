FROM node:18

# Install pnpm
RUN npm install -g pnpm

WORKDIR /usr/src/sorrir/app

# If you only have source/components, copy that
COPY source/components ./source



# Install dependencies if package.json is eventually present
# COPY ./package.json ./
# COPY ./pnpm-lock.yaml ./
# RUN pnpm install --frozen-lockfile --prod --silent || true

# Run the executor (adjust if necessary)
CMD ["echo", "RaaS executor started (mock)"]
