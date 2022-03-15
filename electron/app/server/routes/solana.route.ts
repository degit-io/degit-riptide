import * as express from "express"
import {
  getDAO,
  postDAO,
  postInvest,
  postAirdrop,
  postSendSol
} from "../controllers/solana.controller"

const router = express.Router({mergeParams: true})
router.post("/dao", postDAO)
router.get("/dao", getDAO)
router.post("/invest", postInvest)
router.post("/airdrop", postAirdrop)
router.post("/send_sol", postSendSol)

export {
  router as solanaRouter
}