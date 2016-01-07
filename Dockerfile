FROM node

MAINTAINER tkqubo

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN useradd -u 9000 -r -s /bin/false app
COPY engine.json /

RUN npm install
RUN npm run build

RUN chown -R app:app /usr/src/app

WORKDIR /code
USER app

CMD ["/usr/src/app/bin/analyze"]
