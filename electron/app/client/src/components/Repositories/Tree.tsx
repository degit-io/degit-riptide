import styles from "./Tree.module.scss"
import {useParams, Link} from "react-router-dom"
import {useEffect, useState} from "react"
import {AppConfig} from "../../config/Config"
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined"
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined"
import {getTimeFromNow} from "../../functions/time"
import {BlobResponse} from "./Blob"
import ReactMarkdown from "react-markdown"
import Select from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import FormControl from "@mui/material/FormControl"

interface TreeProps {
  repoId: string
  orbitId: string
  publicKey: string
}

interface TreeMeta {
  date: string
  commitMsg: string
  fileName: string
  fileType: string
}

interface TreeResponse {
  files: TreeMeta[]
  hasReadMe: boolean
  lastCommitInfo: LastCommit
  branches: string[]
}

interface LastCommit {
  date: string
  message: string
}

export const Tree = ({repoId, orbitId, publicKey}: TreeProps) => {
  const params = useParams()
  const dirName = params["*"]
  const [branch, setBranch] = useState(params.branch || "master")
  const [tree, setTree] = useState<TreeMeta[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasContents, setHasContents] = useState(false)
  const [hasReadMe, setHasReadMe] = useState(false)
  const [readMeBody, setReadMeBody] = useState("")
  const [lastCommit, setLastCommit] = useState<LastCommit>({
    date: "",
    message: "",
  })
  const [branches, setBranches] = useState<string[]>([])

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
          console.log(res)
          setTree(res.files || [])
          setLastCommit(res.lastCommitInfo)
          setBranches(res.branches)
          setHasReadMe(res.hasReadMe || false)
          setIsLoaded(true)
        })
    },
    [params, branch]
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
      api = `${api}README.md?publicKey=${publicKey}&orbitId=${orbitId}`
      fetch(api)
        .then(res => res.json())
        .then((res: BlobResponse) => {
          setReadMeBody(res.body)
        })
    },
    [hasReadMe]
  )

  const fileList = () => {
    // console.log(dirName)
    return tree.map((item) => {
      const fileName = item.fileName
      const fileType = item.fileType
      const commitMsg = item.commitMsg
      const date = Date.parse(item.date)
      const ago = getTimeFromNow(date)
      const filePath = dirName ? `${dirName}/${fileName}` : fileName
      return (
        <Link to={`../${fileType}/${branch}/${filePath}`}
              className={styles.Item}
              key={fileName}
        >
          {
            fileType === "tree" ? <FolderOutlinedIcon/> : <InsertDriveFileOutlinedIcon/>
          }

          <div className={styles.FileName}>
            {fileName}
          </div>

          <div className={styles.CommitMessage}>
            {commitMsg}
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

  const getContentsContainer = () => {
    return (
      <div className={styles.ContentContainer}>
        <FormControl>
          <Select
            value={branch}
            displayEmpty
            className={styles.BranchSelector}
            onChange={(e) => {
              setBranch(e.target.value)
            }}
          >
            {
              branches.map((branch) => {
                return (
                  <MenuItem
                    key={branch}
                    value={branch}
                  >
                    {branch}
                  </MenuItem>
                )
              })
            }
          </Select>
        </FormControl>

        <div className={styles.ContentHeaderRow}>
          <div>{lastCommit.message}</div>
          <div className={styles.LastCommitTime}>{getTimeFromNow(Date.parse(lastCommit.date))}</div>
        </div>

        <div className={styles.FileListContainer}>
          {fileList()}
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
                ? getContentsContainer()
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