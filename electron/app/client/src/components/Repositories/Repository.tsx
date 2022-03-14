import styles from "./Repository.module.scss"
import {useParams, Routes, Route, Link, useLocation} from "react-router-dom"
import {Proposals} from "./Proposals"
import {Issues} from "./Issues"
import {Settings} from "./Settings"
import {Tree} from "./Tree"
import {Blob} from "./Blob"
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined"
import React, {useContext} from "react"
import {AppConfig} from "../../config/Config"
import {AuthContext} from "../../contexts/auth"
import {HelperContext} from "../../contexts/Helper.context"

export const Repository = () => {
  const {orbitId, publicKey, repoId} = useParams()
  const location = useLocation()
  const {keypair} = useContext(AuthContext)
  const {setOpenSnack, setSnackMessage, setIsShowProgressBar} = useContext(HelperContext)

  if (!repoId || !publicKey || !orbitId) {
    return (
      <h1>Invalid repository</h1>
    )
  }

  const isOnProposals = location.pathname.endsWith("proposals")
  const proposalsClass = isOnProposals ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

  const isOnIssues = location.pathname.endsWith("issues")
  const issuesClass = isOnIssues ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

  const isOnSettings = location.pathname.endsWith("settings")
  const settingsClass = isOnSettings ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

  const isOnContents = !isOnProposals && !isOnIssues && !isOnSettings
  const contentsClass = isOnContents ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

  const onClickMakeDAO = () => {
    if (!keypair) {
      setOpenSnack(true)
      setSnackMessage("You need to be logged in to create a DAO")
      return
    }

    setIsShowProgressBar(true)

    fetch(`${AppConfig.metaUrl}/solana/dao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privateKey: Array.from(keypair.secretKey),
          repoName: repoId,
        }),
      }
    ).then((res: Response) => {
      setOpenSnack(true)
      if (res.ok) {
        setSnackMessage("Successfully created DAO")
      } else {
        setSnackMessage("Failed to create DAO")
      }
      setIsShowProgressBar(false)
    }).catch(() => {
      setOpenSnack(true)
      setSnackMessage("Something went wrong")
      setIsShowProgressBar(false)
    })
  }

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <CircleOutlinedIcon className={styles.HeaderCircle}/>

        <div className={styles.RepoInfo}>
          <div className={styles.RepoName}>
            {repoId}
          </div>
          <div className={styles.CreatedBy}>
            Created by {publicKey}
          </div>
        </div>

        <div className={styles.StatusRow}>
          <div className={styles.DAOButton} onClick={onClickMakeDAO}>
            Make DAO
          </div>
          <div className={styles.StatusColumn}>
            <div className={styles.StatusKey}>STAR</div>
            <div className={styles.StatusValue}>0</div>
          </div>
        </div>

      </div>

      <div className={styles.OptionBar}>
        <Link className={contentsClass} to={"./"}>
          CONTENTS
        </Link>
        <Link className={issuesClass} to={"issues"}>
          ISSUES
        </Link>
        <Link className={proposalsClass} to={"proposals"}>
          PROPOSALS
        </Link>
        <Link className={settingsClass} to={"settings"}>
          SETTINGS
        </Link>
      </div>

      <Routes>
        <Route path="proposals" element={<Proposals/>}/>
        <Route path="issues" element={<Issues/>}/>
        <Route path="settings" element={<Settings/>}/>
        <Route path="/" element={<Tree repoId={repoId} orbitId={orbitId} publicKey={publicKey}/>}/>
        <Route path="/blob/:branch/*" element={<Blob repoId={repoId} orbitId={orbitId} publicKey={publicKey}/>}/>
        <Route path="/tree/:branch/*" element={<Tree repoId={repoId} orbitId={orbitId} publicKey={publicKey}/>}/>
      </Routes>
    </div>
  )
}