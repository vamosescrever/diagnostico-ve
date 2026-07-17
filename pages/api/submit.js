import { Resend } from 'resend'
import formidable from 'formidable'
import fs from 'fs'
import { put } from '@vercel/blob'

export const config = { api: { bodyParser: false } }

const resend = new Resend(process.env.RESEND_API_KEY)

const Q_LABELS = {
  q1: '1. Como o time inicia a comunicação em situações de sinistro/negativa',
  q2: '2. Situações que geram retrabalho por conta da comunicação',
  q3: '3. Pontos de maior desafio na escrita para o segurado',
  q4: '4. Avaliação da clareza das comunicações com o segurado (1–5)',
  q5: '5. Como colaboradores novos encontram informações sobre processos',
  q6: '6. Materiais mais consultados e quais geram dúvidas',
  q7: '7. Materiais que o time sente falta',
  q8: '8. Avaliação dos materiais escritos internos (1–5)',
  q9: '9. O que o time vai passar a fazer diferente após o treinamento',
  q10: '10. Situações ou textos específicos para abordar nos encontros',
}

function buildEmailHtml(fields, audioUrls, fileNames) {
  const rosa = '#F83A72'
  const preto = '#111111'

  const rows = Object.entries(Q_LABELS).map(([key, label]) => {
    const val = fields[key] || '—'
    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f0f0f0;vertical-align:top;width:40%;font-size:13px;color:#666;font-weight:600;">${label}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f0f0f0;vertical-align:top;font-size:13px;color:#111;line-height:1.6;">${val.replace(/\n/g, '<br>')}</td>
      </tr>`
  }).join('')

  const audiosHtml = audioUrls.length
    ? `<div style="background:#fff;border-radius:12px;padding:20px 24px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${rosa};margin-bottom:12px;">Áudios gravados</div>
        ${audioUrls.map((url, i) => `
          <div style="margin-bottom:10px;">
            <a href="${url}" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:#F5F4F0;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;color:#111;">
              🎙 Ouvir áudio ${i + 1}
            </a>
          </div>`).join('')}
      </div>`
    : ''

  const extrasHtml = fileNames.length
    ? `<div style="background:#fffbe6;border:1px solid #fce96a;border-radius:8px;padding:14px 16px;margin:0 0 16px;font-size:13px;color:#555;">
        📎 ${fileNames.length} arquivo(s) anexado(s): ${fileNames.join(', ')}
      </div>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Figtree',Helvetica,Arial,sans-serif;background:#F5F4F0;padding:40px 16px;">
  <div style="max-width:640px;margin:0 auto;">
    <div style="background:${preto};border-radius:12px;padding:28px 28px 24px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${rosa};margin-bottom:10px;">Vamos Escrever · Diagnóstico</div>
      <div style="font-size:24px;font-weight:800;color:#fff;margin-bottom:6px;">Novo diagnóstico recebido</div>
      <div style="font-size:14px;color:rgba(255,255,255,.45);">Caixa Residencial × Vamos Escrever</div>
    </div>

    <div style="background:#fff;border-radius:12px;padding:20px 24px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${rosa};margin-bottom:12px;">Respondente</div>
      <div style="font-size:16px;font-weight:700;color:#111;">${fields.nome || '—'}</div>
      <div style="font-size:13px;color:#666;">${fields.cargo || '—'}</div>
    </div>

    ${audiosHtml}
    ${extrasHtml}

    <div style="background:#fff;border-radius:12px;overflow:hidden;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
    </div>

    <div style="text-align:center;font-size:12px;color:#999;margin-top:24px;">
      Vamos Escrever · ve@vamosescrever.com.br · (11) 99869-9936
    </div>
  </div>
</body>
</html>`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = formidable({ maxFileSize: 10 * 1024 * 1024, multiples: true })

  let fields, files
  try {
    ;[fields, files] = await form.parse(req)
  } catch (e) {
    return res.status(400).json({ error: 'Erro ao processar o envio.' })
  }

  const f = {}
  for (const [k, v] of Object.entries(fields)) {
    f[k] = Array.isArray(v) ? v[0] : v
  }

  // Upload áudios para o Vercel Blob e coleta as URLs
  const audioUrls = []
  const audioKeys = Object.keys(files).filter(k => k.startsWith('audio_')).sort()
  for (const key of audioKeys) {
    const file = Array.isArray(files[key]) ? files[key][0] : files[key]
    if (!file?.filepath) continue
    const buffer = fs.readFileSync(file.filepath)
    const idx = parseInt(key.replace('audio_', '')) + 1
    const { url } = await put(
      `diagnostico/${f.nome || 'anonimo'}-audio-${idx}-${Date.now()}.webm`,
      buffer,
      { access: 'private', contentType: 'audio/webm' }
    )
    const proxyUrl = `https://diagnostico-ve.vercel.app/api/audio?url=${encodeURIComponent(url)}`
    audioUrls.push(proxyUrl)
  }

  // Arquivos comuns continuam como anexos
  const attachments = []
  const fileNames = []
  for (const [key, fileArr] of Object.entries(files)) {
    if (key.startsWith('audio_')) continue
    const file = Array.isArray(fileArr) ? fileArr[0] : fileArr
    if (!file?.filepath) continue
    const content = fs.readFileSync(file.filepath).toString('base64')
    const name = file.originalFilename || `arquivo-${key}.bin`
    attachments.push({ filename: name, content })
    fileNames.push(name)
  }

  const html = buildEmailHtml(f, audioUrls, fileNames)

  try {
    await resend.emails.send({
      from: 'diagnostico@vamosescrever.com.br',
      to: 've@vamosescrever.com.br',
      subject: `Diagnóstico recebido — ${f.nome || 'Sem nome'} · Caixa Residencial`,
      html,
      attachments,
    })
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Resend error:', e)
    return res.status(500).json({ error: 'Erro ao enviar email.' })
  }
}
