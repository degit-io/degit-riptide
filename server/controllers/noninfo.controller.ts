import {spawn} from "child_process"
import {NextFunction, Request, Response} from "express"
import {getFullPath} from "../src/utils"

const validServices = ["git-upload-pack", "git-receive-pack"]

export const handleGitCmd = async (req: Request, res: Response, next: NextFunction) => {
  const service = req.params.service
  if (!validServices.includes(service)) {
    res.status(400).send("Invalid service requested")
    return
  }
  await executeCmd(service, req, res)
  next()
}


const executeCmd = async (service: string, req: Request, res: Response) => {
  const repo = req.params.repository
  const body = req.body
  const fullPath = getFullPath(repo)
  const args = ["--stateless-rpc", fullPath]
  const child = spawn(service, args)

  child.stdin.write(body)
  child.stdin.end()

  res.setHeader("content-type", `application/x-${service}-result`)
  res.setHeader("expires", "Fri, 01 Jan 1980 00:00:00 GMT")
  res.setHeader("cache-control", "no-cache, max-age=0, must-revalidate")
  res.setHeader("pragma", "no-cache")
  res.setHeader("connection", "close")

  for await (const chunk of child.stdout) {
    res.write(chunk)
  }
}
