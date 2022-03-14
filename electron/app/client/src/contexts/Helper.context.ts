import {createContext} from "react"

interface HelperContextInterface {
  snackMessage: string
  setSnackMessage: (message: string) => void
  openSnack: boolean
  setOpenSnack: (open: boolean) => void
  isShowProgressBar: boolean
  setIsShowProgressBar: (isShow: boolean) => void
}

export const HelperContext = createContext<HelperContextInterface>({
  snackMessage: "",
  setSnackMessage: (message: string) => {
  },
  openSnack: false,
  setOpenSnack: (open: boolean) => {
  },
  isShowProgressBar: false,
  setIsShowProgressBar: (isShow: boolean) => {
  }
})