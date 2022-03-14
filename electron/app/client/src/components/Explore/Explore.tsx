import styles from "./Explore.module.scss"
import {useContext, useEffect, useState} from "react"
import {AppConfig} from "../../config/Config"
import {HelperContext} from "../../contexts/Helper.context"

interface Dao {
  git_ref: string
  owner: string
  quorum: number
}

interface DaoResponse {
  success: boolean
  accounts: Dao[]
}

export const Explore = () => {
  const [daos, setDaos] = useState<Dao[]>([])
  const {setIsShowProgressBar, setOpenSnack, setSnackMessage} = useContext(HelperContext)

  useEffect(() => {
    setIsShowProgressBar(true)

    fetch(`${AppConfig.metaUrl}/solana/dao`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      }
    )
      .then((res: Response) => res.json())
      .then((res: DaoResponse) => {
        if (!res.success) {
          setOpenSnack(true)
          setSnackMessage("Failed to fetch DAOs")
          setIsShowProgressBar(false)
          return
        }
        const accounts = res.accounts
        setDaos(accounts)
        setIsShowProgressBar(false)
      }).catch(() => {
      setOpenSnack(true)
      setSnackMessage("Something went wrong")
      setIsShowProgressBar(false)
    })
  }, [])

  const getDaoRow = () => {
    return daos.map((dao: Dao) => {
      return (
        <div className={styles.DaoRow}>
          <div className={styles.RepoName}>{dao.git_ref}</div>
          <div className={styles.Owner}>Created By {dao.owner}</div>
        </div>
      )
    })
  }

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        Explore
      </div>

      <div className={styles.DaoContainer}>
        {getDaoRow()}
      </div>
    </div>
  )
}