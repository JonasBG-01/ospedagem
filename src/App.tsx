import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowDownToLine, ArrowLeft, ArrowRight, Bell, Box,
  Check, CheckCheck, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
  ClipboardList, Clock3, Download, FileSpreadsheet, Image, Layers3, LogOut,
  Menu, MessageCircle, MoreHorizontal, PackageCheck, Plus, Search, Send,
  Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Upload, UserRound,
  Users, X, ZoomIn, ZoomOut, ScanLine, Camera, Flashlight, Paperclip,
} from 'lucide-react'

type Role = 'guest' | 'user' | 'admin'
type Page = 'search' | 'packaging' | 'chat' | 'admin'
type AdminTab = 'items' | 'alerts' | 'packaging' | 'similar' | 'users' | 'titles'
type Item = { code: string; title: string; image?: string }
type AlertEntry = { id: string; type: 'standard' | 'claim'; title: string; description: string; codes: string[]; active: boolean; image?: string }
type Packaging = { id: string; code: string; title: string; description: string; image?: string }
type SimilarGroup = { id: string; name: string; codes: string[]; max: number }
type ChatMessage = { id: string; sender: string; role: Role; content: string; kind: 'message' | 'request'; time: string; done?: boolean; attachment?: string }
type UserEntry = { name: string; email: string; role: Role; status: string }

const starterItems: Item[] = [
  { code: '4172-04-00', title: 'Suporte do conjunto de transmissão', image: 'drawing' },
  { code: '4172-04-01', title: 'Suporte lateral esquerdo', image: 'drawing' },
  { code: 'AX-2084', title: 'Eixo de acionamento', image: 'drawing' },
  { code: 'PL-1092', title: 'Placa de fixação', image: '' },
]
const starterAlerts: AlertEntry[] = [
  { id: 'a1', type: 'claim', title: 'Trinca próximo ao furo de fixação', description: 'Inspecionar a região do furo antes de liberar. Segregar qualquer peça com sinal de trinca e comunicar a qualidade.', codes: ['4172-04-00', '4172-04-01'], active: true, image: 'drawing' },
  { id: 'a2', type: 'standard', title: 'Revisão de rebarba', description: 'Remover rebarbas da borda externa antes da embalagem.', codes: ['4172-04-00'], active: true },
]
const starterPackaging: Packaging[] = [
  { id: 'p1', code: '4172-04-00', title: 'Caixa individual · 12 peças', description: 'Proteger cada peça com manta. Acomodar 12 unidades por caixa, sem empilhar peças soltas.' },
  { id: 'p2', code: '4172-04-01', title: 'Separador de papelão', description: 'Usar separador entre camadas. Máximo de 8 peças por caixa.' },
]
const starterGroups: SimilarGroup[] = [
  { id: 's1', name: 'Suportes da transmissão', codes: ['4172-04-00', '4172-04-01'], max: 3 },
]
const starterMessages: ChatMessage[] = [
  { id: 'm1', sender: 'Mariana Costa', role: 'admin', content: 'Bom dia, equipe! A revisão do suporte 4172-04-00 já está disponível.', kind: 'message', time: '09:18' },
  { id: 'm2', sender: 'Rafael Lima', role: 'user', content: 'Precisamos confirmar o separador correto para o lote de hoje.', kind: 'request', time: '09:32' },
  { id: 'm3', sender: 'Mariana Costa', role: 'admin', content: 'Padrão atualizado: usar manta individual e 12 peças por caixa.', kind: 'message', time: '09:41' },
]
const starterUsers: UserEntry[] = [
  { name: 'Mariana Costa', email: 'mariana@empresa.com', role: 'admin', status: 'Ativo' },
  { name: 'Rafael Lima', email: 'rafael@empresa.com', role: 'user', status: 'Pendente' },
  { name: 'Ana Souza', email: 'ana@empresa.com', role: 'user', status: 'Ativo' },
]

function readStorage<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key)
  return saved ? JSON.parse(saved) as T : fallback
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback))
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue] as const
}

function DrawingPreview({ compact = false, style }: { compact?: boolean; style?: React.CSSProperties }) {
  return (
    <div className={`drawing-preview${compact ? ' drawing-compact' : ''}`} style={style}>
      <div className="drawing-toolbar"><span>DESENHO TÉCNICO · REV. C</span><span>ISO 2768-m</span></div>
      <svg viewBox="0 0 640 400" role="img" aria-label="Ilustração técnica da peça">
        <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#273344" strokeWidth=".55" /></pattern></defs>
        <rect width="640" height="400" fill="url(#grid)" />
        <g fill="none" stroke="#c3d0dc" strokeWidth="2">
          <path d="M142 246h40l15-85h58l12 85h38l14-85h59l14 85h52v29H142z" />
          <path d="M181 246v30m43-115v-32h63v32m41 115v30m42-145v-32h64v32m41 115v30" />
          <circle cx="235" cy="254" r="13" /><circle cx="366" cy="254" r="13" />
          <path d="M116 289h360M124 300h344M156 147h70m50 0h90m51 0h46" strokeDasharray="5 5" />
          <path d="M137 135v-19m341 19v-19M137 122h341m-341-5 9 5-9 5m341-10-9 5 9 5" stroke="#74a9d8" strokeWidth="1.3" />
          <path d="M184 180l-50-35m50 35 14-50m198 48 53-32m-53 32 17-49" stroke="#74a9d8" strokeWidth="1.3" />
          <path d="M120 210h-18m40 66h-22M495 208h19m-39 68h24" stroke="#74a9d8" strokeWidth="1.3" />
        </g>
        <g fill="#9db0c1" fontFamily="monospace" fontSize="11">
          <text x="281" y="115">341.5</text><text x="112" y="176">Ø 18</text><text x="441" y="176">R 6</text>
          <text x="92" y="217">2x</text><text x="501" y="217">2x</text><text x="274" y="347">VISTA FRONTAL</text>
        </g>
        <rect x="436" y="327" width="181" height="56" fill="none" stroke="#425367" />
        <g fill="#9db0c1" fontFamily="monospace" fontSize="8">
          <text x="446" y="341">COMPONENTE</text><text x="446" y="358">SUPORTE · 4172-04-00</text><text x="446" y="373">ESCALA 1:2     FOLHA 1/1</text>
        </g>
      </svg>
      {!compact && <div className="drawing-foot"><span>UNIDADE: mm</span><span>TOLERÂNCIAS CONFORME DESENHO</span><span>QUALITY GATE</span></div>}
    </div>
  )
}

function DrawingAsset({ src, style }: { src?: string; style?: React.CSSProperties }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div className="image-error" style={style}><Image size={28} /><b>Desenho não disponível</b><span>Solicite o cadastro da imagem no chat.</span></div>
  if (src === 'drawing') return <DrawingPreview style={style} />
  return <div className="external-drawing" style={style}><img src={src} alt="Desenho técnico do item" onError={() => setFailed(true)} /></div>
}

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  return failed
    ? <span className="image-unavailable">Imagem indisponível</span>
    : <img src={src} alt={alt} onError={() => setFailed(true)} />
}

