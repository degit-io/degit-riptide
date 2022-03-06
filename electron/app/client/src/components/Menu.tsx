import React, {useContext} from "react"
import {AuthContext} from "../contexts/auth"
import OpenLogin from "@toruslabs/openlogin"
import {AppConfig} from "../config/Config"
import {Link, useLocation} from "react-router-dom"
import {getED25519Key} from "@toruslabs/openlogin-ed25519"
import {Keypair} from "@solana/web3.js"
import logo from "../assets/logo.png"
import SourceOutlinedIcon from '@mui/icons-material/SourceOutlined';
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined"
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined"
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined"
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import {Wallet} from "./Wallet/Wallet"
import styles from "./Menu.module.scss"

export const Menu = () => {
  const {isAuthenticated, setIsAuthenticated, setKeypair} = useContext(AuthContext)
  const [openWallet, setOpenWallet] = React.useState(false)

  const openLogin = new OpenLogin({
    clientId: AppConfig.openLoginClientId,
    network: AppConfig.openLoginNetwork,
  })
  const location = useLocation()
  const pathName = location.pathname

  const onClickWallet = async () => {
    if (!isAuthenticated) {
      const {privKey} = await openLogin.login()
      if (privKey) {
        const {sk} = getED25519Key(privKey)
        const keypair = Keypair.fromSecretKey(sk)
        setKeypair(keypair)
        setIsAuthenticated(true)
      }
    } else {
      // Show wallet as overlay
      setOpenWallet(true)
    }
  }

  return (
    <div className={styles.MenuContainer}>
      <Wallet open={openWallet} onClose={() => setOpenWallet(false)}/>

      <div className={styles.Logo}>
        <img src={logo} alt="Degit Logo"/>
      </div>

      <Link className={`${styles.MenuItem} ${pathName.startsWith("/repos") ? styles.ActiveMenuItem : ""}`}
            to="/repos"
      >
        <SourceOutlinedIcon fontSize="medium"/>
        <span>Repositories</span>
      </Link>

      <Link className={`${styles.MenuItem} ${pathName.startsWith("/explore") ? styles.ActiveMenuItem : ""}`}
            to="/explore">
        <TravelExploreOutlinedIcon fontSize="medium"/>
        <span>Explore</span>
      </Link>

      <Link className={`${styles.MenuItem} ${pathName.startsWith("/profile") ? styles.ActiveMenuItem : ""}`}
            to="/profile">
        <AccountCircleIcon fontSize="medium"/>
        <span>Profile</span>
      </Link>

      <Link className={`${styles.MenuItem} ${pathName === "/guide" ? styles.ActiveMenuItem : ""}`}
            to="/guide"
      >
        <HelpOutlineOutlinedIcon fontSize="medium"/>
        <span>Guide</span>
      </Link>

      <div className={styles.Grow}>
      </div>

      <div className={styles.CopyRight}>
        © 2022 Degit.io
      </div>

      <div className={styles.CreateWallet}
           onClick={onClickWallet}
      >
        <span>{isAuthenticated ? "My Wallet" : "Create Wallet"}</span>
        <AccountBalanceWalletOutlinedIcon fontSize="medium"/>
      </div>

    </div>
  )
}
