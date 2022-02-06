import {spawn} from "child_process"
import {Request, Response} from "express"
import {getFullPath, packSideband} from "../utils"


const getRefs = async (req: Request, res: Response) => {
  const repo = req.params.repository
  const service = req.query.service
  if (typeof service !== "string") {
    res.status(400).send("Invalid service")
    return
  }

  switch (service) {
    case "git-upload-pack":
      await handlePack("upload", repo, res)
      return
    case "git-receive-pack":
      await handlePack("receive", repo, res)
      return
    default:
      res.status(400).send("Invalid service")
      return
  }
}

const handlePack = async (service: string, repo: string, res: Response) => {
  const fullPath = getFullPath(repo)
  const cmd = `git-${service}-pack`
  const args = [fullPath]
  const child = spawn(cmd, args)
  let data = ""
  for await (const chunk of child.stdout) {
    const s = chunk.toString()
    data += s
    if (s.endsWith("0000")) {
      break
    }
  }
  res.header("Content-Type", `application/x-git-${service}-pack-advertisement`)
  res.write(packSideband(`# service=git-${service}-pack` + "\n"))
  res.write("0000")
  res.write(data)
  res.end()
}

export {
  getRefs
}
