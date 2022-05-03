FROM node:16

WORKDIR /app

COPY package.json yarn.lock /app/

RUN yarn

COPY index.js /app/

CMD ["index.js"]
