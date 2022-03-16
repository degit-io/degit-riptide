import Dialog from "@mui/material/Dialog"
import styles from "./Wallet.module.scss"
import {useContext, useEffect, useState} from "react"
import {AuthContext} from "../../contexts/auth"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import {Connection, LAMPORTS_PER_SOL} from "@solana/web3.js"
import {AppConfig} from "../../config/Config"
import {HelperContext} from "../../contexts/Helper.context"

interface WalletProps {
  open: boolean
  onClose: () => void
}

export const Wallet = (props: WalletProps) => {
  const [network, setNetwork] = useState("devnet")
  const [solBalance, setSolBalance] = useState(0)
  const [degBalance, setDegBalance] = useState(0)
  const [isSendSol, setIsSendSol] = useState(false)
  const [sendSolPubKey, setSendSolPubKey] = useState("")
  const [sendSolAmount, setSendSolAmount] = useState("")
  const {
    keypair,
    openLogin,
    setKeypair,
    setIsAuthenticated
  } = useContext(AuthContext)
  const {setOpenSnack, setSnackMessage} = useContext(HelperContext)

  const handleClose = () => {
    props.onClose()
  }

  const handleCopy = async () => {
    if (keypair === undefined) {
      return
    }
    await navigator.clipboard.writeText(keypair.publicKey.toBase58())
  }

  const notifyDeleteDegitDirPublicKey = () => {
    if (keypair === undefined) {
      return
    }
    fetch(`${AppConfig.metaUrl}/db/profile/publicKey`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      }
    ).then()
  }

  const onSignOut = async () => {
    await openLogin.init()
    await openLogin.logout()
    localStorage.removeItem("privKey")
    setKeypair(undefined)
    setIsAuthenticated(false)
    notifyDeleteDegitDirPublicKey()
    handleClose()
  }

  const onExportPrivateKey = async () => {
    if (keypair === undefined) {
      return
    }
    const privKey = Array.from(keypair.secretKey)

    // Download as JSON
    const blob = new Blob(
      [JSON.stringify(privKey)],
      {type: "application/json"}
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "private_key.json"
    document.body.appendChild(link)
    link.click()
  }

  const onAirDrop = async () => {
    if (keypair === undefined) {
      return
    }
    fetch(`${AppConfig.metaUrl}/solana/airdrop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        publicKey: keypair.publicKey.toBase58()
      })
    })
      .then(res => {
          setOpenSnack(true)
          if (!res.ok) {
            setSnackMessage("Request airdrop failed")
            return
          }
          setSnackMessage("Airdrop success")
        }
      )
  }

  const onSendSolana = async () => {
    setIsSendSol(true)
  }

  const onUpdateSendSolanaPubKey = (e: any) => {
    setSendSolPubKey(e.target.value)
  }

  const onUpdateSendSolanaAmount = (e: any) => {
    setSendSolAmount(e.target.value)
  }

  const onConfirmSendSolana = () => {
    if (!sendSolPubKey || !sendSolAmount) {
      setOpenSnack(true)
      setSnackMessage("Please fill all fields")
      return
    }

    const amount = Number(sendSolAmount)
    if (!amount) {
      setOpenSnack(true)
      setSnackMessage("Invalid amount")
      return
    }

    if (keypair === undefined) {
      setOpenSnack(true)
      setSnackMessage("Something went wrong. Please refresh.")
      return
    }

    fetch(`${AppConfig.metaUrl}/solana/send_sol`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fromPublicKey: keypair.publicKey.toBase58(),
        toPublicKey: sendSolPubKey,
        signerPrivKey: Array.from(keypair.secretKey),
        amount
      })
    })
      .then(res => {
          if (!res.ok) {
            res.json().then(data => {
              setOpenSnack(true)
              setSnackMessage(`Transfer failed - ${data.error}`)
            })
            return
          }
          setOpenSnack(true)
          setSnackMessage("Transfer success")
        }
      )
  }

  const getDegBalance = () => {
    if (keypair === undefined) {
      return
    }

    fetch(`${AppConfig.metaUrl}/solana/deg?publicKey=${keypair.publicKey.toBase58()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
    })
      .then(res => {
          if (!res.ok) {
            res.json().then(data => {
              setOpenSnack(true)
              setSnackMessage(`Get balance failed - ${data.error}`)
            })
            return
          }
          res.json().then(data => {
            setDegBalance(Math.round(data.balance))
          })
        }
      )
  }

  useEffect(() => {
    if (props.open) {
      if (keypair === undefined) {
        return
      }
      const getSolBalance = async () => {
        const connection = new Connection(AppConfig.rpcUrl)
        const balance = await connection.getBalance(keypair!.publicKey)
        const roundedBalance = (balance / LAMPORTS_PER_SOL).toFixed(4)
        setSolBalance(parseFloat(roundedBalance))
      }
      getSolBalance().then()
      getDegBalance()
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
            <div className={styles.PublicKey}>{keypair ? keypair.publicKey.toBase58() : ""}</div>
            <ContentCopyIcon fontSize="small"
                             className={styles.ContentCopyIcon}
                             onClick={handleCopy}
            />
          </div>
          <div className={styles.ExportButton}
               onClick={onExportPrivateKey}
          >
            Export Private Key
          </div>
        </div>

        <div className={styles.Balance}>
          {solBalance} SOL
        </div>

        <div className={styles.ActionRow}>
          <div className={styles.ActionButton} onClick={onAirDrop}>Airdrop</div>
          <div className={styles.ActionButton} onClick={onSendSolana}>Send</div>
        </div>

        <div className={styles.Separator}>
        </div>

        <div className={styles.Balance}>
          {degBalance} DEG
        </div>

        <div className={styles.BottomRow}>
          <div className={styles.Network}>
            Network: {network}
          </div>

          <div className={styles.SignOutButton} onClick={onSignOut}>
            SIGN OUT
          </div>
        </div>

      </div>

      <Dialog open={isSendSol}
              onClose={() => setIsSendSol(false)}>
        <div className={styles.SendSolanaContainer}>
          <div>Recipient Public Key</div>
          <input className={styles.SendSolanaInput} onChange={onUpdateSendSolanaPubKey}/>
          <div>Amount</div>
          <input className={styles.SendSolanaInput} onChange={onUpdateSendSolanaAmount}/>
          <div className={styles.ConfirmSendSolanaButton}
               onClick={onConfirmSendSolana}
          >
            Confirm
          </div>
        </div>
      </Dialog>

    </Dialog>
  )
}