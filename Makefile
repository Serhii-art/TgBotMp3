build:
	docker build -t botmp3 .

run:
	docker run -d -p 3000:3000 --name botmp3 --rm botmp3

