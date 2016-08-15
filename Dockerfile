FROM node

MAINTAINER tkqubo

# engine.json
COPY engine.json /

RUN useradd -u 9000 -r -s /bin/false app

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app
RUN npm install
RUN npm run build

WORKDIR /code
USER app
VOLUME /code

CMD ["/usr/src/app/bin/analyze"]
