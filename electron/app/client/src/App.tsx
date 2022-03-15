import React, {useEffect, useState} from "react"
import {BrowserRouter as Router} from "react-router-dom"
import {AuthContext} from "./contexts/auth"
import {HelperContext} from "./contexts/Helper.context"
import styles from "./App.module.scss"
import OpenLogin from "@toruslabs/openlogin"
import {AppConfig} from "./config/Config"
import {getED25519Key} from "@toruslabs/openlogin-ed25519"
import {Keypair} from "@solana/web3.js"
import {Menu} from "./components/Menu"
import {PageRoute} from "./components/PageRoute"
import Snackbar from "@mui/material/Snackbar"
import IconButton from "@mui/material/IconButton"
import CloseIcon from "@mui/icons-material/Close"
import LinearProgress from "@mui/material/LinearProgress"

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [keypair, setKeypair] = useState<Keypair | undefined>(undefined)
  const [snackMessage, setSnackMessage] = useState("")
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [openSnack, setOpenSnack] = useState(false)
  const [isShowProgressBar, setIsShowProgressBar] = useState(false)
  const openLogin = new OpenLogin({
    clientId: AppConfig.openLoginClientId,
    network: AppConfig.openLoginNetwork,
  })

  const handleCloseSnack = (event: any, reason: any) => {
    if (reason === "clickaway") {
      return
    }
    setOpenSnack(false)
  }

  const getSnackBar = () => {
    return (
      <IconButton onClick={() => setOpenSnack(false)}>
        <CloseIcon className={styles.CloseSnackButton} fontSize="small"/>
      </IconButton>
    )
  }

  useEffect(() => {
    openLogin
      .init()
      .then(
        () => {
          const privKey = openLogin.privKey
          if (!privKey) {
            // Check local storage
            const privKey = localStorage.getItem("privKey")
            if (privKey) {
              const parsed = JSON.parse(privKey)
              setKeypair(Keypair.fromSecretKey(Buffer.from(parsed)))
              setIsAuthenticated(true)
              setIsLoaded(true)
            }
            return
          }
          const {sk} = getED25519Key(privKey)
          const keypair = Keypair.fromSecretKey(sk)
          setKeypair(keypair)
          setIsAuthenticated(true)
          setIsLoaded(true)
        }
      )
  }, [])

  return (
    <Router>
      <AuthContext.Provider
        value={{
          isLoaded,
          isAuthenticated,
          setIsAuthenticated,
          keypair,
          setKeypair,
          openLogin
        }}
      >
        <HelperContext.Provider value={{
          snackMessage,
          setSnackMessage,
          openSnack,
          setOpenSnack,
          isShowProgressBar,
          setIsShowProgressBar
        }}>
          <div className={styles.Container}>
            <Menu/>
            <div className={styles.Page}>
              <PageRoute/>
            </div>
          </div>

          <Snackbar
            open={openSnack}
            autoHideDuration={5000}
            onClose={handleCloseSnack}
            message={snackMessage}
            action={getSnackBar()}
          />

          <div className={styles.ProgressBar} hidden={!isShowProgressBar}>
            <LinearProgress classes={{
              colorPrimary: styles.ColorPrimary,
              barColorPrimary: styles.BarColorPrimary
            }}/>
          </div>

        </HelperContext.Provider>
      </AuthContext.Provider>

    </Router>
  )
}

export default App
