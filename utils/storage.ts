export const storage = {
  get: (key: string) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key)
    }
    return null
  },
  set: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value)
    }
  }
}