function AlertDetails({ alert }: { alert: AlertEntry }) {
  return <article className={`modal-alert-detail ${alert.type}`}>
    {alert.title && <h2>{alert.title}</h2>}
    <span className={`type-badge ${alert.type}`}>{alert.type === 'claim' ? 'CLAIM · PRIORIDADE ALTA' : 'ALERTA PADRÃO'}</span>
    <p>{alert.description}</p>
    <div className="modal-code-list"><span>ITENS VINCULADOS</span>{alert.codes.map(code => <span className="code-chip" key={code}>{code}</span>)}</div>
    {alert.image && <div className="alert-detail-image">{alert.image === 'drawing' ? <DrawingPreview compact /> : <ImageWithFallback src={alert.image} alt="Imagem de referência do alerta" />}</div>}
  </article>
}

function InitialScreen({ onEnter }: { onEnter: (role: Role, name: string, email?: string) => void }) {
  const [mode, setMode] = useState<'choose' | 'guest' | 'admin' | 'register'>('choose')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (mode === 'guest') {
      if (!name.trim()) { setError('Informe seu nome para continuar.'); return }
      onEnter('guest', name.trim())
      return
    }
    if (!email.trim() || !password.trim()) { setError('Preencha e-mail e senha para continuar.'); return }
    if (mode === 'register') onEnter('user', name.trim() || email.split('@')[0], email.trim())
    else onEnter(email.toLowerCase().includes('admin') ? 'admin' : 'user', name.trim() || email.split('@')[0], email.trim())
  }
  return (
    <main className="welcome">
      <div className="welcome-grid" />
      <header className="welcome-brand"><div className="brand-mark"><ScanLine size={21} /></div><span>quality<span className="brand-accent">gate</span><sup>2.0</sup></span></header>
      <div className="welcome-content">
        <div className="welcome-copy">
          <span className="eyebrow"><span className="status-dot" /> QUALIDADE NA LINHA DE PRODUÇÃO</span>
          <h1>O desenho certo.<br /><span>Na hora certa.</span></h1>
          <p>Consulte desenhos, confira alertas de qualidade e acesse padrões de embalagem. Tudo em um só lugar, direto da fábrica.</p>
          <div className="welcome-points"><span><Check size={15} /> Consulta por código</span><span><Check size={15} /> Alertas em tempo real</span><span><Check size={15} /> Padrões sempre à mão</span></div>
          <div className="welcome-drawing"><DrawingPreview compact /><span className="drawing-caption">4172-04-00 <i>•</i> SUPORTE DE TRANSMISSÃO</span></div>
        </div>
        <section className="entry-card">
          {mode === 'choose' ? <>
            <div className="entry-heading"><span className="entry-icon"><ShieldCheck size={19} /></span><div><h2>Acesse o Quality Gate</h2><p>Escolha como deseja continuar</p></div></div>
            <button className="entry-option" onClick={() => setMode('guest')}><span className="option-icon"><UserRound size={20} /></span><span><strong>Entrar como visitante</strong><small>Consulta rápida, sem senha</small></span><ChevronRight size={18} /></button>
            <button className="entry-option" onClick={() => setMode('admin')}><span className="option-icon"><ShieldCheck size={20} /></span><span><strong>Sou administrador ou usuário</strong><small>Acesse com sua conta</small></span><ChevronRight size={18} /></button>
            <div className="entry-foot"><CircleHelp size={15} /> Precisa de acesso? Fale com a equipe de qualidade.</div>
          </> : <>
            <button className="back-link" onClick={() => { setMode('choose'); setError('') }}><ArrowLeft size={15} /> Voltar</button>
            <div className="entry-heading"><span className="entry-icon"><UserRound size={19} /></span><div><h2>{mode === 'guest' ? 'Acesso de visitante' : mode === 'register' ? 'Criar conta' : 'Bem-vindo de volta'}</h2><p>{mode === 'guest' ? 'Seu nome será exibido no chat.' : 'Entre para continuar no Quality Gate.'}</p></div></div>
            <form className="entry-form" onSubmit={submit}>
              {mode === 'guest' ? <label>Seu nome<input autoFocus placeholder="Ex.: João Silva" value={name} onChange={event => setName(event.target.value)} /></label> : <>
                {mode === 'register' && <label>Seu nome<input placeholder="Ex.: João Silva" value={name} onChange={event => setName(event.target.value)} /></label>}
                <label>E-mail<input type="email" placeholder="voce@empresa.com" value={email} onChange={event => setEmail(event.target.value)} /></label>
                <label>Senha<input type="password" placeholder="Sua senha" value={password} onChange={event => setPassword(event.target.value)} /></label>
                {mode === 'admin' && <div className="demo-hint"><Sparkles size={14} /> Demonstração: e-mails com “admin” acessam o painel.</div>}
              </>}
              {error && <p className="form-error">{error}</p>}
              <button className="button button-primary full-button" type="submit">{mode === 'guest' ? 'Continuar como visitante' : mode === 'register' ? 'Criar conta' : 'Entrar'} <ArrowRight size={16} /></button>
            </form>
            {mode === 'admin' && <button className="text-button centered" onClick={() => { setMode('register'); setError('') }}>Ainda não tem conta? <b>Cadastre-se</b></button>}
          </>}
        </section>
      </div>
      <footer className="welcome-footer"><span>QUALITY GATE <i>·</i> INSPEÇÃO DE DESENHOS INDUSTRIAIS</span><span>© {new Date().getFullYear()}</span></footer>
    </main>
  )
}

function CameraScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const [torch, setTorch] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  useEffect(() => {
    let active = true
    let timer: number | undefined
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!active) { stream.getTracks().forEach(track => track.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        type Detector = { detect: (video: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }
        const DetectorClass = (window as Window & { BarcodeDetector?: new (options?: { formats: string[] }) => Detector }).BarcodeDetector
        if (!DetectorClass) { setError('Leitor automático não disponível neste navegador. Digite o código no campo de busca.'); return }
        const detector = new DetectorClass({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'] })
        const scan = async () => {
          if (!active || !videoRef.current || videoRef.current.readyState < 2) return
          try {
            const results = await detector.detect(videoRef.current)
            if (results[0]?.rawValue) { onScan(results[0].rawValue); return }
          } catch (scanError) { setError(`Falha na leitura do código: ${String(scanError)}`); return }
          timer = window.setTimeout(scan, 280)
        }
        timer = window.setTimeout(scan, 500)
      } catch (cameraError) {
        setError(`Não foi possível acessar a câmera: ${String(cameraError)}`)
      }
    }
    void start()
    return () => { active = false; if (timer) window.clearTimeout(timer); streamRef.current?.getTracks().forEach(track => track.stop()) }
  }, [onScan])
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    type TorchTrack = MediaStreamTrack & { applyConstraints: (constraints: MediaTrackConstraints & { advanced: Array<{ torch: boolean }> }) => Promise<void> }
    try { await (track as TorchTrack).applyConstraints({ advanced: [{ torch: !torch }] }); setTorch(!torch) }
    catch (cameraError) { setError(`Lanterna indisponível: ${String(cameraError)}`) }
  }
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="scanner-modal" role="dialog" aria-modal="true" aria-label="Leitor de código">
    <div className="modal-heading"><div><span className="eyebrow">LEITOR DE CÓDIGO</span><h2>Enquadre o código</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X /></button></div>
    <div className="camera-frame"><video ref={videoRef} autoPlay muted playsInline /><div className="scan-guide" /><div className="camera-overlay"><ScanLine size={28} /> Centralize o código na área indicada</div></div>
    {error && <p className="form-error scanner-error">{error}</p>}
    <div className="scanner-actions"><button className="button button-secondary" onClick={() => { void toggleTorch() }}><Flashlight size={16} /> {torch ? 'Desligar lanterna' : 'Lanterna'}</button><button className="button button-secondary" onClick={onClose}>Fechar câmera</button></div>
    <p className="modal-note">A leitura é feita no aparelho. A câmera é desligada ao fechar esta janela.</p>
  </section></div>
}

