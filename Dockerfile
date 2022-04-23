FROM node:lts AS development
LABEL maintainer="Arville"

ENV PGID=1000
ENV PUID=1000
ENV NODE_ENV=development

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy app files
COPY . .

RUN chown ${PUID}:${PGID} -R /app

EXPOSE 3090

USER ${PUID}:${PGID}

CMD ["node", "index.js"]