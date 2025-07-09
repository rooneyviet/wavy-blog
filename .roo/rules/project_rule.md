Docker Usage

- There is no `Go` installation on the host machine.
- All development, building, and running of the backend service **MUST** be done through Docker Compose, using the `docker compose -f docker-compose.dev.yml up --build` command.
- Remember. `docker compose`. DO NOT use `docker-compose`.

Backend Related Commands:
To run aws dynamodb related commands.
use `docker exec localstack awslocal dynamodb ......`

Examples:
To scan database:
`docker exec localstack awslocal dynamodb scan --table-name WavyBlog`

To scan database:
`docker exec localstack awslocal dynamodb delete-table --table-name WavyBlog`

To install a package to the backend:
`docker compose -f docker-compose.dev.yml run --rm api-backend go get {package}`

Frontend Related Commands:

To install a package to the frontend:
`docker compose -f docker-compose.dev.yml run --rm frontend yarn install`
`docker compose -f docker-compose.dev.yml run --rm frontend yarn add {package}`

To run a script in the frontend:
`docker compose -f docker-compose.dev.yml run --rm frontend yarn {script}`
