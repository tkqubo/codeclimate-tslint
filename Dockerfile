FROM node

MAINTAINER tkqubo

# engine.json
COPY engine.json /

RUN useradd -u 9000 app

COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm install
RUN npm run build

USER app
VOLUME /code
WORKDIR /code

CMD ["/usr/src/app/bin/analyze"]
