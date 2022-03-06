import os from "os"
import path from "path"
import fs from "fs"
import {Config} from "../config"

export const getFullPath = (repo: string): string => {
  const homeDir = os.homedir()
  return path.join(homeDir, ".degit", repo)
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