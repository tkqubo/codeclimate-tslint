FROM mhart/alpine-node:6
LABEL maintainer "Kyle Holzinger <kylelholzinger@gmail.com>"

WORKDIR /usr/src/app

# For cache purpose
ARG VER_TSLINT=5.0.0

COPY engine.json ./
COPY ./bin/ ./bin/

RUN npm install --global yarn && \
  apk --update add git jq && \
  bin/get-tslint-rules "$VER_TSLINT" && \
  cat engine.json | jq ".version = \"$VER_TSLINT\"" > /tmp/engine.json && \
  apk del --purge git jq && \
  npm uninstall --global yarn

RUN adduser -u 9000 -D app

COPY . /usr/src/app
RUN npm install --global yarn && \
  chown -R app:app ./ && \
  yarn install && \
  npm uninstall --global yarn && \
  mv /tmp/engine.json ./
RUN npm run build

USER app
VOLUME /code
WORKDIR /code

CMD ["/usr/src/app/bin/analyze"]
