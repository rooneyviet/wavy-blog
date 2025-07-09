Docker Usage

- Check the docker-compose.dev.yml file for the correct commands.
- There is no `Go` installation on the host machine.
- All development, building, and running of the backend service **MUST** be done through Docker Compose, using the `docker compose -f docker-compose.dev.yml up --build` command.
- Remember. `docker compose`. DO NOT use `docker-compose`.
- The port for backend when accessing from the host machine is localhost:8010. The port for frontend when accessing from the host machine is localhost:3020. There is nothing wrong about this.

Backend Related Commands:
To run aws dynamodb related commands.
use `docker exec localstack awslocal dynamodb ......`

Examples:
To scan database:
`docker exec localstack awslocal dynamodb scan --table-name WavyBlog`

To delete database:
`docker exec localstack awslocal dynamodb delete-table --table-name WavyBlog`

To install a package to the backend:
`docker compose -f docker-compose.dev.yml run --rm api-backend go get {package}`

Frontend Related Commands:

To install a package to the frontend:
`docker compose -f docker-compose.dev.yml run --rm frontend yarn install`
`docker compose -f docker-compose.dev.yml run --rm frontend yarn add {package}`

To run a script in the frontend:
`docker compose -f docker-compose.dev.yml run --rm frontend yarn {script}`

When there are errors, users will input the error and will tell you to debug. You need to follow these steps:

1. Check the existing code that related to the error.
2. Debug it. Add console.log to the code. Add a speacial debug code. Run a command line, or something like that. There are many ways to debug.
3. Get the result from the debug output. Analyze the result.
4. Propose a solution to the problem.
5. After I OK to the solution, Please implement it.

THE MOST IMPORTANT THING IS TO ONLY FIX THE RELATED ERRORS. IF THERE ARE PROBLEMS THAT ARE NOT RELATED TO THE CODE, PLEASE DO NOT FIX THEM!!!!
