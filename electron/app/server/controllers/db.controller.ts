import {Request, Response} from "express"

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
    dbName = `/orbitdb/${orbitId}/${publicKey}.${repoId}`
  } else {
    dbName = `${publicKey}.${repoId}`
  }

  const db = await orbitdb.keyvalue(dbName)
  await db.load()
  const ipfsReference: string = await db.get("ipfs")
  res.json({success: true, ipfs: ipfsReference})
}

export const getDisplayName = async (req: Request, res: Response) => {
  const profile = req.app.get("profile")
  await profile.load()
  const displayName = await profile.get("displayName")
  res.json({displayName})
}

export const postDisplayName = async (req: Request, res: Response) => {
  const profile = req.app.get("profile")
  const displayName = req.body.displayName
  if (!displayName) {
    res.status(400).json({error: "Display name is required"})
    return
  }
  await profile.load()
  await profile.put("displayName", displayName)
  res.json({displayName})
}