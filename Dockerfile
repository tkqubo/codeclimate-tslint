FROM node

MAINTAINER tkqubo

# engine.json
COPY engine.json /

RUN useradd -u 1000 -r -s /bin/false app

COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm install -g typings
RUN npm install
RUN npm run build
RUN chown -R app:app /usr/src/app

USER app
WORKDIR /code

CMD ["/usr/src/app/bin/analyze"]
