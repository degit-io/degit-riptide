import * as express from "express"
import {
  getDisplayName,
  postDisplayName,
  getRepos,
  postRepos,
  getRepoIpfs
} from "../controllers/db.controller"

const router = express.Router({mergeParams: true})

router.get("/profile/display_name", getDisplayName)
router.post("/profile/display_name", postDisplayName)

router.get("/profile/repos", getRepos)
router.post("/profile/repos", postRepos)

router.get("/profile/repoIPFS", getRepoIpfs)

export {
  router as dbRouter
}