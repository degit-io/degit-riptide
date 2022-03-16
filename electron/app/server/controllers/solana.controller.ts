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
import {createHash} from "crypto"

class RepoAccount {
  account_type: string
  repo_owner: string
  repo_name: string
  orbit_id: string
  total_investment: number

  constructor(args: any) {
    this.account_type = args.account_type
    this.repo_owner = args.repo_owner
    this.repo_name = args.repo_name
    this.orbit_id = args.orbit_id
    this.total_investment = args.total_investment
  }
}

const RepoAccountSchema = new Map([
  [
    RepoAccount,
    {
      kind: "struct",
      fields: [
        ["account_type", "string"],
        ["repo_owner", "string"],
        ["repo_name", "string"],
        ["orbit_id", "string"],
        ["total_investment", "u64"],
      ]
    }
  ],
])

class InvestAccount {
  account_type: string
  repo_owner: string
  repo_name: string
  orbit_id: string
  investor: string
  invested_amount: number

  constructor(args: any) {
    this.account_type = args.account_type
    this.repo_owner = args.repo_owner
    this.repo_name = args.repo_name
    this.orbit_id = args.orbit_id
    this.investor = args.investor
    this.invested_amount = args.invested_amount
  }
}

const InvestAccountSchema = new Map([
  [
    InvestAccount,
    {
      kind: "struct",
      fields: [
        ["account_type", "string"],
        ["repo_owner", "string"],
        ["repo_name", "string"],
        ["orbit_id", "string"],
        ["investor", "string"],
        ["invested_amount", "u64"],
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

    if (owner && repoAccount.repo_owner !== owner) {
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
  try {
    solana = req.app.get("solana")
    const privateKey: Uint8Array = Uint8Array.from(req.body.privateKey)
    keypair = Keypair.fromSecretKey(privateKey)
    repoName = req.body.repoName
    orbitId = req.body.orbitId
  } catch (e) {
    res.status(400).json({
      "success": false,
      "error": e.message,
    })
    return
  }

  // Generate a public key for the program-owned account
  let daoAccountPublicKey: PublicKey
  try {
    daoAccountPublicKey = await PublicKey.createWithSeed(
      keypair.publicKey,
      repoName,
      Config.DAO_PROGRAM_ID
    )
  } catch (e) {
    res.status(500).json({
      "success": false,
      "error": e.message
    })
    return
  }

  // Get minimum rent
  const data = new RepoAccount(
    {
      account_type: "dao",
      repo_owner: keypair.publicKey.toBase58(),
      repo_name: repoName,
      orbit_id: orbitId,
      total_investment: 0
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
      daoAccountPublicKey
    )
  } catch (e) {
    res.status(500).json({"success": false, "error": e.message})
    return
  }

  if (accountExists) {
    res.status(400).json({
      "success": false,
      "error": "DAO already exists"
    })
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
        {pubkey: daoAccountPublicKey, isSigner: false, isWritable: true}
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
  const orbitId: string = req.body.orbitId
  const publicKey: string = req.body.publicKey
  const amount: number = Number(req.body.amount)

  // Derive DAO program account public key
  let daoAccountPublicKey: PublicKey
  try {
    daoAccountPublicKey = await PublicKey.createWithSeed(
      new PublicKey(publicKey),
      repo,
      Config.DAO_PROGRAM_ID
    )
  } catch (e) {
    res.status(500).send({"success": false, "error": e})
    return
  }

  // Derive investor program account public key
  let investorAccountPublicKey: PublicKey
  let investorAccountSeed: string
  try {
    investorAccountSeed = createHash("sha256")
      .update(`${keypair.publicKey.toBase58()}-${repo}`)
      .digest("hex")
      .substring(0, 32)
    investorAccountPublicKey = await PublicKey.createWithSeed(
      keypair.publicKey,
      investorAccountSeed,
      Config.DAO_PROGRAM_ID
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
      investorAccountPublicKey
    )
  } catch (e) {
    res.status(500).send({"success": false, "error": e})
    return
  }

  const transaction = new Transaction()

  // If program account doesn't exist, create one
  const data = new InvestAccount(
    {
      account_type: "investor",
      orbit_id: orbitId,
      repo_name: repo,
      repo_owner: publicKey,
      invested_amount: amount,
      investor: keypair.publicKey.toBase58()
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
        Config.DAO_PROGRAM_ID,
        keypair.publicKey,
        investorAccountSeed
      )
    } catch (e) {
      res.status(500).json({success: false, error: e.message})
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
    Config.TOKEN_ACCOUNT
  )

  const investInstruction = new TransactionInstruction(
    {
      keys: [
        {pubkey: keypair.publicKey, isSigner: true, isWritable: true},
        {pubkey: daoAccountPublicKey, isSigner: false, isWritable: true},
        {pubkey: investorAccountPublicKey, isSigner: false, isWritable: true},
        {pubkey: fromTokenAccount.address, isSigner: false, isWritable: true},
        {pubkey: toTokenAccountAddress, isSigner: false, isWritable: true},
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
      ],
      programId: Config.DAO_PROGRAM_ID,
      data: Buffer.from(serialized)
    }
  )
  transaction.add(investInstruction)

  try {
    await sendAndConfirmTransaction(
      solana,
      transaction,
      [keypair]
    )
  } catch (e) {
    res.status(500).json({"success": false, "error": e.message})
    return
  }

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