import {Request, Response} from "express"
import {
  Connection,
  Keypair, LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js"
import {TOKEN_PROGRAM_ID} from "@solana/spl-token"
import * as borsh from "borsh"
import {Buffer} from "buffer"
import {Config} from "../../config"
import {getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress} from "@solana/spl-token"

class RepoAccount {
  quorum: number
  owner: string
  orbit_id: string
  repo_name: string

  constructor(args: any) {
    this.quorum = args.quorum
    this.owner = args.owner
    this.orbit_id = args.orbit_id
    this.repo_name = args.repo_name
  }
}

const RepoAccountSchema = new Map([
  [
    RepoAccount,
    {
      kind: "struct",
      fields: [
        ["quorum", "u8"],
        ["owner", "string"],
        ["orbit_id", "string"],
        ["repo_name", "string"]
      ]
    }
  ],
])

class InvestAccount {
  amount: number
  git_ref: string

  constructor(args: any) {
    this.amount = args.amount
    this.git_ref = args.git_ref
  }
}

const InvestAccountSchema = new Map([
  [
    InvestAccount,
    {
      kind: "struct",
      fields: [
        ["amount", "u64"],
        ["git_ref", "string"]
      ]
    }
  ],
])

const checkIfAccountExists = async (
  solana: Connection,
  publicKey: PublicKey
): Promise<boolean> => {
  const accountInfo = await solana.getAccountInfo(publicKey)
  return accountInfo !== null
}

const getCreateAccountInstruction = async (
  connection: Connection,
  dataSize: number,
  programId: PublicKey,
  fromPublicKey: PublicKey,
  seed: string
): Promise<TransactionInstruction> => {
  const lamports = await connection.getMinimumBalanceForRentExemption(
    dataSize
  )
  const programAccountPublicKey = await PublicKey.createWithSeed(
    fromPublicKey,
    seed,
    programId
  )
  return SystemProgram.createAccountWithSeed(
    {
      fromPubkey: fromPublicKey,
      basePubkey: fromPublicKey,
      seed: seed,
      newAccountPubkey: programAccountPublicKey,
      lamports,
      space: dataSize,
      programId: programId,
    }
  )
}

export const getDAO = async (req: Request, res: Response) => {
  const solana: Connection = req.app.get("solana")
  const owner = req.query.owner
  const programAccounts = await solana.getProgramAccounts(
    Config.DAO_PROGRAM_ID
  )

  const foundAccounts: RepoAccount[] = []
  for (const p of programAccounts) {
    let repoAccount: RepoAccount
    try {
      repoAccount = await borsh.deserialize(
        RepoAccountSchema,
        RepoAccount,
        p.account.data
      ) as RepoAccount
    } catch (e) {
      continue
    }

    if (owner && repoAccount.owner !== owner) {
      continue
    }

    foundAccounts.push(repoAccount)
  }

  res.json({success: true, accounts: foundAccounts})
}

export const postDAO = async (req: Request, res: Response) => {
  // Parse parameters
  let solana: Connection
  let keypair: Keypair
  let repoName: string
  let orbitId: string
  let quorum: number
  try {
    solana = req.app.get("solana")
    const privateKey: Uint8Array = Uint8Array.from(req.body.privateKey)
    keypair = Keypair.fromSecretKey(privateKey)
    repoName = req.body.repoName
    orbitId = req.body.orbitId
    quorum = req.body.quorum || 0
  } catch (e) {
    res.status(400).json({
      "success": false,
      "error": e.message,
    })
    return
  }

  // Generate a public key for the program-owned account
  let programAccountPublicKey: PublicKey
  try {
    programAccountPublicKey = await PublicKey.createWithSeed(
      keypair.publicKey,
      repoName,
      Config.DAO_PROGRAM_ID
    )
  } catch (e) {
    res.status(500).json({"success": false, "error": e.message})
    return
  }

  // Get minimum rent
  const data = new RepoAccount(
    {
      quorum: quorum,
      owner: keypair.publicKey.toBase58(),
      repo_name: repoName,
      orbit_id: orbitId,
    }
  )
  const serialized = await borsh.serialize(
    RepoAccountSchema,
    data
  )

  // Check if account exists
  let accountExists: boolean
  try {
    accountExists = await checkIfAccountExists(
      solana,
      programAccountPublicKey
    )
  } catch (e) {
    res.status(500).json({"success": false, "error": e.message})
    return
  }

  const transaction = new Transaction()
  if (!accountExists) {
    let createAccountInstruction: TransactionInstruction
    try {
      createAccountInstruction = await getCreateAccountInstruction(
        solana,
        serialized.length,
        Config.DAO_PROGRAM_ID,
        keypair.publicKey,
        repoName
      )
    } catch (e) {
      res.status(500).json({"success": false, "error": e.message})
      return
    }
    transaction.add(createAccountInstruction)
  }

  // Declare the instruction to populate data to account
  const populateDataInstruction = new TransactionInstruction(
    {
      keys: [
        {pubkey: keypair.publicKey, isSigner: true, isWritable: false},
        {pubkey: programAccountPublicKey, isSigner: false, isWritable: true}
      ],
      programId: Config.DAO_PROGRAM_ID,
      data: Buffer.from(serialized)
    }
  )
  transaction.add(populateDataInstruction)

  // Execute the transaction in the network
  let response: string
  try {
    response = await sendAndConfirmTransaction(
      solana,
      transaction,
      [keypair]
    )
  } catch (e) {
    res.status(500).json({"success": false, "error": e.message})
    return
  }

  res.json({"success": true, "response": response})
}

export const postInvest = async (req: Request, res: Response) => {
  const solana: Connection = req.app.get("solana")
  const privateKey: Uint8Array = Uint8Array.from(req.body.privateKey)
  const keypair = Keypair.fromSecretKey(privateKey)
  const repo: string = req.body.repoName
  const amount: number = Number(req.body.amount)

  // Derive program account public key
  let programAccountPublicKey: PublicKey
  try {
    programAccountPublicKey = await PublicKey.createWithSeed(
      keypair.publicKey,
      repo,
      Config.INVEST_PROGRAM_ID
    )
  } catch (e) {
    res.status(500).send({"success": false, "error": e})
    return
  }

  // Check if program already exists
  let exist: boolean
  try {
    exist = await checkIfAccountExists(
      solana,
      programAccountPublicKey
    )
  } catch (e) {
    res.status(500).send({"success": false, "error": e})
    return
  }

  const transaction = new Transaction()

  // If program account doesn't exist, create one
  const data = new InvestAccount(
    {
      amount: amount,
      git_ref: repo
    }
  )
  const serialized = await borsh.serialize(
    InvestAccountSchema,
    data
  )

  if (!exist) {
    let createAccountInstruction: TransactionInstruction
    try {
      createAccountInstruction = await getCreateAccountInstruction(
        solana,
        serialized.length,
        Config.INVEST_PROGRAM_ID,
        keypair.publicKey,
        repo
      )
    } catch (e) {
      res.status(500).send({"success": false, "error": e})
      return
    }

    transaction.add(createAccountInstruction)
  }

  // Transfer to associated token account owned by the program
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    solana,
    keypair,
    Config.TOKEN,
    keypair.publicKey
  )
  const toTokenAccountAddress = await getAssociatedTokenAddress(
    Config.TOKEN,
    Config.INVEST_PROGRAM_ID
  )

  const transferInstruction = new TransactionInstruction(
    {
      keys: [
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
        {pubkey: fromTokenAccount.address, isSigner: false, isWritable: true},
        {pubkey: toTokenAccountAddress, isSigner: false, isWritable: true},
        {pubkey: programAccountPublicKey, isSigner: false, isWritable: true},
        {pubkey: keypair.publicKey, isSigner: true, isWritable: true}
      ],
      programId: Config.INVEST_PROGRAM_ID,
      data: Buffer.from(serialized)
    }
  )
  transaction.add(transferInstruction)

  await sendAndConfirmTransaction(
    solana,
    transaction,
    [keypair]
  )

  res.json({"success": true})
}

