export const getFullPath = (repo: string): string => {
  return `/Users/manfredcml/IdeaProjects/degit/server/repo/${repo}`
}

export const packSideband = (s: string): string => {
  const n = (4 + s.length).toString(16)
  return Array(4 - n.length + 1).join("0") + n + s
}