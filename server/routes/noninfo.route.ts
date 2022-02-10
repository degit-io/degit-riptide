import express from "express"
import {handleGitCmd} from "../controllers/noninfo.controller"
import {extractAuthInfo} from "../middleware/auth.middleware"
import {
  connectToSolana, createSolanaDataAccount,
  getSolanaAccount,
  getSolanaProgramInfo,
  updateSolanaAccount
} from "../middleware/solana.middleware"

const router = express.Router({mergeParams: true})
router.post(
  "/:service",
  extractAuthInfo,
  connectToSolana,
  getSolanaProgramInfo,
  getSolanaAccount,
  createSolanaDataAccount,
  handleGitCmd,
  updateSolanaAccount
)

export {
  router as nonInfoRouter
}