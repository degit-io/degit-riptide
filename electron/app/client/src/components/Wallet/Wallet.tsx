import Dialog from "@mui/material/Dialog"
import styles from "./Wallet.module.scss"
import {useContext, useEffect, useState} from "react"
import {AuthContext} from "../../contexts/auth"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import {Connection} from "@solana/web3.js"
import {AppConfig} from "../../config/Config"

interface WalletProps {
  open: boolean
  onClose: () => void
}

export const Wallet = (props: WalletProps) => {
  const [network, setNetwork] = useState("local")
  const [solBalance, setSolBalance] = useState(0)
  const [degBalance, setDegBalance] = useState(0)
  const {keypair} = useContext(AuthContext)

  const publicKey = keypair?.publicKey.toBase58() || "Error when decoding public key"

  const handleClose = () => {
    props.onClose()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicKey)
  }

  useEffect(() => {
    if (props.open) {
      const getBalance = async () => {
        const connection = new Connection(AppConfig.rpcUrl)
        const balance = await connection.getBalance(keypair!.publicKey)
        const roundedBalance = (balance / 1000000000).toFixed(4)
        setSolBalance(parseFloat(roundedBalance))
      }
      getBalance().then()
    }
  }, [props, keypair])

  return (
    <Dialog onClose={handleClose}
            open={props.open}
    >
      <div className={styles.Container}>
        <div className={styles.Header}>
          <div className={styles.Wallet}>Wallet</div>
          <div className={styles.PublicKeyRow}>
            <div className={styles.PublicKey}>{publicKey}</div>
            <ContentCopyIcon fontSize="small"
                             className={styles.ContentCopyIcon}
                             onClick={handleCopy}
            />
          </div>
        </div>

        <div className={styles.Balance}>
          {solBalance} SOL
        </div>

        <div className={styles.ActionRow}>
          <div className={styles.ActionButton}>Deposit</div>
          <div className={styles.ActionButton}>Send</div>
        </div>

        <div className={styles.Separator}>
        </div>

        <div className={styles.Balance}>
          {degBalance} DEG
        </div>

        <div className={styles.ActionRow}>
          <div className={styles.ActionButton}>Deposit</div>
          <div className={styles.ActionButton}>Send</div>
        </div>

        <div className={styles.Network}>
          Network: {network}
        </div>

      </div>
    </Dialog>
  )
}