export default function App() {
  const [role, setRole] = useState<Role | null>(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [page, setPage] = useState<Page>('search')
  const [adminTab, setAdminTab] = useState<AdminTab>('items')
  const [items, setItems] = useStoredState<Item[]>('qg-items', starterItems)
  const [alerts, setAlerts] = useStoredState<AlertEntry[]>('qg-alerts', starterAlerts)
  const [packaging, setPackaging] = useStoredState<Packaging[]>('qg-packaging', starterPackaging)
  const [groups, setGroups] = useStoredState<SimilarGroup[]>('qg-groups', starterGroups)
  const [messages, setMessages] = useStoredState<ChatMessage[]>('qg-messages', starterMessages)
  const [users, setUsers] = useStoredState<UserEntry[]>('qg-users', starterUsers)
  const [query, setQuery] = useState('')
  const [selectedCode, setSelectedCode] = useState('4172-04-00')
  const [modalAlert, setModalAlert] = useState<AlertEntry | null>(null)
  const [packagingOpen, setPackagingOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [chatText, setChatText] = useState('')
  const [chatKind, setChatKind] = useState<'message' | 'request'>('message')
  const [notice, setNotice] = useState('')
  const [adminSearch, setAdminSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formCode, setFormCode] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formType, setFormType] = useState<'standard' | 'claim'>('standard')
  const [formCodes, setFormCodes] = useState('')
  const [formMax, setFormMax] = useState('3')
  const [titleDraft, setTitleDraft] = useState<Record<string, string>>({})
  const [menuOpen, setMenuOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [drawingZoom, setDrawingZoom] = useState(100)
  const [drawingOffset, setDrawingOffset] = useState({ x: 0, y: 0 })
  const [seenMessageIds, setSeenMessageIds] = useState<string[]>([])
  const panRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLDivElement>(null)
  const selectedItem = items.find(item => item.code.toLowerCase() === selectedCode.toLowerCase())
  const activeAlertsFor = (code: string) => alerts
    .filter(alert => alert.active && alert.codes.includes(code))
    .sort((a, b) => a.type === b.type ? 0 : a.type === 'claim' ? -1 : 1)
  const activeAlerts = selectedItem ? activeAlertsFor(selectedItem.code) : []
  const modalAlerts = modalAlert
    ? selectedItem && modalAlert.codes.includes(selectedItem.code)
      ? activeAlerts
      : [modalAlert]
    : []
  const selectedPackaging = selectedItem ? packaging.find(entry => entry.code === selectedItem.code) : undefined
  const similarItems = useMemo(() => {
    if (!selectedItem) return []
    const group = groups.find(entry => entry.codes.includes(selectedItem.code))
    return group ? group.codes.filter(code => code !== selectedItem.code).slice(0, group.max).map(code => items.find(item => item.code === code)).filter((item): item is Item => !!item) : []
  }, [groups, items, selectedItem])
  const unreadCount = messages.filter(message => message.role !== role && !seenMessageIds.includes(message.id)).length

  useEffect(() => {
    if (notice) {
      const timer = window.setTimeout(() => setNotice(''), 3500)
      return () => window.clearTimeout(timer)
    }
  }, [notice])
  useEffect(() => { if (page === 'chat') messageRef.current?.scrollTo({ top: messageRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, page])
  useEffect(() => { if (page === 'chat') setSeenMessageIds(messages.map(message => message.id)) }, [messages, page])
  useEffect(() => { setDrawingZoom(100); setDrawingOffset({ x: 0, y: 0 }) }, [selectedCode])

  const signIn = (newRole: Role, name: string, email = '') => {
    setRole(newRole); setUserName(name); setUserEmail(email); setPage('search')
    if (newRole === 'user' && email && !users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      setUsers([...users, { name, email, role: 'user', status: 'Ativo' }])
    }
  }
  const signOut = () => { setRole(null); setUserName(''); setUserEmail(''); setPage('search'); setQuery(''); setMenuOpen(false) }
  const requestAdminAccess = () => {
    if (role !== 'user') return
    const email = userEmail || `${userName.toLowerCase().replace(/\s+/g, '.')}@visitante.local`
    const existing = users.some(user => user.email.toLowerCase() === email.toLowerCase())
    setUsers(existing
      ? users.map(user => user.email.toLowerCase() === email.toLowerCase() ? { ...user, status: 'Pendente' } : user)
      : [...users, { name: userName, email, role: 'user', status: 'Pendente' }])
    setMessages([...messages, { id: crypto.randomUUID(), sender: userName, role: 'user', content: 'Solicito acesso ao perfil de administrador.', kind: 'request', time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date()) }])
    setNotice('Solicitação de acesso enviada para aprovação.')
  }
  const search = (event?: React.FormEvent) => {
    event?.preventDefault()
    const code = query.trim()
    if (!code) { setNotice('Digite um código para pesquisar.'); return }
    const match = items.find(item => item.code.toLowerCase() === code.toLowerCase())
    setSelectedCode(match?.code ?? code)
    if (match) {
      setModalAlert(activeAlertsFor(match.code)[0] ?? null)
      setNotice(`Desenho encontrado: ${match.code}`)
    } else {
      setModalAlert(null)
    }
  }
  const handleScan = useCallback((code: string) => {
    setQuery(code)
    const match = items.find(item => item.code.toLowerCase() === code.trim().toLowerCase())
    setSelectedCode(match?.code ?? code)
    setModalAlert(match ? alerts.filter(alert => alert.active && alert.codes.includes(match.code)).sort((a, b) => a.type === b.type ? 0 : a.type === 'claim' ? -1 : 1)[0] ?? null : null)
    setScannerOpen(false)
    if (match) setNotice(`Código lido: ${match.code}`)
  }, [alerts, items])
  const goTo = (nextPage: Page) => { setPage(nextPage); setMenuOpen(false) }
  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault()
    if (!chatText.trim()) return
    setMessages([...messages, { id: crypto.randomUUID(), sender: userName, role: role ?? 'guest', content: chatText.trim(), kind: chatKind, time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date()) }])
    setChatText('')
  }
  const markRequest = (id: string) => setMessages(messages.map(message => message.id === id ? { ...message, done: !message.done } : message))
  const filteredItems = items.filter(item => `${item.code} ${item.title}`.toLowerCase().includes(adminSearch.toLowerCase()))
  const filteredAlerts = alerts.filter(alert => `${alert.title} ${alert.codes.join(' ')}`.toLowerCase().includes(adminSearch.toLowerCase()))

  const saveAdminForm = (event: React.FormEvent) => {
    event.preventDefault()
    if (!formTitle.trim()) { setNotice('Preencha o título.'); return }
    const id = crypto.randomUUID()
    if (adminTab === 'items') {
      if (!formCode.trim() || items.some(item => item.code.toLowerCase() === formCode.trim().toLowerCase())) { setNotice('Informe um código único para o item.'); return }
      setItems([...items, { code: formCode.trim(), title: formTitle.trim(), image: formImage.trim() || undefined }])
    } else if (adminTab === 'alerts') {
      const codes = formCodes.split(/[,;\n]/).map(code => code.trim()).filter(Boolean)
      if (!codes.length) { setNotice('Informe pelo menos um código de item.'); return }
      setAlerts([...alerts, { id, type: formType, title: formTitle.trim(), description: formDescription.trim(), codes, active: true, image: formImage.trim() || undefined }])
    } else if (adminTab === 'packaging') {
      if (!items.some(item => item.code.toLowerCase() === formCode.trim().toLowerCase())) { setNotice('O código precisa corresponder a um item cadastrado.'); return }
      setPackaging([...packaging, { id, code: formCode.trim(), title: formTitle.trim(), description: formDescription.trim(), image: formImage.trim() || undefined }])
    } else if (adminTab === 'similar') {
      const codes = formCodes.split(/[,;\n]/).map(code => code.trim()).filter(Boolean)
      if (codes.length < 2) { setNotice('Informe pelo menos dois códigos para comparar.'); return }
      setGroups([...groups, { id, name: formTitle.trim(), codes, max: Math.max(1, Number(formMax) || 3) }])
    }
    setShowForm(false); setFormCode(''); setFormTitle(''); setFormDescription(''); setFormImage(''); setFormCodes(''); setFormType('standard')
    setNotice('Alterações salvas neste dispositivo.')
  }
  const deleteEntry = (tab: AdminTab, id: string, code?: string) => {
    if (tab === 'items' && code) {
      setItems(items.filter(item => item.code !== code))
      setAlerts(alerts.flatMap(alert => {
        const remainingCodes = alert.codes.filter(itemCode => itemCode !== code)
        return remainingCodes.length ? [{ ...alert, codes: remainingCodes }] : []
      }))
      setPackaging(packaging.filter(entry => entry.code !== code))
      setGroups(groups.flatMap(group => {
        const remainingCodes = group.codes.filter(itemCode => itemCode !== code)
        return remainingCodes.length > 1 ? [{ ...group, codes: remainingCodes }] : []
      }))
    }
    if (tab === 'alerts') setAlerts(alerts.filter(item => item.id !== id))
    if (tab === 'packaging') setPackaging(packaging.filter(item => item.id !== id))
    if (tab === 'similar') setGroups(groups.filter(item => item.id !== id))
    setNotice('Registro removido.')
  }
  const exportCodes = () => {
    const csv = ['Código;Título', ...items.map(item => `${item.code};${item.title}`)].join('\r\n')
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'quality-gate-codigos.csv'; link.click(); URL.revokeObjectURL(url)
  }
  const importTitles = async (file?: File) => {
    if (!file) return
    try {
      const { default: ExcelJS } = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(await file.arrayBuffer())
      const sheet = workbook.worksheets[0]
      if (!sheet) throw new Error('A planilha não contém nenhuma aba.')
      const imported = new Map<string, string>()
      sheet.eachRow((row, rowNumber) => {
        const code = String(row.getCell(1).text ?? '').trim()
        const title = String(row.getCell(2).text ?? '').trim()
        if (rowNumber > 1 && code && title) imported.set(code.toLowerCase(), title)
      })
      if (!imported.size) throw new Error('Nenhuma linha válida. Use a coluna A para código e a B para título (com cabeçalho na primeira linha).')
      setItems(items.map(item => imported.has(item.code.toLowerCase()) ? { ...item, title: imported.get(item.code.toLowerCase())! } : item))
      setNotice(`${imported.size} título(s) importado(s).`)
    } catch (importError) {
      setNotice(`Não foi possível importar a planilha: ${String(importError)}`)
    }
  }
  const updateTitles = () => {
    setItems(items.map(item => titleDraft[item.code] !== undefined ? { ...item, title: titleDraft[item.code].trim() || item.title } : item))
    setTitleDraft({})
    setNotice('Títulos salvos neste dispositivo.')
  }
  const downloadDrawing = () => {
    if (!selectedItem?.image || selectedItem.image === 'drawing') {
      setNotice('Este desenho de demonstração não possui arquivo para baixar.')
      return
    }
    const link = document.createElement('a')
    link.href = selectedItem.image
    link.download = `${selectedItem.code}`
    link.target = '_blank'
    link.rel = 'noreferrer'
    link.click()
  }

  if (!role) return <InitialScreen onEnter={signIn} />

  const adminTabs: { id: AdminTab; label: string; icon: typeof Box }[] = [
    { id: 'items', label: 'Itens', icon: Box }, { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'packaging', label: 'Embalagem', icon: PackageCheck }, { id: 'similar', label: 'Semelhantes', icon: Layers3 },
    { id: 'users', label: 'Usuários', icon: Users }, { id: 'titles', label: 'Títulos', icon: FileSpreadsheet },
  ]
  const sidebar = <><div className="sidebar-brand"><div className="brand-mark"><ScanLine size={19} /></div><span>quality<span className="brand-accent">gate</span><sup>2.0</sup></span></div>
    <div className="sidebar-label">MENU PRINCIPAL</div>
    <nav className="side-nav">
      <button className={`nav-link ${page === 'search' ? 'active' : ''}`} onClick={() => goTo('search')}><Search size={18} />Pesquisar<span className="nav-shortcut">⌘ K</span></button>
      <button className={`nav-link ${page === 'packaging' ? 'active' : ''}`} onClick={() => goTo('packaging')}><PackageCheck size={18} />Embalagem</button>
      <button className={`nav-link ${page === 'chat' ? 'active' : ''}`} onClick={() => goTo('chat')}><MessageCircle size={18} />Chat{unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</button>
      {role === 'admin' && <><div className="sidebar-label sidebar-section-label">ADMINISTRAÇÃO</div><button className={`nav-link ${page === 'admin' ? 'active' : ''}`} onClick={() => goTo('admin')}><SlidersHorizontal size={18} />Painel administrativo<ChevronRight size={15} className="nav-trailing" /></button></>}
    </nav>
    <div className="sidebar-spacer" />
    <button className="help-card" onClick={() => { setChatKind('request'); goTo('chat') }}><span className="help-icon"><MessageCircle size={16} /></span><span><b>Precisa de ajuda?</b><small>Fale com a qualidade</small></span><ArrowRight size={15} /></button>
    <div className="sidebar-profile" title={userEmail || userName}><div className={`avatar ${role === 'admin' ? 'avatar-admin' : ''}`}>{userName.charAt(0).toUpperCase()}</div><div className="profile-text"><strong>{userName}</strong><small>{role === 'admin' ? 'Administrador' : role === 'guest' ? 'Visitante' : 'Usuário'}</small>{role === 'user' && <button className="promote-link" onClick={requestAdminAccess}>Solicitar perfil admin</button>}</div><button className="icon-button logout-button" onClick={signOut} aria-label="Sair"><LogOut size={17} /></button></div>
  </>

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>{sidebar}</aside>
    {menuOpen && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu"><Menu size={20} /></button><div className="breadcrumb"><span>Quality Gate</span><ChevronRight size={14} /><b>{page === 'search' ? 'Pesquisar' : page === 'packaging' ? 'Embalagem' : page === 'chat' ? 'Chat' : 'Painel administrativo'}</b></div><div className="topbar-right"><span className="system-status"><span className="status-dot" /> Sistema operacional</span><button className="icon-button notification-button" aria-label="Notificações" onClick={() => goTo('chat')}><Bell size={18} />{unreadCount > 0 && <i />}</button><div className="topbar-divider" /><div className="topbar-user"><div className="avatar">{userName.charAt(0).toUpperCase()}</div><span>{userName.split(' ')[0]}</span><ChevronDown size={14} /></div></div></header>
      <div className="content-area">
        {page === 'search' && <div className="search-page">
          <div className="page-intro"><div><span className="eyebrow">CONSULTA DE DESENHOS</span><h1>Encontre seu desenho</h1><p>Digite ou escaneie o código da peça para consultar os detalhes.</p></div><span className="intro-meta"><span className="status-dot" /> BASE ATUALIZADA AGORA</span></div>
          <form className="search-panel" onSubmit={search}><div className="search-panel-icon"><Search size={19} /></div><div className="search-input-wrap"><label htmlFor="part-search">CÓDIGO DO ITEM</label><input id="part-search" autoComplete="off" placeholder="Ex.: 4172-04-00" value={query} onChange={event => setQuery(event.target.value)} /><span>Busque pelo código completo do desenho</span></div><button className="button button-primary search-submit" type="submit"><Search size={16} /> Pesquisar</button><button className="button button-secondary scan-button" type="button" onClick={() => setScannerOpen(true)}><Camera size={17} /> <span>Escanear</span></button></form>
          <div className="sample-codes"><span>BUSCAS RECENTES</span>{['4172-04-00', 'AX-2084', 'PL-1092'].map(code => <button key={code} onClick={() => { setQuery(code); setSelectedCode(code) }}><Clock3 size={12} /> {code}</button>)}</div>
          {!selectedItem ? <section className="empty-state"><div className="empty-illustration"><Search size={28} /></div><span className="eyebrow">NENHUM RESULTADO</span><h2>Não encontramos esse código</h2><p>Confira se o código foi digitado corretamente ou peça ajuda à equipe de qualidade.</p><button className="button button-secondary" onClick={() => { setQuery(''); setSelectedCode('') }}>Limpar pesquisa</button></section> :
            <><div className="result-heading"><div><span className="eyebrow">RESULTADO DA PESQUISA</span><div className="result-title"><h2>{selectedItem.title}</h2><span className="code-chip">{selectedItem.code}</span></div></div><div className="result-actions"><button className="button button-secondary" onClick={() => { if (!selectedPackaging) setNotice('Ainda não há padrão de embalagem cadastrado para este item.'); else setPackagingOpen(true) }}><PackageCheck size={16} /> Padrão de embalagem</button><button className="icon-button more-button" aria-label="Mais opções"><MoreHorizontal size={19} /></button></div></div>
              {activeAlerts.some(alert => alert.type === 'claim') && <div className="blocking-alert"><div className="blocking-icon"><AlertTriangle size={20} /></div><div><strong>ATENÇÃO · RECLAMAÇÃO ATIVA</strong><p>Verifique o alerta em vermelho antes de liberar este item.</p></div><button onClick={() => setModalAlert(activeAlerts.find(alert => alert.type === 'claim')!)}>Ver alerta <ArrowRight size={15} /></button></div>}
              <div className="result-grid"><section className="drawing-card"><div className="card-heading"><div><span className="card-eyebrow">DESENHO TÉCNICO</span><h3>{selectedItem.code}</h3></div><div className="drawing-controls"><button className="icon-button" aria-label="Diminuir zoom" onClick={() => setDrawingZoom(Math.max(60, drawingZoom - 20))}><ZoomOut size={16} /></button><span>{drawingZoom}%</span><button className="icon-button" aria-label="Aumentar zoom" onClick={() => setDrawingZoom(Math.min(200, drawingZoom + 20))}><ZoomIn size={16} /></button><button className="icon-button" aria-label="Baixar desenho" onClick={downloadDrawing}><Download size={16} /></button></div></div><div className="drawing-stage" onPointerDown={event => { panRef.current = { x: event.clientX, y: event.clientY, offsetX: drawingOffset.x, offsetY: drawingOffset.y }; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={event => { if (panRef.current) setDrawingOffset({ x: panRef.current.offsetX + event.clientX - panRef.current.x, y: panRef.current.offsetY + event.clientY - panRef.current.y }) }} onPointerUp={() => { panRef.current = null }} onPointerCancel={() => { panRef.current = null }}><DrawingAsset src={selectedItem.image} style={{ transform: `translate(${drawingOffset.x}px, ${drawingOffset.y}px) scale(${drawingZoom / 100})` }} /></div><div className="drawing-caption-row"><span><span className="status-dot" /> DESENHO VIGENTE</span><span>Última revisão: 12/06/2025</span></div></section>
                <div className="info-column"><section className="info-card alerts-card"><div className="section-heading"><span className="heading-icon alert-heading-icon"><AlertTriangle size={16} /></span><div><h3>Alertas ativos</h3><span>{activeAlerts.length ? `${activeAlerts.length} aviso${activeAlerts.length > 1 ? 's' : ''} para este item` : 'Nenhum alerta ativo'}</span></div>{activeAlerts.length > 0 && <span className="count-pill">{activeAlerts.length}</span>}</div>
                      {activeAlerts.length ? <div className="alerts-list">{activeAlerts.map(alert => <button key={alert.id} className={`alert-row ${alert.type}`} onClick={() => setModalAlert(alert)}><span className="alert-type-icon"><AlertTriangle size={16} /></span><span className="alert-row-copy"><strong>{alert.title}</strong><small>{alert.type === 'claim' ? 'RECLAMAÇÃO · PRIORIDADE ALTA' : 'ALERTA PADRÃO'} <i>·</i> Ver detalhes</small></span>{alert.image && <span className="alert-thumb">{alert.image === 'drawing' ? <DrawingPreview compact /> : <ImageWithFallback src={alert.image} alt="" />}</span>}<ChevronRight size={15} /></button>)}</div> : <div className="no-alerts"><CheckCircle2 size={17} /> Nenhum aviso pendente. Boa produção!</div>}
                </section>
                <section className="info-card similar-card"><div className="section-heading"><span className="heading-icon similar-heading-icon"><Layers3 size={16} /></span><div><h3>Itens semelhantes</h3><span>Confira antes de liberar a peça</span></div></div>{similarItems.length ? <div className="similar-list">{similarItems.map(item => <button key={item.code} className="similar-row" onClick={() => { setQuery(item.code); setSelectedCode(item.code); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><div className="similar-thumb"><DrawingPreview compact /></div><span><strong>{item.code}</strong><small>{item.title}</small></span><ArrowRight size={15} /></button>)}</div> : <div className="no-alerts">Nenhum grupo de comparação cadastrado.</div>}</section>
                <div className="quick-tip"><Sparkles size={15} /><span><b>Dica de qualidade</b> Compare o desenho com a peça física antes de iniciar a embalagem.</span></div></div></div>
              {selectedPackaging && <div className="packaging-inline"><span className="heading-icon package-heading-icon"><PackageCheck size={16} /></span><div><strong>{selectedPackaging.title}</strong><small>{selectedPackaging.description}</small></div><button onClick={() => setPackagingOpen(true)}>Ver padrão <ArrowRight size={14} /></button></div>}
            </>}
          <div className="page-footnote"><ShieldCheck size={14} /> Informações para consulta. Em caso de divergência, consulte o sistema corporativo da qualidade.</div>
        </div>}

        {page === 'packaging' && <div className="secondary-page"><div className="page-intro"><div><span className="eyebrow">PADRÕES DE ACONDICIONAMENTO</span><h1>Embalagem</h1><p>Consulte a forma correta de acondicionar cada item.</p></div></div><form className="compact-search" onSubmit={event => { event.preventDefault(); const match = packaging.find(entry => entry.code.toLowerCase() === query.trim().toLowerCase()); setSelectedCode(match?.code ?? query.trim()) }}><Search size={18} /><input placeholder="Buscar por código do item" value={query} onChange={event => setQuery(event.target.value)} /><button className="button button-primary">Buscar</button></form><div className="packaging-grid">{packaging.filter(entry => !query || entry.code.toLowerCase().includes(query.toLowerCase())).map(entry => <article className="packaging-card" key={entry.id}><div className="packaging-card-art">{entry.image ? <ImageWithFallback src={entry.image} alt="" /> : <div className="box-illustration"><Box size={42} /></div>}<span className="code-chip">{entry.code}</span></div><div className="packaging-card-body"><span className="eyebrow">PADRÃO DE EMBALAGEM</span><h3>{entry.title}</h3><p>{entry.description}</p><button className="text-button" onClick={() => { setSelectedCode(entry.code); setPackagingOpen(true) }}>Ver instruções completas <ArrowRight size={15} /></button></div></article>)}</div>{!packaging.length && <div className="empty-state compact-empty"><PackageCheck size={28} /><h2>Nenhum padrão cadastrado</h2><p>Peça ao administrador para cadastrar instruções de embalagem.</p></div>}</div>}

        {page === 'chat' && <div className="chat-page"><div className="page-intro"><div><span className="eyebrow">CANAL COM A EQUIPE</span><h1>Chat da qualidade</h1><p>Tire dúvidas ou envie uma solicitação para os administradores.</p></div><div className="online-indicator"><span className="status-dot" /> {users.filter(user => user.role === 'admin').length} admins</div></div><div className="chat-panel"><div className="chat-header"><div className="chat-room-icon"><MessageCircle size={18} /></div><div><strong>Equipe de qualidade</strong><small><span className="status-dot" /> Canal interno · mensagens demonstrativas</small></div><button className="icon-button" aria-label="Opções"><MoreHorizontal size={20} /></button></div><div className="chat-messages" ref={messageRef}><div className="chat-date"><span /> HOJE, {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date()).toUpperCase()} <span /></div>{messages.map(message => <div key={message.id} className={`chat-message ${message.sender === userName ? 'mine' : ''}`}><div className={`avatar chat-avatar ${message.role === 'admin' ? 'avatar-admin' : ''}`}>{message.sender.charAt(0)}</div><div className="message-content"><div className="message-meta"><strong>{message.sender}</strong>{message.role === 'admin' && <span className="admin-tag">QUALIDADE</span>}<time>{message.time}</time></div><div className={`message-bubble ${message.kind === 'request' ? 'request-bubble' : ''}`}>{message.kind === 'request' && <div className="request-label"><ClipboardList size={13} /> SOLICITAÇÃO {message.done && <span className="done-tag"><Check size={11} /> CONCLUÍDA</span>}</div>}<p>{message.content}</p>{message.attachment && <small className="attachment-name"><Paperclip size={12} /> {message.attachment}</small>}</div>{message.kind === 'request' && role === 'admin' && <button className={`resolve-button ${message.done ? 'resolved' : ''}`} onClick={() => markRequest(message.id)}>{message.done ? <><CheckCheck size={13} /> Reabrir solicitação</> : <><CheckCircle2 size={13} /> Marcar como concluída</>}</button>}</div></div>)}</div><form className="chat-compose" onSubmit={sendMessage}><div className="compose-kind"><button type="button" className={`kind-option ${chatKind === 'message' ? 'selected' : ''}`} onClick={() => setChatKind('message')}><MessageCircle size={14} /> Mensagem</button><button type="button" className={`kind-option ${chatKind === 'request' ? 'selected request-kind' : ''}`} onClick={() => setChatKind('request')}><ClipboardList size={14} /> Solicitação</button></div><div className="compose-input"><input placeholder={chatKind === 'request' ? 'Descreva o que precisa...' : 'Escreva sua mensagem...'} value={chatText} onChange={event => setChatText(event.target.value)} /><button type="button" className="icon-button attach-button" aria-label="Anexar arquivo" onClick={() => setNotice('Anexos ficam disponíveis após configurar o armazenamento de arquivos.')}><Paperclip size={17} /></button><button className="send-button" type="submit" disabled={!chatText.trim()} aria-label="Enviar"><Send size={17} /></button></div><span className="compose-hint">{chatKind === 'request' ? 'A equipe será notificada sobre sua solicitação.' : 'Mensagens visíveis para a equipe de qualidade.'}</span></form></div></div>}

        {page === 'admin' && role === 'admin' && <div className="admin-page"><div className="page-intro"><div><span className="eyebrow">GESTÃO DA BASE DE DADOS</span><h1>Painel administrativo</h1><p>Gerencie itens, alertas, padrões e acessos do Quality Gate.</p></div><button className="button button-secondary codes-export" onClick={exportCodes}><ArrowDownToLine size={16} /> Ver códigos</button></div><div className="admin-metrics"><div><span className="metric-icon blue"><Box size={17} /></span><span><small>ITENS CADASTRADOS</small><strong>{items.length}</strong></span><span className="metric-trend">+{items.length > 4 ? items.length - 4 : 0} este mês</span></div><div><span className="metric-icon amber"><AlertTriangle size={17} /></span><span><small>ALERTAS ATIVOS</small><strong>{alerts.filter(alert => alert.active).length}</strong></span><span className="metric-trend">na base</span></div><div><span className="metric-icon green"><PackageCheck size={17} /></span><span><small>PADRÕES DE EMBALAGEM</small><strong>{packaging.length}</strong></span><span className="metric-trend">itens cobertos</span></div><div><span className="metric-icon violet"><Users size={17} /></span><span><small>ACESSOS PENDENTES</small><strong>{users.filter(user => user.status === 'Pendente').length}</strong></span><span className="metric-trend">aguardando revisão</span></div></div>
          <section className="admin-panel"><div className="admin-tabs">{adminTabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} className={`admin-tab ${adminTab === tab.id ? 'active' : ''}`} onClick={() => { setAdminTab(tab.id); setShowForm(false); setInviteOpen(false); setAdminSearch('') }}><Icon size={16} />{tab.label}{tab.id === 'users' && users.some(user => user.status === 'Pendente') && <i />}</button> })}</div>
            <div className="admin-tools"><div className="admin-section-heading"><div><h2>{adminTabs.find(tab => tab.id === adminTab)?.label}</h2><p>{adminTab === 'titles' ? 'Edite vários títulos de uma vez ou importe uma planilha.' : `Gerencie ${adminTabs.find(tab => tab.id === adminTab)?.label.toLowerCase()} cadastrados na base.`}</p></div>{adminTab === 'users' ? <button className="button button-primary add-button" onClick={() => setInviteOpen(!inviteOpen)}><Plus size={16} /> Convidar por e-mail</button> : adminTab !== 'titles' && <button className="button button-primary add-button" onClick={() => setShowForm(!showForm)}>{showForm ? <X size={15} /> : <Plus size={16} />}{showForm ? 'Cancelar' : `Adicionar ${adminTab === 'items' ? 'item' : adminTab === 'alerts' ? 'alerta' : adminTab === 'packaging' ? 'padrão' : 'grupo'}`}</button>}</div>
              {inviteOpen && <form className="admin-create-form" onSubmit={event => { event.preventDefault(); if (!inviteEmail.trim() || users.some(user => user.email.toLowerCase() === inviteEmail.trim().toLowerCase())) { setNotice('Informe um e-mail válido ainda não cadastrado.'); return } setUsers([...users, { name: inviteName.trim() || inviteEmail.split('@')[0], email: inviteEmail.trim(), role: 'user', status: 'Convite enviado' }]); setInviteName(''); setInviteEmail(''); setInviteOpen(false); setNotice(`Convite registrado para ${inviteEmail.trim()}.`) }}><div className="form-grid"><label>Nome<input placeholder="Nome do usuário" value={inviteName} onChange={event => setInviteName(event.target.value)} /></label><label>E-mail<input required type="email" placeholder="usuario@empresa.com" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} /></label></div><button className="button button-primary" type="submit"><Send size={14} /> Registrar convite</button></form>}
              {adminTab !== 'titles' && <label className="admin-search"><Search size={16} /><input placeholder={`Buscar ${adminTab === 'items' ? 'por código ou título' : 'registros'}...`} value={adminSearch} onChange={event => setAdminSearch(event.target.value)} /></label>}
              {showForm && <form className="admin-create-form" onSubmit={saveAdminForm}><div className="form-grid">{adminTab === 'items' && <label>Código do item<input required placeholder="Ex.: 4172-04-02" value={formCode} onChange={event => setFormCode(event.target.value)} /></label>}{adminTab === 'packaging' && <label>Código do item<input required placeholder="Código já cadastrado" value={formCode} onChange={event => setFormCode(event.target.value)} /></label>}{adminTab === 'alerts' && <label>Tipo de alerta<select value={formType} onChange={event => setFormType(event.target.value as 'standard' | 'claim')}><option value="standard">Padrão · amarelo</option><option value="claim">Reclamação · vermelho</option></select></label>}<label>{adminTab === 'similar' ? 'Nome do grupo' : 'Título'}<input required placeholder={adminTab === 'similar' ? 'Ex.: Suportes da transmissão' : 'Título do registro'} value={formTitle} onChange={event => setFormTitle(event.target.value)} /></label>{(adminTab === 'alerts' || adminTab === 'similar') && <label className="wide-field">Códigos dos itens <input required placeholder="Separe por vírgula (ex.: 4172-04-00, AX-2084)" value={formCodes} onChange={event => setFormCodes(event.target.value)} /></label>}{adminTab === 'similar' && <label>Máx. semelhantes<input type="number" min="1" value={formMax} onChange={event => setFormMax(event.target.value)} /></label>}{(adminTab === 'alerts' || adminTab === 'packaging') && <label className="wide-field">Instruções / descrição<textarea rows={2} placeholder="Descreva os detalhes..." value={formDescription} onChange={event => setFormDescription(event.target.value)} /></label>}{adminTab === 'items' && <label className="wide-field">Caminho/URL do desenho (opcional)<input type="text" placeholder="/images/4172-04-02.png" value={formImage} onChange={event => setFormImage(event.target.value)} /></label>}{(adminTab === 'alerts' || adminTab === 'packaging') && <label className="wide-field">Caminho/URL da imagem (opcional)<input type="text" placeholder="/images/referencia.png" value={formImage} onChange={event => setFormImage(event.target.value)} /></label>}</div><button className="button button-primary" type="submit"><Check size={15} /> Salvar cadastro</button></form>}
              {adminTab === 'items' && <div className="table-wrap"><table><thead><tr><th>CÓDIGO</th><th>TÍTULO DO ITEM</th><th>DESENHO</th><th>ATUALIZADO</th><th /></tr></thead><tbody>{filteredItems.map(item => <tr key={item.code}><td><span className="table-code">{item.code}</span></td><td className="table-title">{item.title}</td><td>{item.image ? <span className="drawing-tag"><Image size={13} /> Disponível</span> : <span className="muted-text">Sem imagem</span>}</td><td className="muted-text">Hoje</td><td><button className="table-action" onClick={() => deleteEntry('items', '', item.code)} aria-label={`Excluir ${item.code}`}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table>{!filteredItems.length && <div className="table-empty">Nenhum item encontrado.</div>}</div>}
              {adminTab === 'alerts' && <div className="table-wrap"><table><thead><tr><th>TIPO</th><th>TÍTULO DO ALERTA</th><th>CÓDIGOS</th><th>STATUS</th><th /></tr></thead><tbody>{filteredAlerts.map(alert => <tr key={alert.id}><td><span className={`type-badge ${alert.type}`}>{alert.type === 'claim' ? 'Reclamação' : 'Padrão'}</span></td><td className="table-title">{alert.title}</td><td className="muted-text">{alert.codes.join(', ')}</td><td><button className={`toggle-pill ${alert.active ? 'on' : ''}`} onClick={() => setAlerts(alerts.map(entry => entry.id === alert.id ? { ...entry, active: !entry.active } : entry))}><span />{alert.active ? 'Ativo' : 'Inativo'}</button></td><td><button className="table-action" onClick={() => deleteEntry('alerts', alert.id)} aria-label="Excluir alerta"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>}
              {adminTab === 'packaging' && <div className="table-wrap"><table><thead><tr><th>CÓDIGO</th><th>PADRÃO</th><th>INSTRUÇÕES</th><th /></tr></thead><tbody>{packaging.filter(entry => `${entry.code} ${entry.title}`.toLowerCase().includes(adminSearch.toLowerCase())).map(entry => <tr key={entry.id}><td><span className="table-code">{entry.code}</span></td><td className="table-title">{entry.title}</td><td className="muted-text">{entry.description}</td><td><button className="table-action" onClick={() => deleteEntry('packaging', entry.id)} aria-label="Excluir padrão"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>}
              {adminTab === 'similar' && <div className="table-wrap"><table><thead><tr><th>NOME DO GRUPO</th><th>CÓDIGOS DE ITENS</th><th>LIMITE NA CONSULTA</th><th /></tr></thead><tbody>{groups.filter(group => `${group.name} ${group.codes.join(' ')}`.toLowerCase().includes(adminSearch.toLowerCase())).map(group => <tr key={group.id}><td className="table-title">{group.name}</td><td className="muted-text">{group.codes.join(', ')}</td><td><span className="table-code">{group.max}</span></td><td><button className="table-action" onClick={() => deleteEntry('similar', group.id)} aria-label="Excluir grupo"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>}
              {adminTab === 'users' && <div className="table-wrap"><table><thead><tr><th>USUÁRIO</th><th>E-MAIL</th><th>PERFIL</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>{users.map((user, index) => <tr key={user.email}><td><span className="user-cell"><span className="avatar">{user.name.charAt(0)}</span>{user.name}</span></td><td className="muted-text">{user.email}</td><td><span className={`role-badge ${user.role}`}>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</span></td><td><span className={`status-badge ${user.status === 'Ativo' ? 'active-status' : 'pending-status'}`}><i />{user.status}</span></td><td>{user.status === 'Pendente' ? <div className="user-actions"><button className="approve-button" onClick={() => setUsers(users.map((entry, i) => i === index ? { ...entry, role: 'admin', status: 'Ativo' } : entry))}><Check size={13} /> Aprovar admin</button><button className="reject-button" onClick={() => setUsers(users.filter((_, i) => i !== index))}>Recusar</button></div> : user.role !== 'admin' && user.status === 'Ativo' && <button className="promote-button" onClick={() => setUsers(users.map((entry, i) => i === index ? { ...entry, role: 'admin' } : entry))}>Promover a admin</button>}</td></tr>)}</tbody></table></div>}
              {adminTab === 'titles' && <><div className="title-tools"><label className="admin-search"><Search size={16} /><input placeholder="Buscar título ou código..." value={adminSearch} onChange={event => setAdminSearch(event.target.value)} /></label><input className="hidden-input" ref={fileRef} type="file" accept=".xlsx,.xls" onChange={event => { void importTitles(event.target.files?.[0]); event.target.value = '' }} /><button className="button button-secondary" onClick={() => fileRef.current?.click()}><Upload size={15} /> Importar Excel</button></div><div className="import-hint"><FileSpreadsheet size={15} /> Planilha Excel: coluna A = código, coluna B = título. A primeira linha deve conter cabeçalhos.</div><div className="table-wrap title-table"><table><thead><tr><th>CÓDIGO</th><th>TÍTULO DO ITEM</th></tr></thead><tbody>{filteredItems.map(item => <tr key={item.code}><td><span className="table-code">{item.code}</span></td><td><input className="title-edit-input" value={titleDraft[item.code] ?? item.title} onChange={event => setTitleDraft({ ...titleDraft, [item.code]: event.target.value })} /></td></tr>)}</tbody></table></div><div className="title-save-row"><span>{Object.keys(titleDraft).length} alterações pendentes</span><button className="button button-primary" onClick={updateTitles}><Check size={15} /> Salvar títulos</button></div></>}
            </div>
          </section></div>}
        {page === 'admin' && role !== 'admin' && <section className="empty-state"><ShieldCheck size={30} /><h2>Acesso exclusivo</h2><p>Esta área está disponível apenas para administradores.</p><button className="button button-primary" onClick={() => goTo('search')}>Voltar à pesquisa</button></section>}
      </div>
    </main>
    <nav className="mobile-nav"><button className={page === 'search' ? 'active' : ''} onClick={() => goTo('search')}><Search size={19} /><span>Pesquisar</span></button><button className={page === 'packaging' ? 'active' : ''} onClick={() => goTo('packaging')}><PackageCheck size={19} /><span>Embalagem</span></button><button className={page === 'chat' ? 'active' : ''} onClick={() => goTo('chat')}><MessageCircle size={19} /><span>Chat</span>{unreadCount > 0 && <i />}</button>{role === 'admin' && <button className={page === 'admin' ? 'active' : ''} onClick={() => goTo('admin')}><Settings2 size={19} /><span>Admin</span></button>}</nav>
    {modalAlert && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setModalAlert(null) }}><section className="detail-modal" role="dialog" aria-modal="true" aria-label="Detalhes do alerta"><div className={`modal-alert-banner ${(modalAlerts[0] ?? modalAlert).type}`}><span className="alert-type-icon"><AlertTriangle size={18} /></span><span>{modalAlerts.length > 1 ? `${modalAlerts.length} ALERTAS ATIVOS` : (modalAlerts[0] ?? modalAlert).type === 'claim' ? 'RECLAMAÇÃO · PRIORIDADE ALTA' : 'ALERTA PADRÃO'}</span><button className="icon-button" onClick={() => setModalAlert(null)} aria-label="Fechar"><X size={18} /></button></div><div className="detail-modal-body"><span className="eyebrow">{modalAlerts.length > 1 ? 'ALERTAS DO ITEM' : 'ALERTA DE QUALIDADE'}</span>{modalAlerts.map(alert => <AlertDetails key={alert.id} alert={alert} />)}<button className="button button-secondary full-button" onClick={() => setModalAlert(null)}>Entendi <Check size={15} /></button></div></section></div>}
    {packagingOpen && selectedPackaging && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setPackagingOpen(false) }}><section className="detail-modal packaging-modal" role="dialog" aria-modal="true" aria-label="Padrão de embalagem"><div className="modal-alert-banner package-banner"><span className="heading-icon package-heading-icon"><PackageCheck size={17} /></span><span>PADRÃO DE EMBALAGEM</span><button className="icon-button" onClick={() => setPackagingOpen(false)} aria-label="Fechar"><X size={18} /></button></div><div className="detail-modal-body"><span className="code-chip">{selectedPackaging.code}</span><h2>{selectedPackaging.title}</h2>{selectedPackaging.image && <div className="alert-detail-image"><ImageWithFallback src={selectedPackaging.image} alt="Imagem do padrão de embalagem" /></div>}<div className="package-steps"><div className="package-step"><span>01</span><p>{selectedPackaging.description}</p></div><div className="package-step"><span>02</span><p>Conferir a quantidade e a identificação antes de fechar a embalagem.</p></div><div className="package-step"><span>03</span><p>Em caso de dúvida, confirme o padrão com a equipe da qualidade.</p></div></div><button className="button button-primary full-button" onClick={() => setPackagingOpen(false)}>Entendi <Check size={15} /></button></div></section></div>}
    {scannerOpen && <CameraScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />}
    {notice && <div className="toast"><CheckCircle2 size={17} />{notice}<button className="icon-button" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={15} /></button></div>}
  </div>
}
