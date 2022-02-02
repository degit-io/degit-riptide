import {Git} from "./src/git"
import {join} from "path"

const port = 7005

const repos = new Git(join(__dirname, "repo"), {
  autoCreate: true,
})

repos.on("push", (push) => {
  console.log(`push ${push.repo}/${push.commit} ( ${push.branch} )`)
  push.accept()
})

repos.on("fetch", (fetch) => {
  console.log(`fetch ${fetch.commit}`)
  fetch.accept()
})

repos.listen(port, null, () => {
  console.log(`node-git-server running at http://localhost:${port}`)
})