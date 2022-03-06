import styles from "./Blob.module.scss"
import {useParams} from "react-router-dom"
import {useEffect, useState} from "react"
import {AppConfig} from "../../config/Config"
import SyntaxHighlighter from "react-syntax-highlighter"
import {docco} from "react-syntax-highlighter/dist/esm/styles/hljs"


interface BlobProps {
  repoId: string
}

export interface BlobResponse {
  body: string
}

export const Blob = ({repoId}: BlobProps) => {
  const params = useParams()
  const branch = params.branch
  const fileName = params["*"]
  const [body, setBody] = useState<string>("")

  useEffect(
    () => {
      const api = `${AppConfig.metaUrl}/meta/${repoId}/blob/${branch}/${fileName}`
      fetch(api)
        .then(res => res.json())
        .then((res: BlobResponse) => {
          setBody(res.body)
        })
    },
    [branch, fileName]
  )

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <div className={styles.PublicKey}>Public Key</div>
        <div className={styles.CommitMessage}>Commit Message Placeholder</div>
        <div className={styles.LatestCommit}>Latest commit: 417cfdc</div>
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