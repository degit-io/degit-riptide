interface API {
  send: (channel: string, message?: string) => void;
  receive: (channel: string, callback?: (message?: string) => void) => void;
}

interface WindowAPI extends Window {
  api: API;
}

const windowWithAPI = window as WindowAPI & typeof globalThis

const connectBtnDiv = document.getElementById("connect-btn-div")
connectBtnDiv.addEventListener(
  "click",
  () => {
    windowWithAPI.api.send("onClickConnect")
  }
)

const connectStatus = document.getElementById("connect-status")
connectStatus.innerText = "Not Connected"

windowWithAPI.api.receive(
  "afterClickConnect",
  (message) => {
    if (message === "OK") {
      connectStatus.innerText = "Connected"
    }
  }
)
