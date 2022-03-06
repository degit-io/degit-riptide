import os from "os"
import path from "path"

export class Config {
  static readonly WINDOW_WIDTH = 1375
  static readonly WINDOW_HEIGHT = 940
  static readonly GIT_SERVER_PORT = 7050
  static readonly META_SERVER_PORT = 7060
  static readonly ROOT_DIR = path.join(os.homedir(), ".degit")
}