export const postAirdrop = async (req: Request, res: Response) => {
  const solana: Connection = req.app.get("solana")
  const publicKey = req.body.publicKey
  if (!publicKey) {
    res.status(400).send({"success": false, "error": "Missing public key"})
    return
  }
  try {
    const airdropSignature = await solana.requestAirdrop(
      new PublicKey(publicKey),
      LAMPORTS_PER_SOL
    )
    await solana.confirmTransaction(airdropSignature)
  } catch (e) {
    res.status(500).send({"success": false, "error": e})
    return
  }

  res.json({"success": true})
}

export const postSendSol = async (req: Request, res: Response) => {
  const solana: Connection = req.app.get("solana")
  const fromPublicKey = req.body.fromPublicKey
  const toPublicKey = req.body.toPublicKey
  const signerPrivKey = req.body.signerPrivKey
  const amount = req.body.amount

  if (!fromPublicKey || !toPublicKey || !signerPrivKey || !amount) {
    res
      .status(400)
      .send({"success": false, "error": "Missing required fields"})
    return
  }

  let transferInstruction: TransactionInstruction
  try {
    transferInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(fromPublicKey),
      toPubkey: new PublicKey(toPublicKey),
      lamports: Number(amount) * LAMPORTS_PER_SOL
    })
  } catch (e) {
    res.status(500).send({"success": false, "error": e.toString()})
    return
  }

  const transaction = new Transaction()
  transaction.add(transferInstruction)

  try {
    await sendAndConfirmTransaction(
      solana,
      transaction,
      [Keypair.fromSecretKey(Buffer.from(signerPrivKey))]
    )
  } catch (e) {
    res.status(500).send({"success": false, "error": e.toString()})
    return
  }

  res.json({"success": true})
}