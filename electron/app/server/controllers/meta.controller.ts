import {Request, Response} from "express"
import {Config} from "../../config"
import {spawn} from "child_process"
import * as fs from "fs"
import {getFullPath} from "../utils"


export const getTree = async (req: Request, res: Response) => {
  const repoId = req.params.repoId
  const fullPath = getFullPath(`${repoId}.git`)
  console.log(fullPath)

  // Check if directory exists
  if (!fs.existsSync(fullPath)) {
    res.json({})
    return
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
  const fullPath = getFullPath(`${repoId}.git`)
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