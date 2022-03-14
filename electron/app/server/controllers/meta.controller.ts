import {Request, Response} from "express"
import {spawn} from "child_process"
import * as fs from "fs"
import * as IPFS from "ipfs"
import {getDegitDir, getFullPath, getPublicKey} from "../utils"

const downloadGitBundleFromIPFS = async (req: Request,
                                         repoId: string,
                                         publicKey: string,
                                         orbitId: string,
                                         fullPath: string) => {
  const orbitdb = req.app.get("orbitdb")

  const dbName = `/orbitdb/${orbitId}/${publicKey}`
  const db = await orbitdb.keyvalue(dbName)
  await db.load()

  const record = await db.get(`${repoId}.git`)
  const ipfsRef = record.ipfs
  const ipfs: IPFS.IPFS = req.app.get("ipfs")
  const chunks: Uint8Array[] = []
  for await (const chunk of ipfs.cat(ipfsRef)) {
    chunks.push(chunk)
  }
  const concat = Buffer.concat(chunks)
  fs.writeFileSync(`${fullPath}.bundle`, concat)
  const unbundle = spawn(
    `cd ${getDegitDir()}/${publicKey} && git clone ${fullPath}.bundle && rm ${fullPath}.bundle`,
    {
      shell: true,
    }
  )
  await new Promise((resolve, _) => {
    unbundle.on("close", resolve)
  })
}

export const getTree = async (req: Request, res: Response) => {
  const repoId = req.params.repoId
  const publicKey = req.query.publicKey ?? getPublicKey()
  const orbitId = req.query.orbitId
  const fullPath = getFullPath(`${repoId}.git`, publicKey as string)

  // Check if directory exists. If not, download from IPFS
  if (!fs.existsSync(fullPath)) {
    try {
      await downloadGitBundleFromIPFS(
        req,
        repoId,
        publicKey as string,
        orbitId as string,
        fullPath
      )
    } catch (e) {
      res.status(500).send({"error": e})
      return
    }
  }

  process.chdir(fullPath)

  const branch = req.params.branch
  if (branch === undefined) {
    res.status(400).json({error: "branch is required"})
    return
  }

  const dirName = req.params["0"]
  let fullDirName = branch
  if (dirName) {
    fullDirName = `${fullDirName}:${dirName}`
  }

  // Get all file types
  const lsTree = spawn(
    `cd ${fullPath} && git ls-tree ${fullDirName}`,
    {
      shell: true,
    }
  )

  let chunkString = ""
  for await (const chunk of lsTree.stdout) {
    chunkString += chunk.toString()
  }
  await new Promise((resolve, _) => {
    lsTree.on("close", resolve)
  })

  let chunkArr = chunkString
    .trim()
    .split("\n")

  const fileTypeMap = new Map<string, string>()
  for (const c of chunkArr) {
    const split = c.replace("\t", " ").split(" ")
    const fileType = split[1]
    const fileName = split[3]
    fileTypeMap.set(fileName, fileType)
  }

  // Get last update
  const target = dirName ? `${dirName}/$filename` : "$filename"
  const gitLog = spawn(
    `cd ${fullPath} && git ls-tree --name-only ${fullDirName} | ` +
    "while read filename; " +
    `do echo \"$(git log -1 --format=\"%ad\" -- ${target}) | $filename\"; ` +
    "done",
    {
      shell: true,
    }
  )
  chunkString = ""
  for await (const chunk of gitLog.stdout) {
    chunkString += chunk.toString()
  }
  await new Promise((resolve, _) => {
    gitLog.on("close", resolve)
  })
  chunkArr = chunkString
    .trim()
    .split("\n")

  const response: any[] = []
  let hasReadMe = false
  for (const c of chunkArr) {
    const split = c.split(" | ")
    const date = split[0]
    const fileName = split[1]
    const fileType = fileTypeMap.get(fileName)
    if (fileName === "README.md") {
      hasReadMe = true
    }
    response.push({
      date,
      fileName,
      fileType,
    })
  }

  res.json({files: response, hasReadMe})
}

export const getBlob = async (req: Request, res: Response) => {
  const repoId = req.params.repoId
  const publicKey = (req.query.publicKey ?? getPublicKey()) as string
  const orbitId = req.query.orbitId as string
  const fullPath = getFullPath(`${repoId}.git`, publicKey)

  // Check if directory exists. If not, download from IPFS
  if (!fs.existsSync(fullPath)) {
    try {
      await downloadGitBundleFromIPFS(
        req,
        repoId,
        publicKey,
        orbitId,
        fullPath
      )
    } catch (e) {
      res.status(500).send({"error": e})
      return
    }
  }

  process.chdir(fullPath)

  const branch = req.params.branch
  const fileName = req.params["0"]

  const gitShow = spawn(
    `git show ${branch}:${fileName}`,
    {
      shell: true,
    }
  )

  let chunkString = ""
  for await (const chunk of gitShow.stdout) {
    chunkString += chunk.toString()
  }
  await new Promise((resolve, _) => {
    gitShow.on("close", resolve)
  })

  res.json({"body": chunkString})
}