import {Request, Response} from "express"

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

export const getRepos = async (req: Request, res: Response) => {
  const profile = req.app.get("profile")
  await profile.load()
  const repos = profile.get("repos") || []
  res.json({repos})
}

export const postRepos = async (req: Request, res: Response) => {
  const name: string = req.body.name
  if (!name) {
    res.status(400).json({error: "Repo name is required"})
    return
  }
  const description: string = req.body.description
  const payload = {name, description}

  const profile = req.app.get("profile")
  await profile.load()

  const repos = profile.get("repos") || []
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
  await profile.put("repos", repos)
  res.json({"success": true})
}
