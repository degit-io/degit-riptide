import express, {Express} from "express"
import morgan from "morgan"
import {logger} from "./src/log"
import {infoRouter} from "./routes/info.route"
import {nonInfoRouter} from "./routes/noninfo.route"

const configApp = (app: Express) => {
  app.use(morgan("combined"))
  app.use(express.raw({type: "*/*"}))
}

const setRoutes = (app: Express) => {
  app.use("/:repository/info", infoRouter)
  app.use("/:repository", nonInfoRouter)
  app.use("/", (req, res) => res.end("OK"))
}

const startServer = () => {
  const app = express()
  configApp(app)
  setRoutes(app)

  const port = Number(process.env.PORT) || 7050
  app.listen(port)
  logger.info(`Server started on port ${port}`)
}

startServer()