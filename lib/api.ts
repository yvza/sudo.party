import axios from 'axios'

const instance = axios.create({
  timeout: 10000,
  headers: {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json; charset=utf-8'
  }
});

export const fetcher = async (url: string) => {
  return await instance.get(url).then((res) => {
    if (!res.data) {
      throw Error(res.data.message)
    }

    return res.data
  })
}

export default instance