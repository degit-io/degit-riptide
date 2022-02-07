import {spawn} from "child_process"
import {Request, Response} from "express"
import {getFullPath} from "../utils"


const postUploadPack = async (req: Request, res: Response) => {
  const repo = req.params.repository
  const body: string = req.body
  const fullPath = getFullPath(repo)
  const cmd = `git-upload-pack`
  const args = ["--stateless-rpc", fullPath]
  const child = spawn(cmd, args)

  child.stdin.write(body)
  child.stdin.end()

  res.setHeader("content-type", "application/x-git-upload-pack-result")
  res.setHeader("expires", "Fri, 01 Jan 1980 00:00:00 GMT")
  res.setHeader("cache-control", "no-cache, max-age=0, must-revalidate")
  res.setHeader("pragma", "no-cache")
  res.setHeader("connection", "close")

  for await (const chunk of child.stdout) {
    res.write(chunk.toString())
  }

  res.end()
  return
}

export {
  postUploadPack
}

