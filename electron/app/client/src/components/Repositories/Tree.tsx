import styles from "./Tree.module.scss"
import {useParams, Link} from "react-router-dom"
import {useEffect, useState} from "react"
import {AppConfig} from "../../config/Config"
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined"
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined"
import {getTimeFromNow} from "../../functions/time"
import {BlobResponse} from "./Blob"
import ReactMarkdown from "react-markdown"

interface TreeProps {
  repoId: string
  orbitId: string
  publicKey: string
}

interface TreeMeta {
  date: string
  fileName: string
  fileType: string
}

interface TreeResponse {
  files: TreeMeta[]
  hasReadMe: boolean
}

export const Tree = ({repoId, orbitId, publicKey}: TreeProps) => {
  const params = useParams()
  const branch = params.branch || "master"
  const dirName = params["*"]
  const [tree, setTree] = useState<TreeMeta[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasContents, setHasContents] = useState(false)
  const [hasReadMe, setHasReadMe] = useState(false)
  const [readMeBody, setReadMeBody] = useState("")

  useEffect(
    () => {
      let api = `${AppConfig.metaUrl}/meta/${repoId}/tree/${branch}`
      if (dirName !== undefined) {
        api = `${api}/${dirName}`
      }
      api = `${api}?publicKey=${publicKey}&orbitId=${orbitId}`
      fetch(api)
        .then(res => res.json())
        .then((res: TreeResponse) => {
          if (res.files) {
            setHasContents(true)
          }
          setTree(res.files || [])
          setHasReadMe(res.hasReadMe || false)
          setIsLoaded(true)
        })
    },
    [params]
  )

  useEffect(
    () => {
      if (!hasReadMe) {
        return
      }
      let api = `${AppConfig.metaUrl}/meta/${repoId}/blob/${branch}`
      if (dirName !== undefined) {
        api = `${api}/${dirName}`
      }
      api = `${api}README.md`
      fetch(api)
        .then(res => res.json())
        .then((res: BlobResponse) => {
          setReadMeBody(res.body)
        })
    },
    [hasReadMe]
  )

  const fileList = () => {
    return tree.map((item) => {
      const fileName = item.fileName
      const fileType = item.fileType
      const date = Date.parse(item.date)
      const ago = getTimeFromNow(date)
      return (
        <Link to={`${fileType}/${branch}/${fileName}`}
              className={styles.Item}
              key={fileName}
        >
          {
            fileType === "tree" ? <FolderOutlinedIcon/> : <InsertDriveFileOutlinedIcon/>
          }

          <div className={styles.FileName}>
            {fileName}
          </div>

          <div className={styles.LastModified}>
            {ago}
          </div>

        </Link>
      )
    })
  }

  const readMeHeader = () => {
    return (
      <div className={styles.ReadMeHeader}>
        <h1>README.md</h1>
      </div>
    )
  }

  const readMeContainer = () => {
    return (
      <div className={styles.ReadMeContainer}>
        <ReactMarkdown>
          {readMeBody}
        </ReactMarkdown>
      </div>
    )
  }

  const noContentContainer = () => {
    return (
      <div className={styles.NoContentContainer}>
        <div className={styles.InstructionHeader}>
          Create a new repository on the command line
        </div>

        <div className={styles.InstructionCodeBlock}>
          <div>{"echo \"# README\" >> README.md"}</div>
          <div>git init</div>
          <div>git add README.md</div>
          <div>{"git commit -m \"first commit\""}</div>
          <div>{"git branch -M master"}</div>
          <div>{`git remote add origin http://localhost:7050/${repoId}.git`}</div>
          <div>{"git push -u origin master"}</div>
        </div>

        <div className={styles.InstructionHeader}>
          Push an existing repository from the command line
        </div>

        <div className={styles.InstructionCodeBlock}>
          <div>{`git remote add origin http://localhost:7050/${repoId}.git`}</div>
          <div>{"git branch -M master"}</div>
          <div>{"git push -u origin master"}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.Container}>
      {
        isLoaded ? (
          <>
            {
              hasContents
                ? (
                  <div className={styles.FileListContainer}>
                    {fileList()}
                  </div>
                )
                : noContentContainer()
            }
            {
              hasReadMe ? readMeHeader() : null
            }
            {
              hasReadMe ? readMeContainer() : null
            }
          </>
        ) : null
      }
    </div>
  )
}