import React, {useEffect, useState} from "react"
import {BrowserRouter as Router} from "react-router-dom"
import {AuthContext} from "./contexts/auth"
import styles from "./App.module.scss"
import OpenLogin from "@toruslabs/openlogin"
import {AppConfig} from "./config/Config"
import {getED25519Key} from "@toruslabs/openlogin-ed25519"
import {Keypair} from "@solana/web3.js"
import {Menu} from "./components/Menu"
import {PageRoute} from "./components/PageRoute"

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [keypair, setKeypair] = useState<Keypair | undefined>(undefined)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  const openLogin = new OpenLogin({
    clientId: AppConfig.openLoginClientId,
    network: AppConfig.openLoginNetwork,
  })

  useEffect(() => {
    openLogin
      .init()
      .then(
        () => {
          const privKey = openLogin.privKey
          if (!privKey) {
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
          setKeypair
        }}
      >
        <div className={styles.Container}>
          <Menu/>
          <div className={styles.Page}>
            <PageRoute/>
          </div>
        </div>
      </AuthContext.Provider>
    </Router>
  )
}

export default App
