import styles from "./Profile.module.scss"
import notSignInImg from "../../assets/profile.not_sign_in.png"
import {useContext, useEffect, useState} from "react"
import {AuthContext} from "../../contexts/auth"
import {AppConfig} from "../../config/Config"
import EditIcon from "@mui/icons-material/Edit"

interface ProfileResponse {
  displayName: string | undefined
}

export const Profile = () => {
  const {isLoaded, isAuthenticated, keypair} = useContext(AuthContext)
  const [displayName, setDisplayName] = useState("")

  const updateDisplayName = (displayName: string) => {
    fetch(`${AppConfig.metaUrl}/db/profile/display_name`, {
      method: "POST",
      body: JSON.stringify({displayName}),
      headers: {
        "Content-Type": "application/json",
      },
    }).then()
  }

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    fetch(`${AppConfig.metaUrl}/db/profile/display_name`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((res: ProfileResponse) => {
        let displayName = res.displayName
        if (displayName === undefined) {
          displayName = keypair!.publicKey.toBase58().substring(0, 10)
          updateDisplayName(displayName)
        }
        setDisplayName(displayName)
      })
  }, [isAuthenticated, keypair])

  const createNotSignInContainer = () => {
    return (
      <div className={styles.NotSignInContainer}>
        <div className={styles.NotSignInImg}>
          <img src={notSignInImg} alt="Not yet sign in"/>
        </div>
        <div className={styles.AskSignInText}>
          Create a wallet first to set up your profile!
        </div>
      </div>
    )
  }

  const onEditDisplayName = () => {
    console.log("onEditDisplayName")
  }

  const createSignedInContainer = () => {
    return (
      <div className={styles.SignedInContainer}>
        <div className={styles.Header}>Profile</div>

        <div className={styles.Widget}>

          <div className={styles.Row}>
            <div className={styles.RowItem}>
              <div className={styles.ItemHeader}>Display Name</div>
              <div className={styles.RowWithinItem}>
                <div className={styles.ItemValue}>{displayName}</div>
                <EditIcon className={styles.EditDisplayNameIcon} onClick={onEditDisplayName}/>
              </div>
            </div>
            <div className={styles.RowItem}>
              <div className={styles.ItemHeader}>Rewards Earned</div>
              <div className={styles.ItemValue}>0 DEG</div>
            </div>
          </div>

          <div className={styles.Row}>
            <div className={styles.RowItem}>
              <div className={styles.ItemHeader}>Private Repositories</div>
              <div className={styles.ItemValue}>0</div>
            </div>
            <div className={styles.RowItem}>
              <div className={styles.ItemHeader}>Public Repositories</div>
              <div className={styles.ItemValue}>0</div>
            </div>
          </div>

        </div>

      </div>
    )
  }

  return (
    <div className={styles.Container}>
      {
        isLoaded ?
          isAuthenticated ?
            createSignedInContainer()
            :
            createNotSignInContainer()
          :
          null
      }
    </div>
  )
}