import express from "express"
import {getRefs} from "../controllers/info.controller"

const router = express.Router({mergeParams: true})
router.get("/refs", getRefs)

export {
  router as infoRouter
}