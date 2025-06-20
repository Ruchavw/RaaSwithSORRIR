FROM gitlab-vs.informatik.uni-ulm.de:4567/sorrir/mvp:master

WORKDIR /usr/src/sorrir/app
COPY ./package.json .
COPY ./pnpm-lock.yaml .
COPY ./tsconfig.json .
COPY ./source ./source
COPY ./config ./config
COPY ./dist ./dist
RUN pnpm link ../framework --silent && \
    echo "framework successfully linked" && \
    pnpm install --frozen-lockfile --prod --silent && \
    echo "installed dependencies"

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ENTRYPOINT [ "npm", "run", "startExecutor" ]