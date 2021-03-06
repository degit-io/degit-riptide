import * as express from "express"
import {
  getDisplayName,
  postDisplayName,
  getRepos,
  postRepos,
  getRepoIpfs,
  getProfile,
  postPublicKey,
  deletePublicKey
} from "../controllers/db.controller"

const router = express.Router({mergeParams: true})

router.get("/profile", getProfile)
router.get("/profile/display_name", getDisplayName)
router.post("/profile/display_name", postDisplayName)

router.get("/profile/repos", getRepos)
router.post("/profile/repos", postRepos)

router.get("/profile/repoIPFS", getRepoIpfs)
router.post("/profile/publicKey", postPublicKey)
router.delete("/profile/publicKey", deletePublicKey)

export {
  router as dbRouter
}