FROM node

MAINTAINER tkqubo

RUN useradd -u 9000 -r -s /bin/false app

WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm install

VOLUME /code
WORKDIR /code
USER app

CMD ["node", "/usr/src/app/bin/index.js"]

