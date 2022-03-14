import express, {Express} from "express"
import morgan from "morgan"
import {metaRouter} from "./routes/meta.route"
import {Config} from "../config"
import {infoRouter} from "./routes/info.route"
import {nonInfoRouter} from "./routes/noninfo.route"
import {solanaRouter} from "./routes/solana.route"
import cors from "cors"
import {dbRouter} from "./routes/db.route"
import * as IPFS from "ipfs"
import OrbitDB from "orbit-db"
import {Connection} from "@solana/web3.js"
import fs from "fs"
import path from "path"
import os from "os"

let ipfs: IPFS.IPFS
let orbitdb: any
let profile: any
let solana: Connection

export const initMetaServer = (): Express => {
  const server = express()
  server.use(cors())
  server.use(morgan("combined"))
  server.use(express.json())
  server.use("/meta", metaRouter)
  server.use("/db", dbRouter)
  server.use("/solana", solanaRouter)
  server.use("/", (req, res) => res.end("Meta OK"))
  return server
}

export const initGitServer = (): Express => {
  const server = express()
  server.use(morgan("combined"))
  server.use(express.raw({type: "*/*"}))
  server.use("/:repository/info", infoRouter)
  server.use("/:repository", nonInfoRouter)
  server.use("/", (req, res) => res.end("Git OK"))
  return server
}

export const initIPFSServer = async (): Promise<IPFS.IPFS> => {
  return await IPFS.create()
}

// For testing
const testServer = async () => {
  ipfs = await IPFS.create()
  orbitdb = await OrbitDB.createInstance(ipfs)
  solana = new Connection(
    "http://localhost:8899",
    "confirmed"
  )

  const metaServer = initMetaServer()
  metaServer.set("orbitdb", orbitdb)
  metaServer.set("solana", solana)
  metaServer.set("ipfs", ipfs)
  metaServer.listen(Config.META_SERVER_PORT)

  const gitServer = initGitServer()
  gitServer.set("orbitdb", orbitdb)
  gitServer.set("ipfs", ipfs)
  gitServer.listen(Config.GIT_SERVER_PORT)
}

testServer().then()