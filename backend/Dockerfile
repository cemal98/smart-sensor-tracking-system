FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install bcryptjs

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]