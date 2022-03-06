### DeGit - A decentralized Git-based repository

There are 3 core components of DeGit:
- Desktop client build in Electron, React and Express
- OrbitDB on IPFS for data persistence
- Solana program for the reward mechanism

The OrbitDB logic is embedded in the Desktop client implementation.

## Desktop Client
The entry point of the Desktop client is the `main.ts` file under `electron/app`.

To run the Electron app:
```shell
cd electron/app
npm start
```

During development, it's easier to run the React and Express individually instead of running the bundled 
version in Electron, which is faster for debugging.

To run them individually, run the following command:
```shell
cd electron/app
npm run test-client  # This starts the React server
npm run test-server  # This starts the Express server and IPFS daemon
```

## Solana
The Desktop client needs to interact with a Solana cluster. For simplicity, we can use a local Solana cluster.

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


