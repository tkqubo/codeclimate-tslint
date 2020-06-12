.PHONY: image test release

MODULE_NAME ?= codeclimate-tslint
IMAGE_NAME ?= codeclimate/$(MODULE_NAME)
RELEASE_REGISTRY ?= us.gcr.io/code_climate
RELEASE_TAG ?= latest

image:
	docker build --rm -t $(IMAGE_NAME) .

shell: image
	docker container run \
	--volume $(PWD):/usr/src/app \
	-u root \
	--tty \
	--interactive \
	$(IMAGE_NAME) \
	sh

test: image
	docker container run \
	$(IMAGE_NAME) \
	/bin/sh -c 'cd /usr/src/app && yarn test'

release:
	docker tag $(IMAGE_NAME) $(RELEASE_REGISTRY)/$(MODULE_NAME):$(RELEASE_TAG)
	docker push $(RELEASE_REGISTRY)/$(MODULE_NAME):$(RELEASE_TAG)
