

build-image:
	docker build -t="virtualgulaschtreff" -f .docker/Dockerfile --no-cache .

push-login:
	docker login

push-image: push-login
	docker push virtualgulaschtreff:latest