import {Connection, Keypair, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js"
import {logger} from "./log"
import path from "path"
import os from "os"
import fs from "mz/fs"
import yaml from "yaml"
import {ns64, struct, u32} from "@solana/buffer-layout"

const PROGRAM_KEYPAIR_PATH = path.join(
  "../solana/dist/program/degit-keypair.json"
)

const getRpcUrl = async (): Promise<string> => {
  const config = await getConfig()
  const jsonRpcUrl = config.json_rpc_url
  if (!jsonRpcUrl) {
    throw new Error("No JSON RPC URL configured")
  }
  return jsonRpcUrl
}

const establishConnection = async (): Promise<Connection> => {
  const rpcUrl = await getRpcUrl()
  const connection = new Connection(rpcUrl, "confirmed")
  const version = await connection.getVersion()
  logger.info("Connected to cluster", rpcUrl, version)
  return connection
}

const getAccount = async (): Promise<Keypair> => {
  const config = await getConfig()
  const keypairPath = config.keypair_path
  if (!keypairPath) {
    throw new Error("No keypair path specified")
  }
  return await createKeypairFromFile(keypairPath)
}

const getConfig = async (): Promise<any> => {
  const configPath = path.resolve(
    os.homedir(),
    ".config",
    "solana",
    "cli",
    "config.yml"
  )
  const config = await fs.readFile(configPath, {encoding: "utf8"})
  return yaml.parse(config)
}

const createKeypairFromFile = async (filePath: string): Promise<Keypair> => {
  const secretKeyString = await fs.readFile(
    filePath,
    {encoding: "utf8"}
  )
  const secretKey = Uint8Array.from(
    JSON.parse(secretKeyString)
  )
  return Keypair.fromSecretKey(secretKey)
}

const getProgram = async (connection: Connection): Promise<PublicKey> => {
  const programKeypair = await createKeypairFromFile(
    PROGRAM_KEYPAIR_PATH
  )
  const programId = programKeypair.publicKey
  const programInfo = await connection.getAccountInfo(programId)
  if (!programInfo.executable) {
    throw new Error(
      `Program ${programId.toBase58()} is not executable.`
    )
  }
  return programId
}

const getTransaction = async (account: Keypair, programId: PublicKey): Promise<Transaction> => {
  const transaction = new Transaction(
    {
      feePayer: account.publicKey,
    }
  )
  const keys = [
    {pubkey: account.publicKey, isSigner: true, isWritable: true}
  ]

  let params = {space: 100}

  let allocateStruct = {
    index: 8,
    layout: struct([
      u32("instruction"),
      ns64("space"),
    ])
  }

  let data = Buffer.alloc(allocateStruct.layout.span)
  let layoutFields = Object.assign({instruction: allocateStruct.index}, params)
  allocateStruct.layout.encode(layoutFields, data)

  const instruction = new TransactionInstruction(
    {
      keys,
      programId,
      data
    }
  )
  transaction.add(instruction)

  return transaction
}

export {
  establishConnection,
  getAccount,
  getConfig,
  getProgram,
  getRpcUrl,
  getTransaction,
}

