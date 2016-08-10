FROM node

MAINTAINER tkqubo

# engine.json
COPY engine.json /

RUN useradd -u 9000 app

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

#COPY ./package.json /usr/src/app/package.json
COPY . /usr/src/app
RUN npm install -g typings
RUN typings install
RUN npm install


RUN npm run build

USER app
VOLUME /code
#WORKDIR /code

CMD ["/usr/src/app/bin/analyze"]
