import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react'
import {
  AlertTriangle, Box, Check, ChevronRight, CircleHelp, FileImage, FolderOpen, Image, LogIn, LogOut,
  Layers3, MessageCircle, PackageCheck, Pencil, Plus, RotateCcw, Search, ShieldCheck,
  Trash2, X, ZoomIn, ZoomOut,
} from 'lucide-react'
import type { AdminAuth } from './auth'

type Page = 'search' | 'chat' | 'admin'
type AccessMode = 'welcome' | 'user' | 'adminLogin' | 'admin'
type AdminTab = 'items' | 'alerts' | 'packaging' | 'similar'
type ChatMessage = { id: string; author: string; role: 'user' | 'admin'; text: string; createdAt: string }
type Item = { code: string; title: string; image?: string; folder?: string }
type QualityAlert = {
  id: string
  kind: 'standard' | 'claim'
  title: string
  description: string
  codes: string[]
  active: boolean
  image?: string
}
type Packaging = { id: string; code: string; title: string; description: string; image?: string }
type SimilarGroup = { id: string; name: string; codes: string[] }
type RelatedDrawing = { code: string; title: string; image?: string }

const starterItems: Item[] = [
  { code: '4172-04-00', title: 'Suporte do conjunto de transmissão' },
  { code: '4172-04-01', title: 'Suporte lateral esquerdo' },
  { code: 'AX-2084', title: 'Eixo de acionamento' },
  { code: 'PL-1092', title: 'Placa de fixação' },
]

const starterAlerts: QualityAlert[] = [
  {
    id: 'alert-1',
    kind: 'claim',
    title: 'Inspecionar região do furo',
    description: 'Verifique se há trincas próximo ao furo de fixação antes de liberar a peça.',
    codes: ['4172-04-00', '4172-04-01'],
    active: true,
  },
  {
    id: 'alert-2',
    kind: 'standard',
    title: 'Remover rebarbas',
    description: 'Remova rebarbas da borda externa antes da embalagem.',
    codes: ['4172-04-00'],
    active: true,
  },
]

const starterPackaging: Packaging[] = [
  { id: 'pack-1', code: '4172-04-00', title: 'Caixa individual · 12 peças', description: 'Proteja cada peça com manta e acomode 12 unidades por caixa.' },
  { id: 'pack-2', code: '4172-04-01', title: 'Separador de papelão', description: 'Use um separador entre camadas e limite a 8 peças por caixa.' },
]

const starterGroups: SimilarGroup[] = [
  { id: 'group-1', name: 'Suportes da transmissão', codes: ['4172-04-00', '4172-04-01'] },
]

function readStorage<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key)
  return saved ? JSON.parse(saved) as T : fallback
}

function imageFileName(path: string): string {
  const fileName = path.split(/[\\/]/).pop() ?? path
  return fileName.replace(/\.[^.]+$/, '')
}

function normalizeImageName(value: string): string {
  return imageFileName(value).trim().toLowerCase()
}

function imageFolderName(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
  const imagesIndex = parts.findIndex(part => part.toLowerCase() === 'images')
  const folderParts = imagesIndex >= 0 ? parts.slice(imagesIndex + 1, -1) : parts.slice(0, -1)
  return folderParts.join('/') || 'Raiz'
}

function ImagePreview({ src, alt, style }: { src?: string; alt: string; style?: CSSProperties }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [src])

  if (!src || failed) {
    return <div className="image-placeholder"><FileImage size={25} /><span>{failed ? 'Imagem indisponível' : 'Sem imagem cadastrada'}</span></div>
  }

  return <img className="image-preview" src={src} alt={alt} loading="lazy" style={style} onError={() => setFailed(true)} />
}

