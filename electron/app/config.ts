import os from "os"
import path from "path"
import {PublicKey} from "@solana/web3.js"

export class Config {
  static readonly WINDOW_WIDTH = 1375
  static readonly WINDOW_HEIGHT = 940
  static readonly GIT_SERVER_PORT = 7050
  static readonly META_SERVER_PORT = 7060
  static readonly ROOT_DIR = path.join(os.homedir(), ".degit")
  static readonly DAO_PROGRAM_ID = new PublicKey("GdpVFduwYYdZ3ji1kmaZBthipn6CvDLQ1UtPzKyxm646")
  static readonly TOKEN = new PublicKey("8SYFS1SBDGEeEfz88u2QPz9VwLvmG9nM2nM8YKKsNunG")
  static readonly TOKEN_ACCOUNT = new PublicKey("5bi5Xv7MS14J6Xzf1fM1jkqRGCA1qBBXxcepjBWRN3Qi")
}