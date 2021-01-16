FROM node:12.20.1-alpine3.10

WORKDIR /usr/src/app
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
COPY ./tsconfig.json ./tsconfig.json
COPY ./packages/common/package.json ./packages/common/package.json
COPY ./packages/server/package.json ./packages/server/package.json

RUN yarn install

COPY ./packages/client/dist ./packages/client/dist
COPY ./packages/common ./packages/common
COPY ./packages/server ./packages/server




CMD cd ./packages/server && yarn run start
