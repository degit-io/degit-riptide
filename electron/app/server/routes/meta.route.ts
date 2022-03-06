import * as express from "express"
import {
  getTree,
  getBlob
} from "../controllers/meta.controller"

const router = express.Router({mergeParams: true})
router.get("/:repoId/tree/:branch/*", getTree)
router.get("/:repoId/blob/:branch/*", getBlob)

export {
  router as metaRouter
}