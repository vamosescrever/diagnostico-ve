import Head from 'next/head'
import { useState, useRef } from 'react'

export default function Diagnostico() {
  const [scales, setScales] = useState({})
  const [recordings, setRecordings] = useState([])
  const [files, setFiles] = useState([])
  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [timer, setTimer] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const secondsRef = useRef(0)

  function selectOption(e) {
    const opt = e.currentTarget
    const inp = opt.querySelector('input')
    if (!inp) return
    if (inp.type === 'radio') {
      document.querySelectorAll(`input[name="${inp.name}"]`).forEach(r => {
        r.closest('.d-option').classList.remove('selected')
      })
      inp.checked = true
    } else {
      inp.checked = !inp.checked
    }
    opt.classList.toggle('selected', inp.checked !== false)
  }

  function setScale(q, v) {
    setScales(prev => ({ ...prev, [q]: v }))
  }

  async function toggleRecording() {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mr = new MediaRecorder(stream)
        audioChunksRef.current = []
        mr.ondataavailable = e => audioChunksRef.current.push(e.data)
        mr.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          setRecordings(prev => [...prev, blob])
          stream.getTracks().forEach(t => t.stop())
        }
        mr.start()
        mediaRecorderRef.current = mr
        setIsRecording(true)
        secondsRef.current = 0
        timerRef.current = setInterval(() => {
          secondsRef.current++
          const m = Math.floor(secondsRef.current / 60).toString().padStart(2, '0')
          const s = (secondsRef.current % 60).toString().padStart(2, '0')
          setTimer(`${m}:${s}`)
        }, 1000)
      } catch {
        alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
      }
    } else {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
      setTimer('')
    }
  }

  function deleteRecording(i) {
    setRecordings(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleFiles(fileList) {
    const valid = Array.from(fileList).filter(f => {
      if (f.size > 10 * 1024 * 1024) { alert(`${f.name} é maior que 10MB.`); return false }
      return true
    })
    setFiles(prev => [...prev, ...valid])
  }

  function deleteFile(i) {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  function getChecked(name) {
    if (typeof document === 'undefined') return ''
    const els = document.querySelectorAll(`input[name="${name}"]:checked`)
    return Array.from(els).map(e => e.value).join(', ')
  }

  function getText(id) {
    if (typeof document === 'undefined') return ''
    const el = document.getElementById(id)
    return el ? el.value.trim() : ''
  }

  async function submit() {
    if (!nome.trim()) { document.getElementById('nome-input').focus(); return }
    setSending(true)

    const fd = new FormData()
    fd.append('nome', nome.trim())
    fd.append('cargo', cargo.trim())
    fd.append('q1', getChecked('q1'))
    fd.append('q2', getText('q2'))
    fd.append('q3', getChecked('q3'))
    fd.append('q4', scales.q4 || '')
    fd.append('q5', getChecked('q5'))
    fd.append('q6', getText('q6'))
    fd.append('q7', getText('q7'))
    fd.append('q8', scales.q8 || '')
    fd.append('q9', getText('q9'))
    fd.append('q10', getText('q10'))

    recordings.forEach((blob, i) => {
      fd.append(`audio_${i}`, blob, `audio-${i + 1}.webm`)
    })
    files.forEach((file, i) => {
      fd.append(`file_${i}`, file, file.name)
    })

    try {
      const res = await fetch('/api/submit', { method: 'POST', body: fd })
      if (res.ok) {
        setSubmitted(true)
      } else {
        alert('Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp.')
      }
    } catch {
      alert('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (submitted) {
    return (
      <>
        <Head><title>Diagnóstico enviado · Vamos Escrever</title><link rel="icon" href="/favicon.png" /></Head>
        <style>{css}</style>
        <div className="page">
          <div className="d-success">
            <div className="d-success-icon">✓</div>
            <div className="d-success-title">Diagnóstico recebido, {nome.split(' ')[0]}!</div>
            <div className="d-success-sub">
              O time da Vamos Escrever vai analisar suas respostas antes da anamnese.<br />
              Em breve entraremos em contato para alinhar o próximo passo.
            </div>
          </div>
          <div className="d-footer">
            <strong>Vamos Escrever</strong> · ve@vamosescrever.com.br · (11) 99869-9936
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Diagnóstico de Escrita · Caixa Residencial × Vamos Escrever</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style>{css}</style>

      <div className="page">
        <div className="d-header">
          <div className="d-eyebrow">Vamos Escrever · Material preparatório</div>
          <div className="d-title">Como o seu time<br />escreve <span>hoje?</span></div>
          <div className="d-sub">Diagnóstico rápido · ~15 minutos · respostas ficam com a Vamos Escrever</div>
        </div>

        {/* INTRO */}
        <div className="d-section d-intro">
          <div className="d-q-label" style={{fontSize:'15px',marginBottom:'10px'}}>Antes de começar</div>
          <p>Este diagnóstico tem 10 perguntas sobre como o time da Caixa Residencial se comunica hoje — por escrito, com o segurado e internamente.</p>
          <p>Não há resposta certa ou errada. Quanto mais próximo da realidade, mais útil vai ser: usamos tudo isso para montar o conteúdo do treinamento especificamente para o contexto de vocês.</p>
          <p>Todas as respostas são tratadas com sigilo e ficam exclusivamente com a Vamos Escrever. <strong>Tempo estimado: 15 minutos.</strong></p>
        </div>

        {/* BLOCO 1 */}
        <div className="d-section">
          <div className="d-section-label">Bloco 01</div>
          <div className="d-section-title">Comunicação com o segurado</div>

          <div className="d-question">
            <div className="d-q-label">1. Em situações de sinistro ou negativa, como o time costuma iniciar a comunicação com o segurado?</div>
            <div className="d-options">
              {[
                ['a', 'Usando um modelo padrão, sem muita adaptação'],
                ['b', 'Cada pessoa escreve do seu jeito, conforme entendeu a situação'],
                ['c', 'Há orientações gerais, mas sem padrão claro de linguagem'],
                ['d', 'Não temos um processo definido para isso ainda'],
              ].map(([v, label]) => (
                <label key={v} className="d-option" onClick={selectOption}>
                  <input type="radio" name="q1" value={v} />
                  <div className="d-option-box"></div>
                  <span className="d-option-text">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="d-divider" />

          <div className="d-question">
            <div className="d-q-label">2. Quais situações costumam gerar retrabalho ou dúvidas por conta da comunicação escrita?</div>
            <div className="d-q-hint">Pode ser genérico — não precisa incluir dados do segurado</div>
            <textarea id="q2" className="d-textarea" placeholder="Ex.: quando precisamos explicar uma negativa de cobertura, o segurado não entende e liga de novo pedindo mais explicação..." />
          </div>

          <div className="d-divider" />

          <div className="d-question">
            <div className="d-q-label">3. Em quais destes pontos o time sente mais desafio na hora de escrever para o segurado?</div>
            <div className="d-q-hint">Pode marcar mais de um — marque tudo que fizer sentido</div>
            <div className="d-options">
              {[
                ['a', 'Explicar termos técnicos de seguros de forma simples'],
                ['b', 'Ser claro sem parecer frio ou burocrático'],
                ['c', 'Dar más notícias (negativa, prazo, limitação de cobertura)'],
                ['d', 'Escrever com empatia sem fugir do objetivo'],
                ['e', 'Saber quando usar linguagem mais formal ou mais próxima'],
              ].map(([v, label]) => (
                <label key={v} className="d-option" onClick={selectOption}>
                  <input type="checkbox" name="q3" value={v} />
                  <div className="d-option-box"></div>
                  <span className="d-option-text">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="d-divider" />

          <div className="d-question">
            <div className="d-q-label">4. De forma geral, como você avalia a clareza das comunicações escritas do time com o segurado?</div>
            <div className="d-scale">
              <span className="d-scale-label">Precisa melhorar</span>
              <div className="d-scale-btns">
                {[1,2,3,4,5].map(v => (
                  <button key={v} className={`d-scale-btn${scales.q4 === String(v) ? ' selected' : ''}`} onClick={() => setScale('q4', String(v))}>{v}</button>
                ))}
              </div>
              <span className="d-scale-label">Já funciona bem</span>
            </div>
          </div>
        </div>

        {/* BLOCO 2 */}
        <div className="d-section">
          <div className="d-section-label">Bloco 02</div>
          <div className="d-section-title">Textos internos e materiais de apoio</div>

          <div className="d-question">
            <div className="d-q-label">5. Quando alguém novo no time precisa entender um processo, como costuma encontrar essa informação?</div>
            <div className="d-options">
              {[
                ['a', 'Pergunta para alguém mais experiente da equipe'],
                ['b', 'Consulta um manual ou guia interno'],
                ['c', 'Procura em e-mails ou mensagens anteriores'],
                ['d', 'Vai tentando e aprendendo na prática'],
                ['e', 'Não há um caminho padrão — depende do processo'],
              ].map(([v, label]) => (
                <label key={v} className="d-option" onClick={selectOption}>
                  <input type="radio" name="q5" value={v} />
                  <div className="d-option-box"></div>
                  <span className="d-option-text">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="d-divider" />

          <div className="d-question">
            <div className="d-q-label">6. Quais materiais escritos o time mais consulta no dia a dia — e quais deles costumam gerar dúvidas ou precisam de complemento?</div>
            <div className="d-q-hint">Ex.: FAQ de coberturas, roteiro de atendimento, checklist de sinistro</div>
            <textarea id="q6" className="d-textarea" placeholder="Descreva os materiais e o que não funciona bem neles..." />
          </div>

          <div className="d-divider" />

          <div className="d-question">
            <div className="d-q-label">7. Tem algum material que o time sente falta — algo que não existe ainda ou que está desatualizado?</div>
            <textarea id="q7" className="d-textarea" placeholder="Pode ser um guia, um modelo de texto, um FAQ, um roteiro..." />
          </div>

          <div className="d-divider" />

          <div className="d-question">
            <div className="d-q-label">8. De forma geral, como você avalia os materiais escritos internos do time — tutoriais, guias, FAQs?</div>
            <div className="d-scale">
              <span className="d-scale-label">Precisam melhorar</span>
              <div className="d-scale-btns">
                {[1,2,3,4,5].map(v => (
                  <button key={v} className={`d-scale-btn${scales.q8 === String(v) ? ' selected' : ''}`} onClick={() => setScale('q8', String(v))}>{v}</button>
                ))}
              </div>
              <span className="d-scale-label">Já funcionam bem</span>
            </div>
          </div>
        </div>

        {/* BLOCO 3 */}
        <div className="d-section">
          <div className="d-section-label">Bloco 03</div>
          <div className="d-section-title">Expectativas com o treinamento</div>

          <div className="d-question">
            <div className="d-q-label">9. Depois do treinamento, o que você quer que o time passe a fazer diferente? Descreva uma situação do dia a dia.</div>
            <div className="d-q-hint">Não precisa ser uma lista de objetivos — pense em um momento concreto que hoje gera dificuldade</div>
            <textarea id="q9" className="d-textarea" placeholder="Ex.: quando o segurado pede explicação de uma negativa, quero que o time consiga responder por escrito com clareza, sem precisar escalar para o supervisor..." />
          </div>

          <div className="d-divider" />

          <div className="d-question">
            <div className="d-q-label">10. Tem algum tipo de texto, situação ou dificuldade específica que você gostaria que a gente trabalhasse nos encontros?</div>
            <textarea id="q10" className="d-textarea" placeholder="Pode ser uma dificuldade recorrente, um formato de texto, um processo específico..." />
          </div>
        </div>

        {/* ÁUDIO + UPLOAD */}
        <div className="d-section">
          <div className="d-section-label">Complemento opcional</div>
          <div className="d-section-title">Prefere falar? Grave um áudio</div>

          <div className="d-question">
            <div className="d-q-label">Às vezes é mais fácil falar do que escrever. Se tiver algum contexto que não coube nas perguntas anteriores, fique à vontade para gravar aqui.</div>
            <div className="d-audio-wrap">
              <div className="d-audio-hint">Direto do navegador — sem instalar nada. Pode gravar mais de um áudio.</div>
              <div className="d-audio-controls">
                <button className={`d-rec-btn${isRecording ? ' recording' : ''}`} onClick={toggleRecording}>
                  <div className="d-rec-dot"></div>
                  {isRecording ? 'Parar gravação' : recordings.length > 0 ? 'Gravar outro' : 'Gravar áudio'}
                </button>
                {timer && <span className="d-rec-timer">{timer}</span>}
              </div>
              <div className="d-recordings">
                {recordings.map((blob, i) => (
                  <div key={i} className="d-rec-item">
                    <span style={{fontSize:'14px',color:'var(--rosa)'}}>🎙</span>
                    <audio controls src={URL.createObjectURL(blob)} />
                    <button className="d-del-btn" onClick={() => deleteRecording(i)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="d-divider" />

          <div className="d-question">
            <div className="d-q-label">Quer anexar algum material? (exemplos de textos, documentos, prints)</div>
            <div className="d-q-hint">PDF · Word · Imagem — máx. 10MB por arquivo</div>
            <div
              className="d-upload-area"
              onClick={() => document.getElementById('file-input').click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag') }}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag'); handleFiles(e.dataTransfer.files) }}
              onDragLeave={e => e.currentTarget.classList.remove('drag')}
            >
              <div className="d-upload-icon">↑</div>
              <div className="d-upload-text">Clique para selecionar ou arraste aqui</div>
              <div className="d-upload-hint-text">PDF · Word · Imagem · até 10MB por arquivo</div>
            </div>
            <input type="file" id="file-input" style={{display:'none'}} multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => handleFiles(e.target.files)} />
            <div className="d-files-list">
              {files.map((f, i) => (
                <div key={i} className="d-file-item">
                  <span style={{color:'var(--rosa)'}}>📄</span>
                  <span className="d-file-name">{f.name}</span>
                  <span className="d-file-size">{(f.size/1024).toFixed(0)} KB</span>
                  <button className="d-del-btn" onClick={() => deleteFile(i)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ENVIO */}
        <div className="d-submit-area">
          <div className="d-submit-title">Tudo pronto?</div>
          <div className="d-submit-sub">Suas respostas vão diretamente para o time da Vamos Escrever e entram na personalização do conteúdo antes da anamnese.</div>
          <div className="d-field">
            <label>Seu nome</label>
            <input id="nome-input" type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Como quer que a gente te chame" />
          </div>
          <div className="d-field">
            <label>Cargo / área</label>
            <input type="text" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex.: Gerente de RH, Coordenador de Operações..." />
          </div>
          <button className="d-submit-btn" onClick={submit} disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar diagnóstico →'}
          </button>
        </div>

        <div className="d-footer">
          <strong>Vamos Escrever</strong> · ve@vamosescrever.com.br · (11) 99869-9936
        </div>
      </div>
    </>
  )
}

const css = `
  :root { --rosa:#F83A72; --amarelo:#FCBB2C; --verde:#3E9D96; --preto:#111111; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Figtree',sans-serif; background:#F5F4F0; color:#111; min-height:100vh; padding:40px 16px 80px; }
  .page { max-width:680px; margin:0 auto; }
  .d-header { background:#111; border-radius:16px; padding:32px 32px 28px; margin-bottom:24px; }
  .d-eyebrow { font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--rosa); margin-bottom:12px; }
  .d-title { font-size:30px; font-weight:800; color:#fff; line-height:1.15; margin-bottom:8px; }
  .d-title span { color:var(--rosa); }
  .d-sub { font-size:14px; color:rgba(255,255,255,.4); }
  .d-section { background:#fff; border:0.5px solid rgba(0,0,0,.1); border-radius:14px; padding:26px; margin-bottom:16px; }
  .d-intro p { font-size:13.5px; color:#555; line-height:1.75; margin-bottom:10px; }
  .d-intro p:last-child { margin-bottom:0; }
  .d-section-label { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--rosa); margin-bottom:5px; }
  .d-section-title { font-size:18px; font-weight:700; color:#111; margin-bottom:22px; }
  .d-question { margin-bottom:22px; }
  .d-question:last-child { margin-bottom:0; }
  .d-q-label { font-size:14px; font-weight:600; color:#111; margin-bottom:6px; line-height:1.5; }
  .d-q-hint { font-size:12px; color:#999; margin-bottom:10px; }
  .d-options { display:flex; flex-direction:column; gap:7px; }
  .d-option { display:flex; align-items:flex-start; gap:10px; cursor:pointer; padding:11px 13px; border-radius:10px; border:1px solid rgba(0,0,0,.1); background:#F5F4F0; transition:border-color .15s,background .15s; user-select:none; }
  .d-option:hover { border-color:rgba(0,0,0,.2); }
  .d-option.selected { border-color:var(--rosa); background:rgba(248,58,114,.06); }
  .d-option input { display:none; }
  .d-option-box { width:17px; height:17px; border:1.5px solid rgba(0,0,0,.2); border-radius:4px; flex-shrink:0; margin-top:1px; display:flex; align-items:center; justify-content:center; transition:all .15s; background:#fff; }
  .d-option.selected .d-option-box { background:var(--rosa); border-color:var(--rosa); }
  .d-option.selected .d-option-box::after { content:''; width:8px; height:8px; background:#fff; border-radius:2px; display:block; }
  .d-option-text { font-size:13.5px; color:#555; line-height:1.5; }
  textarea.d-textarea { width:100%; min-height:90px; resize:vertical; border:1px solid rgba(0,0,0,.1); border-radius:10px; padding:11px 13px; font-size:13.5px; font-family:'Figtree',sans-serif; color:#111; background:#F5F4F0; outline:none; transition:border-color .15s; line-height:1.6; }
  textarea.d-textarea:focus { border-color:var(--rosa); }
  textarea.d-textarea::placeholder { color:#999; }
  .d-scale { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:4px; }
  .d-scale-label { font-size:12px; color:#999; }
  .d-scale-btns { display:flex; gap:6px; }
  .d-scale-btn { width:40px; height:40px; border:1px solid rgba(0,0,0,.18); border-radius:10px; background:#F5F4F0; font-size:14px; font-weight:600; color:#555; cursor:pointer; font-family:'Figtree',sans-serif; transition:all .15s; }
  .d-scale-btn:hover { border-color:var(--rosa); color:var(--rosa); }
  .d-scale-btn.selected { background:var(--rosa); border-color:var(--rosa); color:#fff; }
  .d-divider { height:1px; background:rgba(0,0,0,.08); margin:22px 0; }
  .d-audio-wrap { border:1px solid rgba(0,0,0,.1); border-radius:12px; padding:18px; background:#F5F4F0; }
  .d-audio-hint { font-size:12px; color:#999; margin-bottom:12px; }
  .d-audio-controls { display:flex; align-items:center; gap:10px; }
  .d-rec-btn { display:flex; align-items:center; gap:8px; padding:9px 16px; border-radius:10px; border:1px solid rgba(0,0,0,.18); background:#fff; font-size:13px; font-weight:600; cursor:pointer; color:#111; font-family:'Figtree',sans-serif; transition:all .15s; }
  .d-rec-btn::before { content:''; width:9px; height:9px; border-radius:50%; background:rgba(0,0,0,.2); flex-shrink:0; }
  .d-rec-btn.recording { background:rgba(248,58,114,.08); border-color:var(--rosa); color:var(--rosa); }
  .d-rec-btn.recording::before { background:var(--rosa); animation:blink 1s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
  .d-rec-timer { font-size:13px; color:#999; font-variant-numeric:tabular-nums; }
  .d-recordings { margin-top:12px; display:flex; flex-direction:column; gap:8px; }
  .d-rec-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:10px; background:#fff; border:1px solid rgba(0,0,0,.1); }
  .d-rec-item audio { flex:1; height:30px; min-width:0; }
  .d-del-btn { background:none; border:none; cursor:pointer; color:#999; font-size:14px; padding:2px 4px; transition:color .15s; }
  .d-del-btn:hover { color:var(--rosa); }
  .d-upload-area { border:1.5px dashed rgba(0,0,0,.18); border-radius:12px; padding:24px; text-align:center; background:#F5F4F0; cursor:pointer; transition:all .15s; }
  .d-upload-area:hover,.d-upload-area.drag { border-color:var(--rosa); background:rgba(248,58,114,.05); }
  .d-upload-icon { font-size:22px; color:#999; margin-bottom:8px; }
  .d-upload-text { font-size:13.5px; color:#555; font-weight:500; margin-bottom:4px; }
  .d-upload-hint-text { font-size:12px; color:#999; }
  .d-files-list { margin-top:10px; display:flex; flex-direction:column; gap:6px; }
  .d-file-item { display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:10px; background:#fff; border:1px solid rgba(0,0,0,.1); font-size:13px; color:#555; }
  .d-file-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .d-file-size { font-size:11px; color:#999; white-space:nowrap; }
  .d-submit-area { background:#fff; border:0.5px solid rgba(0,0,0,.1); border-radius:14px; padding:28px; }
  .d-submit-title { font-size:16px; font-weight:700; color:#111; margin-bottom:6px; }
  .d-submit-sub { font-size:13.5px; color:#555; margin-bottom:22px; line-height:1.6; }
  .d-field { margin-bottom:12px; }
  .d-field label { display:block; font-size:11px; color:#999; margin-bottom:5px; text-transform:uppercase; letter-spacing:.08em; font-weight:700; }
  .d-field input { width:100%; height:42px; border:1px solid rgba(0,0,0,.1); border-radius:10px; padding:0 13px; font-size:14px; font-family:'Figtree',sans-serif; background:#F5F4F0; color:#111; outline:none; transition:border-color .15s; }
  .d-field input:focus { border-color:var(--rosa); }
  .d-field input::placeholder { color:#999; }
  .d-submit-btn { width:100%; height:48px; background:var(--rosa); border:none; border-radius:12px; color:#fff; font-size:15px; font-weight:700; cursor:pointer; font-family:'Figtree',sans-serif; margin-top:20px; transition:opacity .15s; }
  .d-submit-btn:hover { opacity:.9; }
  .d-submit-btn:disabled { opacity:.45; cursor:not-allowed; }
  .d-success { background:#fff; border:0.5px solid rgba(0,0,0,.1); border-radius:14px; padding:56px 28px; text-align:center; margin-bottom:24px; }
  .d-success-icon { font-size:40px; color:var(--verde); margin-bottom:16px; }
  .d-success-title { font-size:22px; font-weight:800; color:#111; margin-bottom:10px; }
  .d-success-sub { font-size:14px; color:#555; line-height:1.7; }
  .d-footer { text-align:center; margin-top:32px; font-size:12px; color:#999; }
  .d-footer strong { color:#555; }
`
