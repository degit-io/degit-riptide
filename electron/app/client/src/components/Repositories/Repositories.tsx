import {useContext, useEffect, useState} from "react"
import styles from "./Repositories.module.scss"
import {Link} from "react-router-dom"
import {AppConfig} from "../../config/Config"
import repoEmptyImg from "../../assets/repo.empty.png"
import {AuthContext} from "../../contexts/auth"

interface RepoInterface {
  name: string
  description: string
}

interface ReposResponse {
  repos: RepoInterface[]
}

export const Repositories = () => {
  const {keypair} = useContext(AuthContext)
  const [isLoaded, setIsLoaded] = useState(false)
  const [repos, setRepos] = useState<RepoInterface[]>([])

  useEffect(() => {
    fetch(`${AppConfig.metaUrl}/db/profile/repos`)
      .then(res => res.json())
      .then((res: ReposResponse) => {
        setRepos(res.repos)
        setIsLoaded(true)
      })
  }, [])

  const createNoReposContainer = () => {
    return (
      <div className={styles.NoReposContainer}>
        <div className={styles.NoReposImg}>
          <img src={repoEmptyImg} alt="No repository"/>
        </div>
        <Link className={styles.CreateRepoButton}
              to="./create"
        >
          Create a repository
        </Link>
      </div>
    )
  }

  const renderRepos = () => {
    // Show the latest repo first
    const reposCopy = [...repos].reverse()
    return reposCopy.map(repo => {
      const publicKey = keypair?.publicKey.toBase58() || ""
      return (
        <Link to={`/repos/${publicKey}/${repo.name}`} key={repo.name}>
          <div className={styles.RepoRow}
               key={repo.name}
          >
            <div className={styles.RepoName}>
              {repo.name}
            </div>

            {
              repo.description ?
                <div className={styles.RepoDescription}>
                  {repo.description}
                </div>
                :
                <div className={styles.NoRepoDescription}>
                  No description
                </div>
            }
          </div>
        </Link>
      )
    })
  }

  const createRepoListContainer = () => {
    return (
      <div className={styles.RepoListContainer}>
        <div className={styles.HeaderRow}>
          <div className={styles.Header}>My Repositories</div>
          <Link className={styles.NewRepoButton}
                to={"./create"}
          >
            + New Repository
          </Link>
        </div>

        {renderRepos()}
      </div>
    )
  }

  return (
    <div className={styles.Container}>
      {
        isLoaded ?
          repos.length === 0
            ? createNoReposContainer()
            : createRepoListContainer()
          : null
      }
    </div>
  )
}