import styles from "./NewRepo.module.scss"
import {useContext, useState} from "react"
import {AppConfig} from "../../config/Config"
import {useNavigate} from "react-router-dom"
import {AuthContext} from "../../contexts/auth"
import {HelperContext} from "../../contexts/Helper.context"


export const NewRepo = () => {
  const {keypair} = useContext(AuthContext)
  const {setOpenSnack, setSnackMessage} = useContext(HelperContext)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const navigate = useNavigate()

  const onCreateRepo = () => {
    if (!name.trim()) {
      setOpenSnack(true)
      setSnackMessage("Repository name is required")
      return
    }

    if (keypair === undefined) {
      setOpenSnack(true)
      setSnackMessage("You are not logged in")
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
          description,
          publicKey: keypair.publicKey.toBase58(),
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

    </div>
  )
}

