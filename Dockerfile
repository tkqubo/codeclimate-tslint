FROM mhart/alpine-node:6
LABEL maintainer "Kyle Holzinger <kylelholzinger@gmail.com>"

WORKDIR /usr/src/app

COPY engine.json ./
COPY ./bin/ ./bin/

RUN npm install --global yarn && \
  apk --update add git jq && \
  bin/get-tslint-rules "$(bin/version tslint)" && \
  cat engine.json | jq ".version = \"$(bin/version tslint)\"" > /tmp/engine.json && \
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
