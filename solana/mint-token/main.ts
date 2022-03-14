import {createMint, getOrCreateAssociatedTokenAccount, mintTo} from "@solana/spl-token"
import {Connection, Keypair, PublicKey, LAMPORTS_PER_SOL} from "@solana/web3.js"
import {Logger} from "tslog"
import os from "os"
import path from "path"
import * as fs from "fs"

const logger = new Logger()

enum Job {
  CreateToken = "create-token",
  MintToken = "mint-token"
}

interface Args {
  env?: string
  job?: Job
  mint?: string
  mintAmount?: number
  tokenOwner?: string
}

const parseArgs = (): Args => {
  // Get the arguments
  const args = process.argv.slice(2)

  // Parse the arguments
  const argMap: Args = {}
  args.forEach(arg => {
    const [key, value] = arg.split("=")
    argMap[key] = value
  })

  return argMap
}

const getKeypair = (): Keypair => {
  const configDir = path.join(os.homedir(), ".config", "solana")
  const privateKeyPath = path.join(configDir, "id.json")
  if (!fs.existsSync(privateKeyPath)) {
    throw new Error("No private key found")
  }
  const parsed: number[] = JSON.parse(fs.readFileSync(privateKeyPath, "utf8"))
  return Keypair.fromSecretKey(Buffer.from(parsed))
}

const connectToCluster = async (env: string): Promise<Connection> => {
  let clusterUrl: string
  switch (env) {
    case "local":
      clusterUrl = "http://localhost:8899"
      break
    // case "testnet":
    //   return new Connection("https://testnet.solana.com")
    // case "mainnet":
    //   return new Connection("https://mainnet.solana.com")
    default:
      clusterUrl = "http://localhost:8899"
  }

  return new Connection(
    clusterUrl,
    "confirmed"
  )
}

const createToken = async (connection: Connection,
                           payer: Keypair,
                           ownerPubKey: string | undefined): Promise<[PublicKey, PublicKey]> => {
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    9
  )

  let owner: PublicKey
  if (ownerPubKey) {
    owner = new PublicKey(ownerPubKey)
  } else {
    owner = payer.publicKey
  }

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  )

  return [mint, tokenAccount.address]
}

const mintToken = async (connection: Connection,
                         mint: PublicKey,
                         payer: Keypair,
                         amount: number,
                         ownerPubKey: string | undefined): Promise<string> => {
  let owner: PublicKey
  if (ownerPubKey) {
    owner = new PublicKey(ownerPubKey)
  } else {
    owner = payer.publicKey
  }
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  )
  return mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer,
    amount * LAMPORTS_PER_SOL
  )
}

const main = async () => {
  const args = parseArgs()
  const keypair = getKeypair()
  const connection = await connectToCluster(args.env)

  const job = Job[args.job]
  switch (job) {
    case Job.CreateToken:
      const [mint, tokenAccount] = await createToken(
        connection,
        keypair,
        args.tokenOwner
      )
      logger.info("Created token:", mint.toBase58())
      logger.info("Created token account:", tokenAccount.toBase58())
      return
    case Job.MintToken:
      const inputMint = new PublicKey(args.mint)
      const mintAmount = Number(args.mintAmount)
      if (isNaN(mintAmount)) {
        throw new Error("Invalid mint amount")
      }
      const mintSignature = await mintToken(
        connection,
        inputMint,
        keypair,
        mintAmount,
        args.tokenOwner
      )
      logger.info(`Minted ${mintAmount} tokens: ${mintSignature}`)
      return
    default:
      throw new Error("Unknown job")
  }
}

main()
  .then(_ => {
    logger.info("Run succeeds")
  })
  .catch(e => {
    logger.error("Run fails", e)
  })