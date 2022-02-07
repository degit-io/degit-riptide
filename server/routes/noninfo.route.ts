import express from "express"
import {postService} from "../controllers/noninfo.controller"

const router = express.Router({mergeParams: true})
router.post("/:service", postService)

export {
  router as nonInfoRouter
}