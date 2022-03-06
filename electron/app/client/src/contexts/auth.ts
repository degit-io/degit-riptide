import {createContext, Context} from "react"
import OpenLogin from "@toruslabs/openlogin"
import {Keypair} from "@solana/web3.js"

interface AuthContextInterface {
  isLoaded: boolean
  isAuthenticated: boolean
  setIsAuthenticated: (isAuthenticated: boolean) => void
  keypair: Keypair | undefined
  setKeypair: (keypair: Keypair | undefined) => void
}

export const AuthContext = createContext<AuthContextInterface>({
  isLoaded: false,
  isAuthenticated: false,
  setIsAuthenticated: () => {
  },
  keypair: undefined,
  setKeypair: () => {
  }
})