FROM node:18-alpine
WORKDIR /app

# install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --production

# copy server + frontend
COPY . ./

ENV PORT=3000
EXPOSE 3000

CMD [ "npm", "start" ]
