import {spawn} from "child_process"
import {Request, Response} from "express"
import {getFullPath, packSideband} from "../utils"
import {logger} from "../src/log"


const postUploadPack = async (req: Request, res: Response) => {
  const repo = req.params.repository
  const body: string = req.body
  console.log(body)

  const fullPath = getFullPath(repo)
  const cmd = `git-upload-pack`
  const args = [fullPath]
  const child = spawn(cmd, args)
  let data = ""

  console.log(args)

  for await (const chunk of child.stdout) {
    console.log(chunk.toString())
  }

  // for await (const chunk of child.stderr) {
  //   console.log(chunk.toString())
  // }

  res.end("OK LA")
  // res.header("Content-Type", `application/x-git-${service}-pack-advertisement`)
  // res.write(packSideband(`# service=git-upload-pack` + "\n"))
  // res.write("0000")
  // res.write(data)
  // res.end()
}

export {
  postUploadPack
}

