FROM node:18.18.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=3000

CMD ["npm", "start"]

