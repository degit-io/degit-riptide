import {createContext, Context} from "react"
import OpenLogin from "@toruslabs/openlogin"
import {Keypair} from "@solana/web3.js"
import {AppConfig} from "../config/Config"

interface AuthContextInterface {
  isLoaded: boolean
  isAuthenticated: boolean
  setIsAuthenticated: (isAuthenticated: boolean) => void
  keypair: Keypair | undefined
  setKeypair: (keypair: Keypair | undefined) => void,
  openLogin: OpenLogin
}

export const AuthContext = createContext<AuthContextInterface>({
  isLoaded: false,
  isAuthenticated: false,
  setIsAuthenticated: () => {
  },
  keypair: undefined,
  setKeypair: () => {
  },
  openLogin: new OpenLogin({
    clientId: AppConfig.openLoginClientId,
    network: AppConfig.openLoginNetwork,
  })
})