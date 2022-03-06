import express from "express"
import {handleGitCmd} from "../controllers/noninfo.controller"

const router = express.Router({mergeParams: true})
router.post(
  "/:service",
  handleGitCmd
)

export {
  router as nonInfoRouter
}