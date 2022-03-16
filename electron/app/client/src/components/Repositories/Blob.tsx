import styles from "./Blob.module.scss"
import {useParams} from "react-router-dom"
import {useEffect, useState} from "react"
import {AppConfig} from "../../config/Config"
import SyntaxHighlighter from "react-syntax-highlighter"
import {docco} from "react-syntax-highlighter/dist/esm/styles/hljs"


interface BlobProps {
  repoId: string
  orbitId: string
  publicKey: string
}

interface CommitInfo {
  message: string
  commitHash: string
}

export interface BlobResponse {
  body: string
  commitInfo: CommitInfo
}

export const Blob = ({repoId, orbitId, publicKey}: BlobProps) => {
  const params = useParams()
  const branch = params.branch
  const fileName = params["*"]
  const [body, setBody] = useState<string>("")
  const [commitInfo, setCommitInfo] = useState<CommitInfo>({
    message: "",
    commitHash: ""
  })

  useEffect(
    () => {
      let api = `${AppConfig.metaUrl}/meta/${repoId}/blob/${branch}/${fileName}`
      api = `${api}?publicKey=${publicKey}&orbitId=${orbitId}`
      fetch(api)
        .then(res => res.json())
        .then((res: BlobResponse) => {
          setBody(res.body)
          setCommitInfo(res.commitInfo)
        })
    },
    [branch, fileName]
  )

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <div className={styles.CommitMessage}>{commitInfo.message}</div>
        <div className={styles.LatestCommit}>Latest commit: {commitInfo.commitHash}</div>
      </div>

      <div className={styles.SubHeader}>
        <div className={styles.FileName}>
          {fileName}
        </div>
      </div>

      <SyntaxHighlighter language="python"
                         style={docco}
                         showLineNumbers={true}
                         className={styles.Code}>
        {body}
      </SyntaxHighlighter>
    </div>
  )
}