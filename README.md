### DeGit - A decentralized Git-based repository

## Solana
To run a local Solana cluster for testing:
```shell
solana config set --url localhost
solana-test-validator
```

To print the logs on the local cluster:
```shell
solana logs
```

To build the Solana program:
```shell
cd solana
sh build.sh
```

To deploy the Solana program to the cluster:
```shell
cd solana
sh deploy.sh
```

## Server
To run the server, execute the following. It runs on localhost at port 7050.
```shell
cd server
npm install
npm run start
```

## Client
TODO

