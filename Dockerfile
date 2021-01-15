FROM node:12.20.1-alpine3.10

WORKDIR /usr/src/app
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
COPY ./tsconfig.json ./tsconfig.json
COPY ./packages/client/dist ./packages/client/dist
COPY ./packages/common ./packages/common
COPY ./packages/server ./packages/server

RUN ls
RUN yarn install


CMD cd ./packages/server && yarn run start
