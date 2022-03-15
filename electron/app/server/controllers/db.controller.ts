import {Request, Response} from "express"
import fs from "fs"
import path from "path"
import {getDegitDir} from "../utils"

export const getRepos = async (req: Request, res: Response) => {
  const publicKey = req.query.publicKey
  if (!publicKey) {
    res.status(400).send("Missing publicKey")
    return
  }

  const orbitId = req.query.orbitId

  let dbName: string
  if (orbitId) {
    dbName = `/orbitdb/${orbitId}/${publicKey}`
  } else {
    dbName = `${publicKey}`
  }

  const orbitdb = req.app.get("orbitdb")
  const db = await orbitdb.keyvalue(dbName)
  await db.load()
  const repos = db.get("repos") || []

  res.json({repos, orbitId: db.address.toString().split("/")[2]})
}

export const postRepos = async (req: Request, res: Response) => {
  const publicKey: string = req.body.publicKey
  if (!publicKey) {
    res.status(400).json({error: "Missing publicKey"})
    return
  }

  const name: string = req.body.name
  if (!name) {
    res.status(400).json({error: "Repo name is required"})
    return
  }
  const description: string = req.body.description
  const payload = {name, description}
  const dbName = publicKey
  const orbitdb = req.app.get("orbitdb")
  const db = await orbitdb.keyvalue(dbName)
  await db.load()

  const repos = db.get("repos") || []
  if (repos) {
    // Check if exist
    for (const r of repos) {
      if (r.name === name) {
        res.status(400).json({error: "Repo already exists"})
        return
      }
    }
  }
  repos.push(payload)
  await db.put("repos", repos)
  res.json({success: true})
}

export const getRepoIpfs = async (req: Request, res: Response) => {
  const orbitdb = req.app.get("orbitdb")
  const publicKey = req.query.publicKey
  const repoId = req.query.repoId
  const orbitId = req.query.orbitId

  let dbName: string
  if (orbitId) {
    dbName = `/orbitdb/${orbitId}/${publicKey}`
  } else {
    dbName = `${publicKey}`
  }

  const db = await orbitdb.keyvalue(dbName)
  await db.load()
  const repo = await db.get(repoId)
  const ipfsReference = await repo?.get("ipfs")
  res.json({success: true, ipfs: ipfsReference})
}

export const getDisplayName = async (req: Request, res: Response) => {
  const orbitdb = req.app.get("orbitdb")
  const publicKey = req.query.publicKey
  if (!publicKey) {
    res.status(400).json({success: false, error: "Missing publicKey"})
    return
  }

  const orbitId = req.query.orbitId
  const dbName = orbitId ? `/orbitdb/${orbitId}/${publicKey}` : publicKey

  try {
    const db = await orbitdb.keyvalue(dbName)
    await db.load()
    const displayName = await db.get("displayName")
    res.json({success: true, displayName})
  } catch (e) {
    res.status(500).json({success: false, error: e.message})
  }
}

export const postDisplayName = async (req: Request, res: Response) => {
  const orbitdb = req.app.get("orbitdb")
  const publicKey = req.body.publicKey
  if (!publicKey) {
    res.status(400).json({error: "Missing publicKey"})
    return
  }
  const displayName = req.body.displayName
  if (!displayName) {
    res.status(400).json({error: "Display name is required"})
    return
  }

  const orbitId = req.body.orbitId
  const dbName = orbitId ? `/orbitdb/${orbitId}/${publicKey}` : publicKey

  try {
    const db = await orbitdb.keyvalue(dbName)
    await db.load()
    await db.put("displayName", displayName)
    res.json({success: true})
  } catch (e) {
    res.status(500).json({success: false, error: e.message})
  }
}

export const getProfile = async (req: Request, res: Response) => {
  const orbitdb = req.app.get("orbitdb")
  const publicKey = req.query.publicKey
  if (!publicKey) {
    res.status(400).json({success: false, error: "Missing publicKey"})
    return
  }

  const orbitId = req.query.orbitId
  const dbName = orbitId ? `/orbitdb/${orbitId}/${publicKey}` : publicKey

  try {
    const db = await orbitdb.keyvalue(dbName)
    await db.load()
    const displayName = await db.get("displayName")
    const repos = await db.get("repos")
    res.json({success: true, displayName, repos})
  } catch (e) {
    res.status(500).json({success: false, error: e.message})
  }
}

export const postPublicKey = async (req: Request, res: Response) => {
  const publicKey = req.body.publicKey
  if (!publicKey) {
    res.status(400).json({error: "Missing publicKey"})
    return
  }
  const filePath = path.join(getDegitDir(), "publicKey")
  fs.writeFileSync(filePath, publicKey)
  res.json({success: true})
}

export const deletePublicKey = async (req: Request, res: Response) => {
  const filePath = path.join(getDegitDir(), "publicKey")
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  res.json({success: true})
}