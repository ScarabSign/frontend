FROM node:18-alpine as development

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Production build stage can be added here if needed
# FROM node:18-alpine as production
# ...
