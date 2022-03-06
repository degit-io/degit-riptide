import styles from "./NewRepo.module.scss"
import {useState} from "react"
import Snackbar from "@mui/material/Snackbar"
import IconButton from "@mui/material/IconButton"
import CloseIcon from "@mui/icons-material/Close"
import {AppConfig} from "../../config/Config"
import {useNavigate} from "react-router-dom"


export const NewRepo = () => {
  const [openSnack, setOpenSnack] = useState(false)
  const [snackMessage, setSnackMessage] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const navigate = useNavigate()

  const handleCloseSnack = (event: any, reason: any) => {
    if (reason === "clickaway") {
      return
    }
    setOpenSnack(false)
  }

  const getSnackBar = () => {
    return (
      <IconButton onClick={() => setOpenSnack(false)}>
        <CloseIcon className={styles.CloseSnackButton} fontSize="small"/>
      </IconButton>
    )
  }

  const onCreateRepo = () => {
    if (!name.trim()) {
      setOpenSnack(true)
      setSnackMessage("Repository name is required")
      return
    }
    fetch(
      `${AppConfig.metaUrl}/db/profile/repos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description
        })
      }
    )
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          setOpenSnack(true)
          setSnackMessage(res.error)
        } else {
          navigate("/repos")
        }
      })

  }

  const onUpdateName = (e: any) => {
    setName(e.target.value)
  }

  const onUpdateDescription = (e: any) => {
    setDescription(e.target.value)
  }

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        Create Repository
      </div>

      <div className={styles.InputBlock}>
        <div className={styles.InputTitle}>Repository name</div>
        <input className={styles.InputField} onChange={onUpdateName}/>
      </div>

      <div className={styles.InputBlock}>
        <div className={styles.InputTitle}>Description (optional)</div>
        <input className={styles.LongInputField} onChange={onUpdateDescription}/>
      </div>

      <div className={styles.CreateButton}
           onClick={onCreateRepo}
      >
        Create
      </div>

      <Snackbar
        open={openSnack}
        autoHideDuration={5000}
        onClose={handleCloseSnack}
        message={snackMessage}
        action={getSnackBar()}
      />

    </div>
  )
}

