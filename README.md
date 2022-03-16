## DeGit - Incentivize open-source development 

### Motivation
The worldwide open-source development community has given rise to numerous production-ready frameworks, 
libraries and tools. Many of these are free for commercial use, yet actively maintained by the community.
While developers working on open-source projects are often self-motivated, we believe they should be rewarded 
for their contribution to the world. Hence, we propose **Degit**, a decentralized Git-based version control 
system with a reward mechanism, to give back to the open-source world.

### Key Ideas 
* Git-based version control: Degit is based on Git, so developers do not need to change their workflow.
* Peer-to-peer repository hosting: All the codes will be uploaded to IPFS. The states of the repository will be persisted 
in OrbitDB, an open-source IPFS-based database protocol.
* Free to use: While Degit is integrated with Solana blockchain, it can also be used without using token. In other words 
Degit is a Web3 counterpart of repository hosting solution.
* Repository as an organization: A repository owner can publish his / her repository as a DAO. Then they earn rewards 
based on their development activities in the repository. Other users can join the DAO by acting as investors, by investing 
tokens in the repository and gain returns on investments.

### Implementation
Currently, the project is in very early development stage, so expect bugs, incompleteness and other issues. Also expect 
there can be major rework in the very near future that can completely change the design pattern.

Conceptually, Degit consists of the following components:

* Desktop Client (Electron): A desktop application that provides a GUI for users to interact with Degit. The reason why 
we plan to use a desktop app instead of a web app is mainly because we need to execute Git commands behind the scene 
and such that we can have finer control on IPFS and OrbitDB.
* Git Server: In order for users to directly manage their codes using Git, we provide a Git server that runs on the 
user's machine, with some tweaks such that the states of the repository can be persisted in OrbitDB and the code bundles 
can be uploaded to IPFS.
* OrbitDB: Persistence layer of the application - all data that is not on-chain is stored in OrbitDB.
* Web3Auth: Providing wallet key management for the user.
* Solana: The desktop client interacts with the blockchain to update the DAO's related information that is required for 
calculating rewards.
* Reward Program (Not started to implement): The reward program is executed in certain time intervals, which picks up 
the on-chain DAO information and repository activities to determine the reward.

### Demo / Testing
At this stage, it is suggested to run the front-end and back-end separately instead of running the entire Electron app   

To run the client and server individually, run the following command:
```shell
cd electron
npm run test-client  # This starts the React server
npm run test-server  # This starts the Express server and IPFS daemon
```

If instead you want to run the Electron app, use the command below:
```shell
cd electron
npm start
```

To build the Solana program:
```shell
cd solana 
sh build.sh -d dao
```

To deploy the Solana program to the cluster:
```shell
cd solana
sh deploy.sh -d dao
```


