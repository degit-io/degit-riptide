import {Guide} from "./Guide/Guide"
import {Repositories} from "./Repositories/Repositories"
import {PageNotFound} from "./PageNotFound"
import React from "react"
import {Route, Routes, Navigate} from "react-router-dom"
import {Repository} from "./Repositories/Repository"
import {Explore} from "./Explore/Explore"
import {Profile} from "./Profile/Profile"
import {NewRepo} from "./Repositories/NewRepo"

export const PageRoute = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/repos"/>}/>
      <Route path="repos/*" element={<RepositoryRoutes/>}/>
      <Route path="guide" element={<Guide/>}/>
      <Route path="explore" element={<Explore/>}/>
      <Route path="profile" element={<Profile/>}/>
      <Route path="*" element={<PageNotFound/>}/>
    </Routes>
  )
}

const RepositoryRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Repositories/>}/>
      <Route path="/create" element={<NewRepo/>}/>
      <Route path=":publicKey/:repoId/*" element={<Repository/>}/>
    </Routes>
  )
}