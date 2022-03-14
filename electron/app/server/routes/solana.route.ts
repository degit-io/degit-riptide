import * as express from "express"
import {
  getDAO,
  postDAO,
  postInvest,
} from "../controllers/solana.controller"

const router = express.Router({mergeParams: true})
router.post("/dao", postDAO)
router.get("/dao", getDAO)
router.post("/invest", postInvest)

export {
  router as solanaRouter
}