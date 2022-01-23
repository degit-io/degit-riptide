import {logger} from "./src/log"
import {establishConnection, getAccount, getProgram, getTransaction} from "./src/utils"
import {sendAndConfirmTransaction} from "@solana/web3.js"

const main = async (): Promise<void> => {
  const connection = await establishConnection()
  const account = await getAccount()
  const programId = await getProgram(connection)
  const transaction = await getTransaction(
    account,
    programId
  )

  let balance = await connection.getBalance(account.publicKey)
  logger.info("Balance before transaction : ", balance)

  const result = await sendAndConfirmTransaction(
    connection,
    transaction,
    [account],
  )

  balance = await connection.getBalance(account.publicKey)
  logger.info("Balance after transaction : ", balance)
  logger.info("Result", result)
}

logger.info("run begins")
main().then(
  _ => {
    logger.info("run succeeds")
    process.exit(0)
  },
  err => {
    logger.error("run fails", err)
    process.exit(-1)
  }
)
