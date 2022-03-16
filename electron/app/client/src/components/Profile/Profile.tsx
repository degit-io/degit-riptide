import styles from "./Profile.module.scss"
import notSignInImg from "../../assets/profile.not_sign_in.png"
import {useContext, useEffect, useState} from "react"
import {AuthContext} from "../../contexts/auth"
import {AppConfig} from "../../config/Config"
import EditIcon from "@mui/icons-material/Edit"
import {Dialog} from "@mui/material"
import {HelperContext} from "../../contexts/Helper.context"

interface ProfileResponse {
  displayName: string | undefined
  repos: any[] | undefined
}

export const Profile = () => {
  const {isLoaded, isAuthenticated, keypair} = useContext(AuthContext)
  const {setOpenSnack, setSnackMessage} = useContext(HelperContext)
  const [displayName, setDisplayName] = useState("")
  const [allRepoCnt, setAllRepoCnt] = useState(0)
  const [onChainRepoCnt, setOnChainRepoCnt] = useState(0)
  const [totalInvestment, setTotalInvestment] = useState(0)
  const [isEditName, setIsEditName] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState("")

  const updateDisplayName = (displayName: string) => {
    if (keypair === undefined) {
      return
    }

    fetch(`${AppConfig.metaUrl}/db/profile/display_name`, {
      method: "POST",
      body: JSON.stringify({
        displayName,
        publicKey: keypair.publicKey.toBase58()
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(res => {
        if (!res.ok) {
          setOpenSnack(true)
          setSnackMessage("Failed to update display name")
          return
        }
        setDisplayName(displayName)
        setNewDisplayName("")
        setIsEditName(false)
        setOpenSnack(true)
        setSnackMessage("Display name updated")
      })
  }

  const fetchProfileData = () => {
    if (keypair === undefined) {
      return
    }

    let url = `${AppConfig.metaUrl}/db/profile`
    url = `${url}?publicKey=${keypair.publicKey}`
    fetch(url, {
      method: "GET",
    })
      .then(res => res.json())
      .then((res: ProfileResponse) => {
        let displayName = res.displayName
        let repos = res.repos || []
        setDisplayName(displayName || "Not Set")
        setAllRepoCnt(repos.length)
      })
  }

  const fetchOnChainRepo = () => {
    if (keypair === undefined) {
      return
    }
    let url = `${AppConfig.metaUrl}/solana/dao`
    url = `${url}?owner=${keypair.publicKey}`
    fetch(url, {
      method: "GET",
    })
      .then(res => res.json())
      .then(res => {
        const accounts = res.accounts || []
        setOnChainRepoCnt(accounts.length)
      })
  }

  const fetchInvestedAmounts = () => {
    if (keypair === undefined) {
      return
    }
    let url = `${AppConfig.metaUrl}/solana/invested_by_others`
    url = `${url}?owner=${keypair.publicKey}`
    fetch(url, {
      method: "GET",
    })
      .then(res => res.json())
      .then(res => {
        setTotalInvestment(Math.round(res.amount))
      })
  }

  useEffect(() => {
    fetchProfileData()
    fetchOnChainRepo()
    fetchInvestedAmounts()
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
    setIsEditName(true)
  }

  const onConfirmEditName = () => {
    if (!newDisplayName.trim()) {
      setOpenSnack(true)
      setSnackMessage("Display name cannot be empty")
      return
    }
    updateDisplayName(newDisplayName)
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
              <div className={styles.ItemHeader}>Investments By Others</div>
              <div className={styles.ItemValue}>{totalInvestment} DEG</div>
            </div>
          </div>

          <div className={styles.Row}>
            <div className={styles.RowItem}>
              <div className={styles.ItemHeader}>Number of Repositories</div>
              <div className={styles.ItemValue}>{allRepoCnt}</div>
            </div>
            <div className={styles.RowItem}>
              <div className={styles.ItemHeader}>On-chain Repositories</div>
              <div className={styles.ItemValue}>{onChainRepoCnt}</div>
            </div>
          </div>

        </div>

        <Dialog open={isEditName}
                onClose={() => setIsEditName(false)}
        >
          <div className={styles.EditNameContainer}>
            <div>New Display Name</div>
            <input className={styles.EditNameInput}
                   onChange={(e: any) => setNewDisplayName(e.target.value)}
            />
            <div className={styles.ConfirmEditNameButton}
                 onClick={onConfirmEditName}
            >Confirm
            </div>
          </div>
        </Dialog>
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