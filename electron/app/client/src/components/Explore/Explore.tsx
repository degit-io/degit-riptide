import styles from "./Explore.module.scss"
import {useContext, useEffect, useState} from "react"
import {AppConfig} from "../../config/Config"
import {HelperContext} from "../../contexts/Helper.context"
import {Link} from "react-router-dom"

interface Dao {
  repo_name: string
  orbit_id: string
  owner: string
  quorum: number
}

interface DaoResponse {
  success: boolean
  accounts: Dao[]
}

export const Explore = () => {
  const [daos, setDaos] = useState<Dao[]>([])
  const {
    setIsShowProgressBar,
    setOpenSnack,
    setSnackMessage
  } = useContext(HelperContext)

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
      const linkKey= `${dao.orbit_id}/${dao.owner}/${dao.repo_name}`
      return (
        <Link className={styles.DaoRow}
              to={`/repos/${linkKey}`}
              key={linkKey}
        >
          <div className={styles.RepoName}>{dao.repo_name}</div>
          <div className={styles.Owner}>Created By {dao.owner}</div>
        </Link>
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