FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=3000
ENV NODE_ENV=development

EXPOSE 3000

LABEL org.opencontainers.image.source=https://github.com/TallerS7-Expectativa-vs-Realidad/S7-Backend-Sis-Prestamos-y-Multas

CMD ["npm", "start"]
