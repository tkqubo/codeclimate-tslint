#!/bin/sh
ORG=tkqubo

version=$(cat package.json | grep '"version":' | sed 's/.*: "//g' | sed 's/",//g')
name=$(cat package.json | grep '"name":' | sed 's/.*: "//g' | sed 's/",//g')
image_id=$(docker images | grep "^$ORG/$name\s" | awk '{print $3}' | head -1)

[ -z "$version" ] && echo "Version is missing" >&2 && exit 1
[ -z "$name" ] && echo "name is missing" >&2 && exit 1
[ -z "$image_id" ] && echo "Docker image $ORG/$name not found" >&2 && exit 1

docker tag $image_id $ORG/$name:$version
docker push $ORG/$name:$version
