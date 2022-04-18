FROM node:16.8.0
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "index.js"]
EXPOSE 3000