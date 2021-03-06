import {Request, Response} from "express"
import {spawn} from "child_process"
import * as fs from "fs"
import * as IPFS from "ipfs"
import {getDegitDir, getFullPath, getPublicKey} from "../utils"
import path from "path"

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

  // Create directory if not exists
  const dir = path.join(getDegitDir(), publicKey)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

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

  // Get last commit info
  const lastCommit = spawn(
    `cd ${fullPath} && ` +
    `echo \"$(git log ${branch} -1 --pretty=format:%s) | $(git log ${branch} -1 --pretty=format:%ad)\"`,
    {
      shell: true,
    }
  )
  chunkString = ""
  for await (const chunk of lastCommit.stdout) {
    chunkString += chunk.toString()
  }
  await new Promise((resolve, _) => {
    lastCommit.on("close", resolve)
  })

  const chunkSplit = chunkString.trim().split(" | ")
  const lastCommitInfo = {
    message: chunkSplit[0],
    date: chunkSplit[1],
  }

  // Get all branches
  const gitBranches = spawn(
    `cd ${fullPath} && git for-each-ref --format='%(refname:short)' refs/heads/`,
    {
      shell: true,
    }
  )
  chunkString = ""
  for await (const chunk of gitBranches.stdout) {
    chunkString += chunk.toString()
  }
  await new Promise((resolve, _) => {
    gitBranches.on("close", resolve)
  })

  const branches = chunkString.trim().split("\n")

  // Get status of each file
  const target = dirName ? `${dirName}/$filename` : "$filename"
  const gitLogByFile = spawn(
    `cd ${fullPath} && git ls-tree --name-only ${fullDirName} | ` +
    "while read filename; " +
    `do echo \"$(git log ${branch} -n 1 --pretty=format:%s -- ${target}) | ` +
    `$(git log ${branch} -n 1 --pretty=format:%ad -- ${target}) | $filename\"; ` +
    "done",
    {
      shell: true,
    }
  )
  chunkString = ""
  for await (const chunk of gitLogByFile.stdout) {
    chunkString += chunk.toString()
  }
  await new Promise((resolve, _) => {
    gitLogByFile.on("close", resolve)
  })
  chunkArr = chunkString
    .trim()
    .split("\n")

  const response: any[] = []
  let hasReadMe = false
  for (const c of chunkArr) {
    const split = c.split(" | ")
    const commitMsg = split[0]
    const date = split[1]
    const fileName = split[2]
    const fileType = fileTypeMap.get(fileName)
    if (fileName === "README.md") {
      hasReadMe = true
    }
    response.push({
      date,
      commitMsg,
      fileName,
      fileType,
    })
  }

  res.json({files: response, hasReadMe, lastCommitInfo, branches})
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

  // Get commit info
  const gitLog = spawn(
    `git log ${branch} -1 --pretty=format:\"%s | %h\"`,
    {
      shell: true,
    }
  )
  let chunkString = ""
  for await (const chunk of gitLog.stdout) {
    chunkString += chunk.toString()
  }
  await new Promise((resolve, _) => {
    gitLog.on("close", resolve)
  })
  const chunkSplit = chunkString.trim().split(" | ")
  const commitInfo = {
    message: chunkSplit[0],
    commitHash: chunkSplit[1],
  }

  // Get blob content
  const gitShow = spawn(
    `git show ${branch}:${fileName}`,
    {
      shell: true,
    }
  )

  chunkString = ""
  for await (const chunk of gitShow.stdout) {
    chunkString += chunk.toString()
  }
  await new Promise((resolve, _) => {
    gitShow.on("close", resolve)
  })

  res.json({body: chunkString, commitInfo})
}