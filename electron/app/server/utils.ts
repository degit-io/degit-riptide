import os from "os"
import path from "path"
import fs from "fs"
import {Config} from "../config"

export const getDegitDir = () => {
  const homeDir = os.homedir()
  const degitDir = path.join(homeDir, ".degit")
  if (!fs.existsSync(degitDir)) {
    fs.mkdirSync(degitDir)
  }
  return degitDir
}

export const getFullPath = (repo: string,
                            publicKey?: string): string => {
  const homeDir = os.homedir()
  return path.join(homeDir, ".degit", publicKey || getPublicKey(), repo)
}

export const packSideband = (s: string): string => {
  const n = (4 + s.length).toString(16)
  return Array(4 - n.length + 1).join("0") + n + s
}

export const createRootDir = () => {
  if (!fs.existsSync(Config.ROOT_DIR)) {
    fs.mkdirSync(Config.ROOT_DIR)
  }
}

export const getPublicKey = (): string => {
  const publicKey = fs.readFileSync(
    path.join(os.homedir(), ".degit", "publickey")
  )
  return publicKey.toString().trim()
}