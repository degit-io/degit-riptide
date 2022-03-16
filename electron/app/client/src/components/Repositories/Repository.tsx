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
import {Dialog} from "@mui/material"

export const Repository = () => {
  const {orbitId, publicKey, repoId} = useParams()
  const location = useLocation()
  const {keypair} = useContext(AuthContext)
  const {setOpenSnack, setSnackMessage, setIsShowProgressBar} = useContext(HelperContext)
  const [promptInvestAmount, setPromptInvestAmount] = React.useState(false)
  const [investAmount, setInvestAmount] = React.useState("")

  if (!repoId || !publicKey || !orbitId) {
    return (
      <h1>Invalid repository</h1>
    )
  }

  const isOnProposals = location.pathname.endsWith("proposals")
  const proposalsClass = isOnProposals ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

  const isOnContents = !isOnProposals
  const contentsClass = isOnContents ? `${styles.Option} ${styles.ActiveOption}` : styles.Option

  const onClickMakeDAO = () => {
    if (keypair === undefined) {
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
          orbitId,
        }),
      }
    ).then(res => res.json())
      .then((res: any) => {
        setOpenSnack(true)
        if (res.success) {
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

  const confirmInvest = () => {
    if (keypair === undefined) {
      setOpenSnack(true)
      setSnackMessage("You need to have a wallet to invest")
      return
    }
    const amount = Number(investAmount)
    if (isNaN(amount) || amount <= 0) {
      setOpenSnack(true)
      setSnackMessage("Invalid amount")
      return
    }

    fetch(`${AppConfig.metaUrl}/solana/invest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privateKey: Array.from(keypair.secretKey),
          repoName: repoId,
          orbitId,
          amount,
          publicKey
        }),
      }
    ).then(res => {
      if (res.ok) {
        setOpenSnack(true)
        setSnackMessage("Successfully invested")
      } else {
        setOpenSnack(true)
        setSnackMessage("Failed to invest")
      }
      setPromptInvestAmount(false)
    })
  }

  const onClickInvest = () => {
    if (keypair === undefined) {
      setOpenSnack(true)
      setSnackMessage("You need to have a wallet to invest")
      return
    }
    setPromptInvestAmount(true)
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
          {
            keypair?.publicKey.toBase58() === publicKey
              ?
              <div className={styles.DAOButton} onClick={onClickMakeDAO}>
                Make DAO
              </div>
              :
              <div className={styles.DAOButton} onClick={onClickInvest}>
                Invest
              </div>
          }
        </div>

      </div>

      <div className={styles.OptionBar}>
        <Link className={contentsClass} to={"./"}>
          CONTENTS
        </Link>
        <Link className={proposalsClass} to={"proposals"}>
          PROPOSALS
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

      <Dialog open={promptInvestAmount}
              onClose={() => setPromptInvestAmount(false)}
      >
        <div className={styles.PromptInvestContainer}>
          <div>Investment Amount (DEG)</div>
          <input className={styles.PromptInvestInput}
                 onChange={(e: any) => setInvestAmount(e.target.value)}/>
          <div className={styles.PromptInvestConfirm}
               onClick={confirmInvest}>CONFIRM
          </div>
        </div>
      </Dialog>
    </div>
  )
}