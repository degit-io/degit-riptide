import {Request, Response, NextFunction} from "express"

export const extractAuthInfo = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization
  if (authorization === null || authorization === undefined) {
    res.setHeader("Content-Type", "text/plain")
    res.setHeader("WWW-Authenticate", "Basic realm=\"authorization needed\"")
    res.status(401)
    res.end("401 Unauthorized")
    return
  }

  let token = Buffer
    .from(authorization.split(" ")[1], "base64")
    .toString("utf-8")
  token = token.substring(0, token.length - 1)

  res.locals.token = token

  next()
}