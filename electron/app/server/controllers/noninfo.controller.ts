import {spawn} from "child_process"
import {NextFunction, Request, Response} from "express"
import {getFullPath} from "../utils"
import * as IPFS from "ipfs"
import fs from "fs"
import path from "path"
import os from "os"

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

  await new Promise((resolve, _) => {
    child.on("close", resolve)
  })

  res.end()
}

export const generateBundle = async (req: Request, res: Response, next: NextFunction) => {
  const repo = req.params.repository
  const fullPath = getFullPath(repo)

  // Create Git bundle
  const bundle = spawn(
    `cd ${fullPath} && git bundle create ${repo}.bundle --all`,
    {
      shell: true,
    }
  )
  await new Promise((resolve, _) => {
    bundle.on("close", resolve)
  })

  res.locals.bundlePath = `${fullPath}/${repo}.bundle`

  next()
}

export const pushToIPFS = async (req: Request, res: Response, next: NextFunction) => {
  const bundlePath = res.locals.bundlePath
  const ipfs: IPFS.IPFS = req.app.get("ipfs")
  const buffer = fs.readFileSync(bundlePath)
  const result = await ipfs.add(buffer)
  res.locals.ipfsPath = result.path
  next()
}

export const updateOrbitDB = async (req: Request, res: Response, next: NextFunction) => {
  const orbitdb = req.app.get("orbitdb")
  const publicKey = fs.readFileSync(
    path.join(os.homedir(), ".degit", "publickey")
  )
  const repo = req.params.repository

  const dbName = publicKey.toString().trim()
  const db = await orbitdb.open(
    dbName,
    {
      create: true,
      localOnly: false,
      type: "keyvalue",
    }
  )
  await db.load()
  const ipfsPath = res.locals.ipfsPath
  await db.put(repo, {"ipfs": ipfsPath})
  next()
}