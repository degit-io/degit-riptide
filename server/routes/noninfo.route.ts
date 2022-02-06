import express from "express"
import {postUploadPack} from "../controllers/noninfo.controller"

const router = express.Router({mergeParams: true})
router.post("/git-upload-pack", postUploadPack)

export {
  router as nonInfoRouter
}