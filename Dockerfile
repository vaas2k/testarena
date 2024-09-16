FROM node:22-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .


#RUN npm install -f

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm","run","start"]