import {spawn} from "child_process"
import {Request, Response} from "express"
import {getFullPath, packSideband} from "../utils"
import fs from "fs"


export const getRefs = async (req: Request, res: Response) => {
  const repo = req.params.repository
  const service = req.query.service
  if (typeof service !== "string") {
    res.status(400).send("Invalid service")
    return
  }

  switch (service) {
    case "git-upload-pack":
      await executeCmd("upload", repo, res)
      return
    case "git-receive-pack":
      await executeCmd("receive", repo, res)
      return
    default:
      res.status(400).send("Invalid service")
      return
  }
}

const createBareRepo = async (fullPath: string): Promise<number> => {
  if (fs.existsSync(fullPath)) {
    return 0
  }
  const cmd = "git"
  const child = spawn(
    cmd,
    ["init", "--bare", fullPath]
  )

  return await new Promise((resolve, _) => {
    child.on("close", resolve)
  })
}

const executeCmd = async (service: string, repo: string, res: Response) => {
  const fullPath = getFullPath(repo)

  const exitCode = await createBareRepo(fullPath)
  if (exitCode !== 0) {
    res.status(500).send("Failed to create bare repo")
    return
  }

  const cmd = `git-${service}-pack`
  const args = ["--stateless-rpc", "--advertise-refs", fullPath]
  const child = spawn(cmd, args)

  res.setHeader("Content-Type", `application/x-git-${service}-pack-advertisement`)
  res.setHeader("expires", "Fri, 01 Jan 1980 00:00:00 GMT")
  res.setHeader("pragma", "no-cache")
  res.setHeader("cache-control", "no-cache, max-age=0, must-revalidate")

  res.write(packSideband(`# service=git-${service}-pack` + "\n"))
  res.write("0000")

  for await (const chunk of child.stdout) {
    res.write(chunk)
  }

  await new Promise((resolve, _) => {
    child.on("close", resolve)
  })

  res.end()
}
