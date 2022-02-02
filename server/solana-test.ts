import {logger} from "./src/log"
import {
  createDataAccount,
  establishConnection,
  getAccount,
  getProgram,
  getTransaction,
  sendTransaction
} from "./src/solana"
import {sendAndConfirmTransaction} from "@solana/web3.js"

const solanaTest = async (): Promise<void> => {
  const connection = await establishConnection()
  const account = await getAccount()
  const programId = await getProgram(connection)
  const transaction = await getTransaction(
    account,
    programId
  )
  const {dataPubKey, dataToSend} = await createDataAccount(
    account,
    programId,
    connection
  )

  logger.info("Sending to", dataPubKey.toBase58())
  await sendTransaction(
    account,
    dataPubKey,
    programId,
    connection,
    dataToSend
  )

  // const result = await sendAndConfirmTransaction(
  //   connection,
  //   transaction,
  //   [account],
  // )
  //
}

logger.info("run begins")
solanaTest().then(
  _ => {
    logger.info("run succeeds")
    process.exit(0)
  },
  err => {
    logger.error("run fails", err)
    process.exit(-1)
  }
)