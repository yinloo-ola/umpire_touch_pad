export function getOrCreateSessionId() {
  let id = sessionStorage.getItem('umpire-session-id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('umpire-session-id', id)
  }
  return id
}
