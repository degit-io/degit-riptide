import {Request, Response, NextFunction} from "express"
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js"
import fs from "mz/fs"
import path from "path"
import os from "os"
import yaml from "yaml"
import * as borsh from "borsh"


// TODO: This should be configurable or inferred from somewhere
const RPC_URL = "http://localhost:8899"
const PROGRAM_ID_BASE58 = "7dVMFPaY1f6RWeanTtXwCWQTTeTVE2FEhmEnC9djZho4"
const SEED = "testSeed3"
const INIT_DATA = "master"


export const connectToSolana = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.locals.connection = new Connection(RPC_URL, "confirmed")
  } catch (e) {
    res.status(500).send("Failed to connect to Solana cluster")
    return
  }

  next()
}

export const getSolanaProgramInfo = async (req: Request, res: Response, next: NextFunction) => {
  const programId = new PublicKey(PROGRAM_ID_BASE58)
  const programInfo = await res.locals.connection.getAccountInfo(programId)
  if (programInfo === null) {
    res.status(500).send("Failed to get program info")
    return
  } else if (!programInfo.executable) {
    res.status(500).send("Program is not executable")
    return
  }

  res.locals.programId = programId

  next()
}

export const getSolanaAccount = async (req: Request, res: Response, next: NextFunction) => {
  const config = await readSolanaConfig()
  const keypairPath = config.keypair_path

  if (!keypairPath) {
    res.status(500).send("Keypair path not configured")
    return
  }

  try {
    res.locals.account = await createKeypairFromFile(keypairPath)
  } catch (e) {
    res.status(500).send("Failed to read keypair from file")
    return
  }

  next()
}

export const createSolanaDataAccount = async (req: Request, res: Response, next: NextFunction) => {
  const account: Keypair = res.locals.account
  const programId: PublicKey = res.locals.programId
  const connection: Connection = res.locals.connection

  const dataAccountPubKey = await PublicKey.createWithSeed(
    account.publicKey,
    SEED,
    programId
  )
  const dataAccount = await connection.getAccountInfo(dataAccountPubKey)
  res.locals.dataPubKey = dataAccountPubKey
  if (dataAccount !== null) {
    next()
    return
  }

  const data = new DataAccount({git_ref: INIT_DATA})
  const serialized = await borsh.serialize(DataSchema, data)
  const size = serialized.length

  const lamports = await connection.getMinimumBalanceForRentExemption(size)
  const transaction = new Transaction().add(
    SystemProgram.createAccountWithSeed(
      {
        fromPubkey: account.publicKey,
        basePubkey: account.publicKey,
        seed: SEED,
        newAccountPubkey: dataAccountPubKey,
        lamports,
        space: size,
        programId,
      }
    )
  )

  await sendAndConfirmTransaction(
    connection,
    transaction,
    [account]
  )

  next()
}

export const updateSolanaAccount = async (req: Request, res: Response, next: NextFunction) => {
  const programId: PublicKey = res.locals.programId
  const dataPubKey: PublicKey = res.locals.dataPubKey
  const connection: Connection = res.locals.connection
  const account: Keypair = res.locals.account

  const data = new DataAccount({git_ref: "master"})
  const dataToSend = borsh.serialize(DataSchema, data)

  const instruction = new TransactionInstruction({
    keys: [{pubkey: dataPubKey, isSigner: false, isWritable: true}],
    programId,
    data: Buffer.from(dataToSend),
  })
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [account]
  )

  res.end()
}

const readSolanaConfig = async (): Promise<any> => {
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

class DataAccount {
  constructor(properties) {
    Object.keys(properties).forEach((key) => {
      this[key] = properties[key]
    })
  }
}

const DataSchema = new Map([
  [DataAccount, {kind: "struct", fields: [["git_ref", "string"]]}],
])
