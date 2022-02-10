import express from "express"
import {postService} from "../controllers/noninfo.controller"
import {authMiddleware} from "../middleware/auth.middleware"

const router = express.Router({mergeParams: true})
router.post("/:service", authMiddleware, postService)

export {
  router as nonInfoRouter
}