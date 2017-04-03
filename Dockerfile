FROM mhart/alpine-node:6
LABEL maintainer "Kyle Holzinger <kylelholzinger@gmail.com>"

WORKDIR /usr/src/app

COPY . /usr/src/app
COPY bin/docs ./bin/
COPY engine.json package.json ./

RUN npm install --global yarn && \
  apk --update add git jq && \
  npm install && \
  version="$(npm -j ls tslint | jq -r .dependencies.tslint.version)" && \
  bin/docs "$version" && \
  cat engine.json | jq ".version = \"$version\"" > /tmp/engine.json && \
  apk del --purge git jq && \
  npm uninstall --global yarn

RUN adduser -u 9000 -D app
COPY . /usr/src/app
RUN chown -R app:app ./ && \
  mv /tmp/engine.json ./
RUN npm run build

USER app

VOLUME /code
WORKDIR /code

CMD ["/usr/src/app/bin/analyze"]
