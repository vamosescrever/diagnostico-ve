import { get } from '@vercel/blob'
import { Readable } from 'stream'

export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).end()

  try {
    const result = await get(url, { access: 'private' })
    if (!result) {
      console.error('Blob not found:', url)
      return res.status(404).end()
    }

    res.setHeader('Content-Type', result.blob.contentType || 'audio/webm')
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'private, max-age=31536000')

    Readable.fromWeb(result.stream).pipe(res)
  } catch (e) {
    console.error('Blob error:', e.message)
    return res.status(500).end()
  }
}
