import express from "express"
import {
  handleGitCmd,
  generateBundle,
  pushToIPFS,
  updateOrbitDB
} from "../controllers/noninfo.controller"

const router = express.Router({mergeParams: true})
router.post(
  "/:service",
  handleGitCmd,
  generateBundle,
  pushToIPFS,
  updateOrbitDB
)

export {
  router as nonInfoRouter
}