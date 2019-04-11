.PHONY: image

IMAGE_NAME ?= codeclimate/codeclimate-tslint

image:
	docker build --rm -t $(IMAGE_NAME) .
