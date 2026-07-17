export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).end()

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  })

  if (!response.ok) return res.status(404).end()

  res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/webm')
  res.setHeader('Content-Disposition', 'inline')
  res.setHeader('Cache-Control', 'private, max-age=31536000')

  const buffer = await response.arrayBuffer()
  res.send(Buffer.from(buffer))
}