function RelatedDrawingCard({ drawing, onOpen }: { drawing: RelatedDrawing; onOpen: (code: string) => void }) {
  const [zoom, setZoom] = useState(100)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const pan = useRef<{ pointerX: number; pointerY: number } | null>(null)
  const viewer = useRef<HTMLDivElement>(null)

  const zoomTo = (nextZoom: number, anchor = { x: 0, y: 0 }) => {
    const boundedZoom = Math.min(500, Math.max(50, nextZoom))
    if (boundedZoom === zoom) return
    const ratio = boundedZoom / zoom
    setOffset(value => ({
      x: anchor.x - ratio * (anchor.x - value.x),
      y: anchor.y - ratio * (anchor.y - value.y),
    }))
    setZoom(boundedZoom)
  }

  useEffect(() => {
    const stage = viewer.current
    if (!stage || !drawing.image) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const bounds = stage.getBoundingClientRect()
      const factor = Math.exp(-event.deltaY * 0.0015)
      zoomTo(zoom * factor, {
        x: event.clientX - bounds.left - bounds.width / 2,
        y: event.clientY - bounds.top - bounds.height / 2,
      })
    }
    stage.addEventListener('wheel', handleWheel, { passive: false })
    return () => stage.removeEventListener('wheel', handleWheel)
  }, [drawing.image, zoom])

  useEffect(() => {
    setZoom(100)
    setOffset({ x: 0, y: 0 })
    pan.current = null
    setIsPanning(false)
  }, [drawing.image])

  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (!drawing.image || event.button !== 0) return
    event.preventDefault()
    pan.current = { pointerX: event.clientX, pointerY: event.clientY }
    setIsPanning(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    if (!pan.current) return
    const deltaX = event.clientX - pan.current.pointerX
    const deltaY = event.clientY - pan.current.pointerY
    pan.current.pointerX = event.clientX
    pan.current.pointerY = event.clientY
    setOffset(value => ({ x: value.x + deltaX, y: value.y + deltaY }))
  }

  const endPan = () => {
    pan.current = null
    setIsPanning(false)
  }

  return (
    <article className="related-drawing-card">
      <div className="related-drawing-toolbar">
        <span className="similar-image-badge">SEMELHANTE</span>
        {drawing.image && <div className="related-image-controls" aria-label={`Controles da imagem ${drawing.code}`}>
          <button type="button" aria-label={`Diminuir zoom de ${drawing.code}`} disabled={zoom <= 50} onClick={() => zoomTo(zoom - 25)}><ZoomOut size={14} /></button>
          <span>{Math.round(zoom)}%</span>
          <button type="button" aria-label={`Aumentar zoom de ${drawing.code}`} disabled={zoom >= 500} onClick={() => zoomTo(zoom + 25)}><ZoomIn size={14} /></button>
          <button type="button" aria-label={`Redefinir imagem ${drawing.code}`} onClick={() => { setZoom(100); setOffset({ x: 0, y: 0 }) }}><RotateCcw size={13} /></button>
        </div>}
      </div>
      <div ref={viewer} className={`related-drawing-viewer ${drawing.image ? 'image-draggable' : ''} ${isPanning ? 'is-panning' : ''}`} title={drawing.image ? 'Role para ampliar/reduzir; clique e arraste para mover' : undefined} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onLostPointerCapture={endPan}>
        <ImagePreview src={drawing.image} alt={`Desenho técnico ${drawing.code}`} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom / 100})`, transformOrigin: 'center center' }} />
      </div>
      <div className="related-drawing-info"><code>{drawing.code}</code><strong>{drawing.title}</strong></div>
      <button className="related-open-button" type="button" onClick={() => onOpen(drawing.code)}>Abrir este desenho <ChevronRight size={14} /></button>
    </article>
  )
}

function App({ auth }: { auth: AdminAuth }) {
  const [accessMode, setAccessMode] = useState<AccessMode>('welcome')
  const [page, setPage] = useState<Page>('search')
  const [userName, setUserName] = useState('')
  const [userNameInput, setUserNameInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => readStorage<ChatMessage[]>('qg-v1-chat', []))
  const [chatDraft, setChatDraft] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoginError, setAdminLoginError] = useState('')
  const [adminTab, setAdminTab] = useState<AdminTab>('items')
  const [items, setItems] = useState<Item[]>(() => readStorage('qg-v1-items', starterItems))
  const [alerts, setAlerts] = useState<QualityAlert[]>(() => readStorage('qg-v1-alerts', starterAlerts))
  const [packaging, setPackaging] = useState<Packaging[]>(() => readStorage('qg-v1-packaging', starterPackaging))
  const [groups, setGroups] = useState<SimilarGroup[]>(() => readStorage('qg-v1-groups', starterGroups))
  const [itemFolders, setItemFolders] = useState<string[]>(() => readStorage('qg-v1-item-folders', []))
  const [imagePaths, setImagePaths] = useState<string[]>([])
  const [imageError, setImageError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCode, setSelectedCode] = useState('')
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [adminSearch, setAdminSearch] = useState('')
  const [imageSearch, setImageSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formFolder, setFormFolder] = useState('Raiz')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formKind, setFormKind] = useState<'standard' | 'claim'>('standard')
  const [formCodes, setFormCodes] = useState('')
  const [imageFolderFilter, setImageFolderFilter] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [similarCodeInput, setSimilarCodeInput] = useState('')
  const [similarCodes, setSimilarCodes] = useState<string[]>([])
  const [imageZoom, setImageZoom] = useState(100)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [isImagePanning, setIsImagePanning] = useState(false)
  const imagePan = useRef<{ pointerX: number; pointerY: number } | null>(null)
  const drawingStage = useRef<HTMLDivElement>(null)
  const chatLog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (accessMode === 'adminLogin' && auth.authorized) {
      setAccessMode('admin')
      setPage('admin')
    }
  }, [accessMode, auth.authorized])

  useEffect(() => { localStorage.setItem('qg-v1-items', JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem('qg-v1-alerts', JSON.stringify(alerts)) }, [alerts])
  useEffect(() => { localStorage.setItem('qg-v1-packaging', JSON.stringify(packaging)) }, [packaging])
  useEffect(() => { localStorage.setItem('qg-v1-groups', JSON.stringify(groups)) }, [groups])
  useEffect(() => { localStorage.setItem('qg-v1-item-folders', JSON.stringify(itemFolders)) }, [itemFolders])
  useEffect(() => { localStorage.setItem('qg-v1-chat', JSON.stringify(chatMessages)) }, [chatMessages])
  useEffect(() => {
    if (page === 'chat' && chatLog.current) chatLog.current.scrollTop = chatLog.current.scrollHeight
  }, [page, chatMessages])
  useEffect(() => {
    fetch('/images-manifest.json')
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const paths: unknown = await response.json()
        if (!Array.isArray(paths) || !paths.every(path => typeof path === 'string')) {
          throw new Error('O catálogo de imagens tem formato inválido.')
        }
        setImagePaths(paths)
      })
      .catch(error => setImageError(`Não foi possível carregar o catálogo de imagens: ${String(error)}`))
  }, [])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const availableFolders = useMemo(
    () => Array.from(new Set([
      ...imagePaths.map(imageFolderName),
      ...itemFolders,
      ...items.map(item => item.folder).filter((folder): folder is string => Boolean(folder)),
    ])).sort((a, b) => a.localeCompare(b)),
    [imagePaths, itemFolders, items],
  )
  const selectedItem = items.find(item => item.code.toLowerCase() === selectedCode.toLowerCase())
  const matchingImage = imagePaths.find(path => normalizeImageName(path) === normalizeImageName(selectedCode))
  const resultItem = selectedItem
    ? { ...selectedItem, image: selectedItem.image || matchingImage }
    : matchingImage
      ? { code: imageFileName(matchingImage), title: imageFileName(matchingImage), image: matchingImage }
      : undefined
  const activeAlerts = resultItem
    ? alerts.filter(alert => alert.active && alert.codes.includes(resultItem.code))
      .sort((a, b) => a.kind === b.kind ? 0 : a.kind === 'claim' ? -1 : 1)
    : []
  const selectedPackaging = resultItem ? packaging.find(entry => entry.code === resultItem.code) : undefined
  const similarDrawings = useMemo(() => {
    if (!resultItem) return []
    const resultCode = resultItem.code.trim().toLowerCase()
    const group = groups.find(entry => entry.codes.some(code => code.trim().toLowerCase() === resultCode))
    return group
      ? group.codes
        .filter(code => code.trim().toLowerCase() !== resultCode)
        .map(code => {
          const item = items.find(entry => entry.code.trim().toLowerCase() === code.trim().toLowerCase())
          const image = item?.image || imagePaths.find(path => normalizeImageName(path) === normalizeImageName(code))
          return { code: item?.code ?? code, title: item?.title ?? code, image }
        })
      : []
  }, [groups, imagePaths, items, resultItem])

  useEffect(() => {
    setImageZoom(100)
    setImageOffset({ x: 0, y: 0 })
    imagePan.current = null
    setIsImagePanning(false)
  }, [resultItem?.code])

  const zoomImageAt = (nextZoom: number, anchor = { x: 0, y: 0 }) => {
    const boundedZoom = Math.min(500, Math.max(50, nextZoom))
    if (boundedZoom === imageZoom) return
    const ratio = boundedZoom / imageZoom
    setImageOffset(offset => ({
      x: anchor.x - ratio * (anchor.x - offset.x),
      y: anchor.y - ratio * (anchor.y - offset.y),
    }))
    setImageZoom(boundedZoom)
  }

  useEffect(() => {
    const stage = drawingStage.current
    if (!stage) return
    const handleWheel = (event: WheelEvent) => {
      if (!resultItem?.image || (alertModalOpen && activeAlerts.length > 0)) return
      event.preventDefault()
      const bounds = stage.getBoundingClientRect()
      const factor = Math.exp(-event.deltaY * 0.0015)
      zoomImageAt(imageZoom * factor, {
        x: event.clientX - bounds.left - bounds.width / 2,
        y: event.clientY - bounds.top - bounds.height / 2,
      })
    }
    stage.addEventListener('wheel', handleWheel, { passive: false })
    return () => stage.removeEventListener('wheel', handleWheel)
  }, [imageZoom, resultItem?.image, alertModalOpen, activeAlerts.length])

  const startImagePan = (event: PointerEvent<HTMLDivElement>) => {
    if (!resultItem?.image || (alertModalOpen && activeAlerts.length > 0) || event.button !== 0) return
    event.preventDefault()
    imagePan.current = { pointerX: event.clientX, pointerY: event.clientY }
    setIsImagePanning(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveImagePan = (event: PointerEvent<HTMLDivElement>) => {
    if (!imagePan.current) return
    const deltaX = event.clientX - imagePan.current.pointerX
    const deltaY = event.clientY - imagePan.current.pointerY
    imagePan.current.pointerX = event.clientX
    imagePan.current.pointerY = event.clientY
    setImageOffset(offset => ({
      x: offset.x + deltaX,
      y: offset.y + deltaY,
    }))
  }

  const endImagePan = () => {
    imagePan.current = null
    setIsImagePanning(false)
  }

  const addSimilarCode = () => {
    const code = similarCodeInput.trim()
    if (!code) return
    if (similarCodes.length >= 10) {
      setNotice('Um grupo pode ter no máximo 10 códigos.')
      return
    }
    if (similarCodes.some(value => value.toLowerCase() === code.toLowerCase())) {
      setNotice('Esse código já foi adicionado ao grupo.')
      return
    }
    setSimilarCodes([...similarCodes, code])
    setSimilarCodeInput('')
  }

  const requestAdminAccess = () => {
    if (auth.authorized) {
      setAccessMode('admin')
      setPage('admin')
      return
    }
    setAdminPassword('')
    setAdminLoginError('')
    setAccessMode('adminLogin')
  }

  const enterAsUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = userNameInput.trim()
    if (!name) return
    setUserName(name)
    setAccessMode('user')
    setPage('search')
    setChatDraft('')
    setQuery('')
    setSelectedCode('')
    setAlertModalOpen(false)
  }

  const signOut = () => {
    setAdminPassword('')
    setAdminLoginError('')
    setAccessMode('user')
    setPage('search')
    void auth.logout().catch(error => setNotice(`Não foi possível encerrar a sessão: ${String(error)}`))
  }

  const chooseAnotherProfile = () => {
    if (accessMode === 'admin') {
      void auth.logout().catch(error => setNotice(`Não foi possível encerrar a sessão administrativa: ${String(error)}`))
    }
    setAccessMode('welcome')
    setPage('search')
    setUserName('')
    setUserNameInput('')
    setChatDraft('')
    setAdminPassword('')
    setAdminLoginError('')
    setAlertModalOpen(false)
  }

  const submitAdminLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!adminPassword || auth.loading || !auth.configured) return
    setAdminLoginError('')
    void auth.login(adminPassword).then(() => {
      setAdminPassword('')
      setAccessMode('admin')
      setPage('admin')
    }).catch(error => {
      setAdminPassword('')
      setAdminLoginError(error instanceof Error ? error.message : String(error))
    })
  }

  const sendChatMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = chatDraft.trim()
    if (!text || (accessMode !== 'user' && accessMode !== 'admin')) return
    if (accessMode === 'admin' && !auth.authorized) {
      setNotice('Entre novamente com uma conta administradora para enviar mensagens.')
      return
    }
    setChatMessages(messages => [...messages, {
      id: crypto.randomUUID(),
      author: userName,
      role: accessMode,
      text,
      createdAt: new Date().toISOString(),
    }])
    setChatDraft('')
  }

  const openItem = (code: string) => {
    setSelectedCode(code)
    setQuery(code)
    setPage('search')
    setAlertModalOpen(alerts.some(alert => alert.active && alert.codes.includes(code)))
  }

  const openSearchPage = () => {
    setPage('search')
    const code = resultItem?.code ?? selectedCode
    setAlertModalOpen(alerts.some(alert => alert.active && alert.codes.includes(code)))
  }

  const searchItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const match = items.find(item => item.code.toLowerCase() === query.trim().toLowerCase())
    if (match) {
      setSelectedCode(match.code)
      setAlertModalOpen(alerts.some(alert => alert.active && alert.codes.includes(match.code)))
      setNotice(`Item encontrado: ${match.code}`)
    } else {
      const image = imagePaths.find(path => normalizeImageName(path) === normalizeImageName(query))
      if (image) {
        const name = imageFileName(image)
        setSelectedCode(name)
        setAlertModalOpen(alerts.some(alert => alert.active && alert.codes.includes(name)))
        setNotice(`Imagem encontrada pelo nome: ${name}`)
        return
      }
      setSelectedCode(query.trim())
      setAlertModalOpen(false)
      setNotice('Código ou imagem não encontrado.')
    }
  }

  const resolveImageForCode = (code: string) => {
    const normalizedCode = code.trim().toLowerCase()
    const itemImage = items.find(item => item.code.trim().toLowerCase() === normalizedCode)?.image
    return itemImage || imagePaths.find(path => normalizeImageName(path) === normalizeImageName(code))
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormCode('')
    setFormFolder(availableFolders[0] ?? 'Raiz')
    setFormTitle('')
    setFormDescription('')
    setFormImage('')
    setFormCodes('')
    setFormKind('standard')
    setSimilarCodeInput('')
    setSimilarCodes([])
    setShowNewFolder(false)
    setNewFolderName('')
  }

  const editAlert = (alert: QualityAlert) => {
    resetForm()
    setAdminTab('alerts')
    setShowForm(true)
    setEditingId(alert.id)
    setFormKind(alert.kind)
    setFormTitle(alert.title)
    setFormDescription(alert.description)
    setFormCodes(alert.codes.join(', '))
    setFormImage(alert.image ? imageFileName(alert.image) : '')
  }

  const editSimilarGroup = (group: SimilarGroup) => {
    resetForm()
    setAdminTab('similar')
    setShowForm(true)
    setEditingId(group.id)
    setFormTitle(group.name)
    setSimilarCodes([...group.codes])
  }

  const createFolder = () => {
    const folder = newFolderName.trim().replace(/^\/+|\/+$/g, '')
    if (!folder) return
    if (availableFolders.some(value => value.toLowerCase() === folder.toLowerCase())) {
      setNotice(`A pasta "${folder}" já existe.`)
      return
    }
    setItemFolders([...itemFolders, folder])
    setFormFolder(folder)
    setImageFolderFilter(folder)
    setNewFolderName('')
    setShowNewFolder(false)
    setNotice('Pasta de organização criada neste navegador.')
  }

  const saveForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = formCode.trim()
    const title = formTitle.trim()
    const codes = adminTab === 'similar' ? similarCodes : formCodes.split(/[,;\n]/).map(value => value.trim()).filter(Boolean)

    if (adminTab === 'items') {
      if (!code || items.some(item => item.code.toLowerCase() === code.toLowerCase())) {
        setNotice('Informe um código único para o item.')
        return
      }
      setItems([...items, { code, title, folder: formFolder || 'Raiz', image: formImage.trim() || undefined }])
    } else if (adminTab === 'alerts') {
      if (!codes.length) {
        setNotice('Informe pelo menos um código de item.')
        return
      }
      const imageCode = formImage.trim()
      const image = imageCode ? resolveImageForCode(imageCode) : undefined
      if (imageCode && !image) {
        setNotice(`Não encontrei uma imagem para o código "${imageCode}".`)
        return
      }
      if (editingId) {
        setAlerts(alerts.map(alert => alert.id === editingId
          ? { ...alert, kind: formKind, title, description: formDescription.trim(), codes, image }
          : alert))
      } else {
        setAlerts([...alerts, { id: crypto.randomUUID(), kind: formKind, title, description: formDescription.trim(), codes, active: true, image }])
      }
    } else if (adminTab === 'packaging') {
      if (!items.some(item => item.code.toLowerCase() === code.toLowerCase())) {
        setNotice('O código precisa corresponder a um item cadastrado.')
        return
      }
      setPackaging([...packaging, { id: crypto.randomUUID(), code, title, description: formDescription.trim(), image: formImage.trim() || undefined }])
    } else if (adminTab === 'similar') {
      if (codes.length < 2 || codes.length > 10) {
        setNotice('Informe de 2 a 10 códigos para o grupo.')
        return
      }
      if (editingId) {
        setGroups(groups.map(group => group.id === editingId ? { ...group, name: title, codes } : group))
      } else {
        setGroups([...groups, { id: crypto.randomUUID(), name: title, codes }])
      }
    }

    resetForm()
    setNotice('Cadastro salvo neste dispositivo.')
  }

  const removeItem = (code: string) => {
    setItems(items.filter(item => item.code !== code))
    setAlerts(alerts.flatMap(alert => {
      const remainingCodes = alert.codes.filter(value => value !== code)
      return remainingCodes.length ? [{ ...alert, codes: remainingCodes }] : []
    }))
    setPackaging(packaging.filter(entry => entry.code !== code))
    setGroups(groups.flatMap(group => {
      const remainingCodes = group.codes.filter(value => value !== code)
      return remainingCodes.length > 1 ? [{ ...group, codes: remainingCodes }] : []
    }))
  }

  const filteredItems = items.filter(item => `${item.code} ${item.title}`.toLowerCase().includes(adminSearch.toLowerCase()))
  const filteredAlerts = alerts.filter(alert => `${alert.title} ${alert.codes.join(' ')}`.toLowerCase().includes(adminSearch.toLowerCase()))
  const filteredImages = imagePaths.filter(path =>
    (!imageFolderFilter || imageFolderName(path) === imageFolderFilter)
    && path.toLowerCase().includes(imageSearch.toLowerCase()),
  )

  const assignImage = (code: string, path: string) => {
    if (!code) return
    setItems(items.map(item => item.code === code ? { ...item, image: path } : item))
    setNotice('Imagem vinculada ao item.')
  }

  const tabs: { id: AdminTab; title: string; icon: typeof Box }[] = [
    { id: 'items', title: 'Itens', icon: Box },
    { id: 'alerts', title: 'Alertas', icon: AlertTriangle },
    { id: 'packaging', title: 'Embalagem', icon: PackageCheck },
    { id: 'similar', title: 'Semelhantes', icon: Layers3 },
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={event => { event.preventDefault(); accessMode === 'user' || accessMode === 'admin' ? openSearchPage() : chooseAnotherProfile() }}>
          <span className="brand-mark"><ShieldCheck size={19} /></span>
          <span>quality<span>gate</span><sup>2.0</sup></span>
        </a>
        {(accessMode === 'user' || accessMode === 'admin') && <nav className="main-nav" aria-label="Navegação principal">
          <button className={page === 'search' ? 'active' : ''} onClick={openSearchPage}><Search size={16} /> Pesquisa</button>
          <button className={page === 'chat' ? 'active' : ''} onClick={() => setPage('chat')}><MessageCircle size={16} /> Chat</button>
          <button className={page === 'admin' ? 'active' : ''} onClick={requestAdminAccess}><ShieldCheck size={16} /> Administração</button>
        </nav>}
        {(accessMode === 'user' || accessMode === 'admin') && <div className="user-session-chip"><span>{accessMode === 'admin' ? 'Administrador' : 'Usuário'}: {userName}</span>{accessMode === 'admin' && <button className="auth-action" onClick={signOut}><LogOut size={14} /> Sair Admin</button>}<button className="auth-action" onClick={chooseAnotherProfile}>Trocar usuário</button></div>}
        {accessMode === 'adminLogin' && <span className="admin-login-label">Acesso restrito</span>}
      </header>

      <main className="page">
        {accessMode === 'welcome' && <section className="access-screen">
          <div className="page-heading"><div><span className="eyebrow">BEM-VINDO AO QUALITY GATE</span><h1>Entrar como usuário</h1><p>Digite seu nome para usar o Quality Gate.</p></div></div>
          <div className="access-options single">
            <article className="panel access-card">
              <span className="access-card-icon"><Search size={22} /></span>
              <h2>Usuário</h2>
              <p>Consulte desenhos, alertas de qualidade e padrões de embalagem.</p>
              <form className="user-entry-form" onSubmit={enterAsUser}>
                <label htmlFor="user-display-name">Seu nome</label>
                <input id="user-display-name" required maxLength={80} autoComplete="name" value={userNameInput} onChange={event => setUserNameInput(event.target.value)} placeholder="Digite seu nome" />
                <button className="button primary" type="submit">Entrar como usuário <ChevronRight size={15} /></button>
              </form>
            </article>
          </div>
        </section>}

        {accessMode === 'adminLogin' && <section className="admin-login-screen">
          <button className="back-button" type="button" onClick={() => { setAdminPassword(''); setAdminLoginError(''); setAccessMode(userName ? 'user' : 'welcome') }}><ChevronRight size={14} /> Voltar ao app</button>
          <div className="panel admin-login-panel">
            <span className="access-card-icon admin"><ShieldCheck size={22} /></span>
            <span className="eyebrow">ÁREA RESTRITA</span>
            <h1>Acessar Administração</h1>
            <p>Digite a senha administrativa para abrir a área de gestão.</p>
            {auth.loading && <div className="auth-setup-notice" role="status">Verificando configuração do servidor...</div>}
            {!auth.configured && !auth.loading && <div className="auth-setup-notice" role="status">{auth.error || 'Configure ADMIN_PASSWORD e ADMIN_SESSION_SECRET nas variáveis de ambiente do servidor Vercel.'}</div>}
            {adminLoginError && <div className="auth-denied-notice" role="alert">{adminLoginError}</div>}
            <form className="admin-login-form" onSubmit={submitAdminLogin}>
              <label htmlFor="admin-password">Senha de administrador</label>
              <input id="admin-password" type="password" autoComplete="current-password" maxLength={512} required value={adminPassword} onChange={event => setAdminPassword(event.target.value)} />
              <button className="button primary" type="submit" disabled={!auth.configured || auth.loading || !adminPassword}> <LogIn size={15} />{auth.loading ? 'Aguarde...' : 'Acessar Administração'}</button>
            </form>
            <p className="admin-registration-note">A senha é validada no servidor e não fica gravada no código enviado ao navegador.</p>
          </div>
        </section>}

        {(accessMode === 'user' || accessMode === 'admin') && page === 'search' && (
          <section>
            <div className="page-heading"><div><span className="eyebrow">CONSULTA DE DESENHOS</span><h1>Encontre seu desenho</h1><p>Pesquise pelo código para consultar imagem, alertas e embalagem.</p></div></div>
            <form className="search-bar" onSubmit={searchItem}>
              <Search size={19} />
              <input aria-label="Código do item" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex.: 4172-04-00" />
              <button className="button primary" type="submit">Pesquisar <ChevronRight size={16} /></button>
            </form>
            {resultItem ? (
              <>
                <div className="result-title"><div><span className="eyebrow">RESULTADO</span><h2>{resultItem.title}</h2></div><code>{resultItem.code}</code></div>
                {activeAlerts.length > 0 && <section className="panel result-alerts" aria-labelledby="result-alerts-title">
                  <div className="panel-heading"><div><span className="eyebrow">QUALIDADE</span><h3 id="result-alerts-title">Alertas ativos</h3></div><AlertTriangle size={18} /></div>
                  {activeAlerts.map(alert => <article className={`alert-card ${alert.kind}`} key={alert.id}><span className="alert-type">{alert.kind === 'claim' ? 'RECLAMAÇÃO · PRIORIDADE' : 'ALERTA PADRÃO'}</span><h4>{alert.title}</h4><p>{alert.description}</p>{alert.image && <ImagePreview src={alert.image} alt={alert.title} />}</article>)}
                </section>}
                <div className={`result-grid ${similarDrawings.length ? 'has-similar' : ''}`}>
                  <section className="panel drawing-panel">
                    <div className="panel-heading"><div><span className="eyebrow">DESENHO / IMAGEM</span><h3>{resultItem.code}</h3></div>{resultItem.image ? <div className="image-zoom-controls" aria-label="Controles da imagem"><button type="button" aria-label="Diminuir zoom" title="Diminuir zoom" disabled={imageZoom <= 50} onClick={() => zoomImageAt(imageZoom - 25)}><ZoomOut size={15} /></button><span>{Math.round(imageZoom)}%</span><button type="button" aria-label="Aumentar zoom" title="Aumentar zoom" disabled={imageZoom >= 500} onClick={() => zoomImageAt(imageZoom + 25)}><ZoomIn size={15} /></button><button type="button" aria-label="Redefinir zoom e posição" title="Redefinir zoom e posição" onClick={() => { setImageZoom(100); setImageOffset({ x: 0, y: 0 }) }}><RotateCcw size={14} /></button></div> : <FileImage size={19} />}</div>
                    <div ref={drawingStage} className={`drawing-stage ${resultItem.image ? 'image-draggable' : ''} ${isImagePanning ? 'is-panning' : ''} ${similarDrawings.length ? 'searched-image' : ''}`} title={resultItem.image ? 'Role para ampliar/reduzir; clique e arraste para mover a imagem' : undefined} onPointerDown={startImagePan} onPointerMove={moveImagePan} onPointerUp={endImagePan} onPointerCancel={endImagePan} onLostPointerCapture={endImagePan}>{similarDrawings.length > 0 && <span className="searched-image-badge">PESQUISADO</span>}{alertModalOpen && activeAlerts.length > 0 ? <div className="image-blocked-notice"><ShieldCheck size={25} /><strong>Desenho protegido por alerta</strong><span>Confirme os avisos para visualizar a imagem.</span></div> : <ImagePreview src={resultItem.image} alt={`Desenho técnico ${resultItem.code}`} style={{ transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${imageZoom / 100})`, transformOrigin: 'center center' }} />}</div>
                  </section>
                  {similarDrawings.length > 0 && <section className="panel related-drawings" aria-label="Imagens dos itens semelhantes"><div className="related-drawings-heading"><div><span className="eyebrow">COMPARAÇÃO</span><h4>Itens semelhantes</h4></div><span>{similarDrawings.length} semelhantes</span></div><div className="related-drawings-grid">{similarDrawings.map(drawing => <RelatedDrawingCard key={drawing.code} drawing={drawing} onOpen={openItem} />)}</div></section>}
                  <div className="info-column">
                    <section className="panel">
                      <div className="panel-heading"><div><span className="eyebrow">EMBALAGEM</span><h3>{selectedPackaging?.title ?? 'Sem padrão cadastrado'}</h3></div><PackageCheck size={18} /></div>
                      <p className="body-copy">{selectedPackaging?.description ?? 'Nenhuma instrução de embalagem cadastrada para este item.'}</p>
                    </section>
                  </div>
                </div>
              </>
            ) : query.trim() || selectedCode ? <div className="empty-state"><CircleHelp size={25} /><h2>Nenhum item encontrado</h2><p>Confira o código ou peça ao administrador para cadastrar o item.</p></div> : null}
          </section>
        )}

        {(accessMode === 'user' || accessMode === 'admin') && page === 'chat' && <section className="chat-page">
          <div className="page-heading"><div><span className="eyebrow">COMUNICAÇÃO</span><h1>Chat</h1><p>Converse com quem usa este app neste navegador.</p></div></div>
          <div className="chat-local-notice" role="note">Chat de teste: as mensagens ficam salvas apenas neste navegador e não aparecem para pessoas em outros dispositivos.</div>
          <div className="panel chat-panel">
            <div className="chat-log" ref={chatLog} role="log" aria-live="polite" aria-label="Mensagens do chat">
              {chatMessages.map(message => <article className={`chat-message ${message.role === 'admin' ? 'admin' : ''}`} key={message.id}>
                <div className="chat-message-meta"><strong>{message.author}</strong><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time></div>
                <p>{message.text}</p>
              </article>)}
              {!chatMessages.length && <div className="chat-empty"><MessageCircle size={22} /><span>Não há mensagens ainda. Comece a conversa.</span></div>}
            </div>
            <form className="chat-composer" onSubmit={sendChatMessage}>
              <label className="visually-hidden" htmlFor="chat-message">Escreva uma mensagem</label>
              <textarea id="chat-message" value={chatDraft} onChange={event => setChatDraft(event.target.value)} maxLength={1000} rows={2} placeholder="Digite sua mensagem..." />
              <button className="button primary" type="submit" disabled={!chatDraft.trim()}><MessageCircle size={15} /> Enviar</button>
            </form>
          </div>
        </section>}

        {accessMode === 'admin' && page === 'admin' && auth.authorized && <section>
          <div className="page-heading"><div><span className="eyebrow">GESTÃO DA BASE DE DADOS</span><h1>Painel administrativo</h1><p>Os dados ficam salvos apenas neste navegador.</p></div><span className="demo-warning">Dados locais</span></div>
          <div className="metrics"><article><Box size={18} /><span><small>ITENS</small><strong>{items.length}</strong></span></article><article><AlertTriangle size={18} /><span><small>ALERTAS ATIVOS</small><strong>{alerts.filter(alert => alert.active).length}</strong></span></article><article><PackageCheck size={18} /><span><small>PADRÕES</small><strong>{packaging.length}</strong></span></article><article><Image size={18} /><span><small>IMAGENS</small><strong>{imagePaths.length}</strong></span></article></div>
          <div className="panel admin-panel">
            <div className="admin-tabs">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} className={adminTab === tab.id ? 'active' : ''} onClick={() => { resetForm(); setAdminTab(tab.id); setAdminSearch('') }}><Icon size={15} />{tab.title}</button> })}</div>
            <div className="admin-content">
              <div className="admin-heading"><div><h2>{tabs.find(tab => tab.id === adminTab)?.title}</h2><p>{adminTab === 'items' ? 'Cadastre itens, escolha uma pasta e gerencie os desenhos disponíveis.' : adminTab === 'similar' ? 'Adicione códigos um por vez; cada grupo aceita até 10.' : adminTab === 'alerts' ? 'Cadastre alertas e edite os registros existentes.' : 'Cadastre e mantenha os dados de demonstração.'}</p></div><button className="button primary" onClick={() => showForm ? resetForm() : setShowForm(true)}>{showForm ? <X size={15} /> : <Plus size={16} />}{showForm ? 'Cancelar' : 'Adicionar'}</button></div>
              {adminTab !== 'similar' && <label className="filter-field"><Search size={15} /><input value={adminSearch} onChange={event => setAdminSearch(event.target.value)} placeholder="Filtrar registros" /></label>}
              {showForm && <form className="record-form" onSubmit={saveForm}>
                {(adminTab === 'items' || adminTab === 'packaging') && <label>Código<input required value={formCode} onChange={event => setFormCode(event.target.value)} placeholder="Ex.: 4172-04-02" /></label>}
                {adminTab === 'alerts' && <label>Tipo<select value={formKind} onChange={event => setFormKind(event.target.value as 'standard' | 'claim')}><option value="standard">Alerta padrão</option><option value="claim">Reclamação</option></select></label>}
                <label>{adminTab === 'similar' ? 'Nome do grupo' : 'Título'}<input required value={formTitle} onChange={event => setFormTitle(event.target.value)} placeholder="Título descritivo" /></label>
                {adminTab === 'items' && <label>Pasta do item<select value={formFolder} onChange={event => { setFormFolder(event.target.value); setImageFolderFilter(event.target.value) }}>{Array.from(new Set([formFolder, ...availableFolders])).map(folder => <option key={folder} value={folder}>{folder}</option>)}</select></label>}
                {adminTab === 'items' && <div className="folder-create-control">{showNewFolder ? <><label htmlFor="new-folder-name">Criar pasta de organização</label><div className="folder-create-entry"><input id="new-folder-name" value={newFolderName} onChange={event => setNewFolderName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); createFolder() } }} placeholder="Nome da pasta" /><button className="button secondary" type="button" disabled={!newFolderName.trim()} onClick={createFolder}>Criar</button><button className="button secondary" type="button" onClick={() => { setShowNewFolder(false); setNewFolderName('') }}>Cancelar</button></div></> : <button className="button secondary" type="button" onClick={() => setShowNewFolder(true)}><FolderOpen size={14} />Criar pasta</button>}</div>}
                {adminTab === 'alerts' && <label className="wide">Códigos separados por vírgula<input required value={formCodes} onChange={event => setFormCodes(event.target.value)} placeholder="4172-04-00, AX-2084" /></label>}
                {adminTab === 'similar' && <div className="wide similar-code-field"><label htmlFor="similar-code-input">Código do item</label><div className="similar-code-entry"><input id="similar-code-input" value={similarCodeInput} onChange={event => setSimilarCodeInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addSimilarCode() } }} placeholder="Digite um código e pressione OK" /><button className="button secondary" type="button" disabled={!similarCodeInput.trim() || similarCodes.length >= 10} onClick={addSimilarCode}>OK</button></div><div className="similar-code-list">{similarCodes.map(code => <span className="similar-code-chip" key={code}>{code}<button type="button" aria-label={`Remover código ${code}`} onClick={() => setSimilarCodes(similarCodes.filter(value => value !== code))}><X size={12} /></button></span>)}</div><small>{similarCodes.length} de 10 códigos adicionados. {similarCodes.length < 2 ? 'Informe pelo menos 2 antes de salvar.' : 'Pronto para salvar.'}</small></div>}
                {(adminTab === 'alerts' || adminTab === 'packaging') && <label className="wide">Descrição<textarea value={formDescription} onChange={event => setFormDescription(event.target.value)} rows={3} /></label>}
                {adminTab === 'alerts' && <label className="wide">Código da imagem (opcional)<input value={formImage} onChange={event => setFormImage(event.target.value)} placeholder="Ex.: 020041P1" /></label>}
                {(adminTab === 'items' || adminTab === 'packaging') && <label className="wide">Caminho da imagem (opcional)<input value={formImage} onChange={event => setFormImage(event.target.value)} placeholder="/images/4172-04-02.png" /></label>}
                <button className="button primary" type="submit"><Check size={15} />{editingId ? 'Salvar alterações' : 'Salvar cadastro'}</button>
              </form>}
              {adminTab === 'items' && <>
                <div className="table-scroll"><table><thead><tr><th>CÓDIGO</th><th>TÍTULO</th><th>PASTA</th><th>IMAGEM</th><th /></tr></thead><tbody>{filteredItems.map(item => <tr key={item.code}><td><code>{item.code}</code></td><td>{item.title}</td><td>{item.folder || 'Raiz'}</td><td>{item.image ? <img className="item-image-thumb" src={item.image} alt={`Imagem de ${item.code}`} /> : 'Sem imagem'}</td><td><button className="icon-action" aria-label={`Excluir ${item.code}`} onClick={() => removeItem(item.code)}><Trash2 size={15} /></button></td></tr>)}</tbody></table>{!filteredItems.length && <p className="empty-note">Nenhum item encontrado.</p>}</div>
                <section className="items-image-library">
                  <div className="image-library-heading"><div><h3>Imagens disponíveis</h3><p>{imagePaths.length} arquivo(s) encontrados. Selecione uma pasta para ver suas imagens; para adicionar arquivos, inclua-os em `public/images/` no projeto.</p></div><div className="image-library-filters"><label className="filter-field folder-filter"><FolderOpen size={15} /><select aria-label="Filtrar imagens por pasta" value={imageFolderFilter} onChange={event => setImageFolderFilter(event.target.value)}><option value="">Todas as pastas</option>{availableFolders.map(folder => <option key={folder} value={folder}>{folder}</option>)}</select></label><label className="filter-field"><Search size={15} /><input value={imageSearch} onChange={event => setImageSearch(event.target.value)} placeholder="Filtrar imagens" /></label></div></div>
                  {imageError && <p className="error-note">{imageError}</p>}
                  <div className="image-grid">{filteredImages.map(path => { const assigned = items.find(item => item.image === path); return <article className="image-card" key={path}><div className="image-card-preview"><ImagePreview src={path} alt={path.split('/').pop() ?? 'Imagem'} /></div><div className="image-card-info"><strong>{path.split('/').pop()}</strong><code>{path}</code><label>Vincular ao item<select value={assigned?.code ?? ''} onChange={event => assignImage(event.target.value, path)}><option value="">Selecionar item...</option>{items.map(item => <option key={item.code} value={item.code}>{item.code} · {item.title}</option>)}</select></label></div></article>})}</div>
                  {!filteredImages.length && <p className="empty-note">{imagePaths.length ? `Nenhuma imagem corresponde aos filtros${imageFolderFilter ? ` na pasta "${imageFolderFilter}"` : ''}.` : 'Nenhuma imagem encontrada. Adicione arquivos em public/images/ ou suas subpastas e publique o projeto.'}</p>}
                </section>
              </>}
              {adminTab === 'alerts' && <div className="table-scroll"><table><thead><tr><th>TIPO</th><th>TÍTULO</th><th>CÓDIGOS</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>{filteredAlerts.map(alert => <tr key={alert.id}><td>{alert.kind === 'claim' ? 'Reclamação' : 'Padrão'}</td><td>{alert.title}</td><td>{alert.codes.join(', ')}</td><td><button className={`status-toggle ${alert.active ? 'on' : ''}`} onClick={() => setAlerts(alerts.map(entry => entry.id === alert.id ? { ...entry, active: !entry.active } : entry))}>{alert.active ? 'Ativo' : 'Inativo'}</button></td><td className="table-actions"><button className="icon-action" aria-label={`Editar ${alert.title}`} onClick={() => editAlert(alert)}><Pencil size={15} /></button><button className="icon-action" aria-label={`Excluir ${alert.title}`} onClick={() => setAlerts(alerts.filter(entry => entry.id !== alert.id))}><Trash2 size={15} /></button></td></tr>)}</tbody></table>{!filteredAlerts.length && <p className="empty-note">Nenhum alerta encontrado.</p>}</div>}
              {adminTab === 'packaging' && <div className="table-scroll"><table><thead><tr><th>CÓDIGO</th><th>TÍTULO</th><th>DESCRIÇÃO</th><th /></tr></thead><tbody>{packaging.filter(entry => `${entry.code} ${entry.title}`.toLowerCase().includes(adminSearch.toLowerCase())).map(entry => <tr key={entry.id}><td><code>{entry.code}</code></td><td>{entry.title}</td><td>{entry.description}</td><td><button className="icon-action" aria-label={`Excluir ${entry.title}`} onClick={() => setPackaging(packaging.filter(value => value.id !== entry.id))}><Trash2 size={15} /></button></td></tr>)}</tbody></table>{!packaging.length && <p className="empty-note">Nenhum padrão encontrado.</p>}</div>}
              {adminTab === 'similar' && <div className="table-scroll"><table><thead><tr><th>GRUPO</th><th>CÓDIGOS</th><th>QUANTIDADE</th><th>AÇÕES</th></tr></thead><tbody>{groups.map(group => <tr key={group.id}><td>{group.name}</td><td>{group.codes.join(', ')}</td><td>{group.codes.length}/10</td><td className="table-actions"><button className="icon-action" aria-label={`Editar ${group.name}`} onClick={() => editSimilarGroup(group)}><Pencil size={15} /></button><button className="icon-action" aria-label={`Excluir ${group.name}`} onClick={() => setGroups(groups.filter(value => value.id !== group.id))}><Trash2 size={15} /></button></td></tr>)}</tbody></table>{!groups.length && <p className="empty-note">Nenhum grupo cadastrado.</p>}</div>}
            </div>
          </div>
        </section>}
      </main>
      <footer className="footer"><span>QUALITY GATE · FERRAMENTA DE TESTE</span><span>Dados locais deste navegador</span></footer>
      {alertModalOpen && resultItem && activeAlerts.length > 0 && <div className="alert-dialog-backdrop"><section className={`quality-alert-dialog ${activeAlerts.some(alert => alert.kind === 'claim') ? 'claim' : 'standard'}`} role="dialog" aria-modal="true" aria-labelledby="quality-alert-title"><header className="quality-alert-heading"><span className="quality-alert-icon"><AlertTriangle size={23} /></span><div><span className="dialog-eyebrow">{activeAlerts.some(alert => alert.kind === 'claim') ? 'CLAIM' : 'ALERTA DE QUALIDADE'}</span><h2 id="quality-alert-title">{activeAlerts.some(alert => alert.kind === 'claim') ? 'Este item possui um CLAIM!' : 'Este item possui alerta ativo.'}</h2></div></header><div className="quality-alert-list">{activeAlerts.map(alert => <article className={`quality-alert-entry ${alert.kind}`} key={alert.id}><strong>{alert.title}</strong><p>{alert.description}</p>{alert.image && <ImagePreview src={alert.image} alt={`Imagem relacionada ao alerta ${alert.title}`} />}</article>)}</div><p className="quality-alert-reminder">Verifique as informações antes de prosseguir.</p><button className="quality-alert-confirm" onClick={() => setAlertModalOpen(false)}>OK, entendi</button></section></div>}
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={15} /></button></div>}
    </div>
  )
}

export default App
