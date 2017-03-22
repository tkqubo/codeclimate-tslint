FROM mhart/alpine-node:6

MAINTAINER kyleholzinger

# engine.json
COPY engine.json /

RUN adduser -u 9000 -D app

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app
RUN npm install
RUN npm run build
RUN apk --update add git jq
RUN version="$(npm -j ls tslint | jq -r .dependencies.tslint.version)" && \
  printf "Pulling docs from TSLint %s\n" "$version" && \
  git clone --quiet --branch "$version" https://github.com/palantir/tslint.git && \
  cd tslint && \
  npm install && \
  npm run compile && \
  npm run docs && \
  cd .. && \
  mkdir -p ./lib/docs && \
  cp --recursive tslint/docs/_data/rules.json ./lib/docs/rules.json && \
  rm -rf tslint
RUN apk del git jq

WORKDIR /code
USER app
VOLUME /code

CMD ["/usr/src/app/bin/analyze"]
