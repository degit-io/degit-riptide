import Dialog from "@mui/material/Dialog"
import styles from "./SelectProvider.module.scss"
import {useContext, useState} from "react"
import {AuthContext} from "../../contexts/auth"
import {getED25519Key} from "@toruslabs/openlogin-ed25519"
import {Keypair} from "@solana/web3.js"
import {HelperContext} from "../../contexts/Helper.context"
import {AppConfig} from "../../config/Config"

interface SelectProviderProps {
  open: boolean
  onClose: () => void
}

export const SelectProvider = (props: SelectProviderProps) => {
  const {
    openLogin,
    keypair,
    setKeypair,
    setIsAuthenticated
  } = useContext(AuthContext)

  const {setOpenSnack, setSnackMessage} = useContext(HelperContext)

  const [isKeypairGenerated, setIsKeypairGenerated] = useState(false)

  const handleClose = () => {
    props.onClose()
  }

  const notifyUpdateDegitDirPublicKey = (keypair: Keypair) => {
    fetch(`${AppConfig.metaUrl}/db/profile/publicKey`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey: keypair.publicKey.toBase58(),
        }),
      }
    ).then()
  }

  const onClickWeb3Auth = async () => {
    await openLogin.init()
    handleClose()
    const {privKey} = await openLogin.login()
    if (privKey) {
      const {sk} = getED25519Key(privKey)
      const keypair = Keypair.fromSecretKey(sk)
      setKeypair(keypair)
      setIsAuthenticated(true)
      notifyUpdateDegitDirPublicKey(keypair)
    }
  }

  const onGenerateKeypair = async () => {
    const keypair = Keypair.generate()
    localStorage.setItem(
      "privKey",
      JSON.stringify(Array.from(keypair.secretKey))
    )
    setIsKeypairGenerated(true)
    setKeypair(keypair)
    setIsAuthenticated(true)
    notifyUpdateDegitDirPublicKey(keypair)
  }

  const onImportKeypair = async () => {
    setOpenSnack(true)
    setSnackMessage("Not Implemented")
  }

  const showKeypairInfo = () => {
    if (keypair === undefined) {
      return null
    }

    return (
      <div className={styles.PublicKey}>
        {keypair.publicKey.toBase58()}
      </div>
    )
  }

  return (
    <Dialog onClose={handleClose}
            open={props.open}
    >
      <div className={styles.Container}>
        {
          isKeypairGenerated
            ? showKeypairInfo()
            :
            <>
              <div className={styles.Button} onClick={onClickWeb3Auth}>Create from Web3Auth</div>
              <div className={styles.Button} onClick={onGenerateKeypair}>Generate Keypair</div>
              <div className={styles.Button} onClick={onImportKeypair}>Import Keypair</div>
            </>
        }

      </div>
    </Dialog>
  )
}