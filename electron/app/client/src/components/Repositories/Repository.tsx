import styles from "./Repository.module.scss"
import {useParams, Routes, Route, Link, useLocation} from "react-router-dom"
import {Proposals} from "./Proposals"
import {Issues} from "./Issues"
import {Settings} from "./Settings"
import {Tree} from "./Tree"
import {Blob} from "./Blob"
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined"

export const Repository = () => {
  const {publicKey, repoId} = useParams()
  const location = useLocation()
  if (!repoId || !publicKey) {
    return (
      <h1>Invalid repository</h1>
    )
  }

  const isOnProposals = location.pathname === `/repos/${repoId}/proposals`
  const proposalsClass = isOnProposals ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

  const isOnIssues = location.pathname === `/repos/${repoId}/issues`
  const issuesClass = isOnIssues ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

  const isOnSettings = location.pathname === `/repos/${repoId}/settings`
  const settingsClass = isOnSettings ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

  const isOnContents = !isOnProposals && !isOnIssues
  const contentsClass = isOnContents ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

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
          <div className={styles.StatusColumn}>
            <div className={styles.StatusKey}>STAR</div>
            <div className={styles.StatusValue}>0</div>
          </div>

          <div className={styles.StatusColumn}>
            <div className={styles.StatusKey}>VIEWS</div>
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
        <Route path="/" element={<Tree repoId={repoId}/>}/>
        <Route path="/blob/:branch/*" element={<Blob repoId={repoId}/>}/>
        <Route path="/tree/:branch/*" element={<Tree repoId={repoId}/>}/>
      </Routes>
    </div>
  )
}