import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle, Box, Check, ChevronRight, CircleHelp, FileImage, Image,
  Layers3, PackageCheck, Plus, Search, Settings2, ShieldCheck, Trash2, X,
} from 'lucide-react'

type Page = 'search' | 'packaging' | 'admin'
type AdminTab = 'items' | 'alerts' | 'packaging' | 'similar' | 'images'
type Item = { code: string; title: string; image?: string }
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

function ImagePreview({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [src])

  if (!src || failed) {
    return <div className="image-placeholder"><FileImage size={25} /><span>{failed ? 'Imagem indisponível' : 'Sem imagem cadastrada'}</span></div>
  }

  return <img className="image-preview" src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}

function App() {
  const [page, setPage] = useState<Page>('admin')
  const [adminTab, setAdminTab] = useState<AdminTab>('items')
  const [items, setItems] = useState<Item[]>(() => readStorage('qg-v1-items', starterItems))
  const [alerts, setAlerts] = useState<QualityAlert[]>(() => readStorage('qg-v1-alerts', starterAlerts))
  const [packaging, setPackaging] = useState<Packaging[]>(() => readStorage('qg-v1-packaging', starterPackaging))
  const [groups, setGroups] = useState<SimilarGroup[]>(() => readStorage('qg-v1-groups', starterGroups))
  const [imagePaths, setImagePaths] = useState<string[]>([])
  const [imageError, setImageError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCode, setSelectedCode] = useState('4172-04-00')
  const [adminSearch, setAdminSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formCode, setFormCode] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formKind, setFormKind] = useState<'standard' | 'claim'>('standard')
  const [formCodes, setFormCodes] = useState('')

  useEffect(() => { localStorage.setItem('qg-v1-items', JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem('qg-v1-alerts', JSON.stringify(alerts)) }, [alerts])
  useEffect(() => { localStorage.setItem('qg-v1-packaging', JSON.stringify(packaging)) }, [packaging])
  useEffect(() => { localStorage.setItem('qg-v1-groups', JSON.stringify(groups)) }, [groups])
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

  const selectedItem = items.find(item => item.code.toLowerCase() === selectedCode.toLowerCase())
  const activeAlerts = selectedItem
    ? alerts.filter(alert => alert.active && alert.codes.includes(selectedItem.code))
      .sort((a, b) => a.kind === b.kind ? 0 : a.kind === 'claim' ? -1 : 1)
    : []
  const selectedPackaging = selectedItem ? packaging.find(entry => entry.code === selectedItem.code) : undefined
  const similarItems = useMemo(() => {
    if (!selectedItem) return []
    const group = groups.find(entry => entry.codes.includes(selectedItem.code))
    return group
      ? group.codes.filter(code => code !== selectedItem.code).map(code => items.find(item => item.code === code)).filter((item): item is Item => !!item)
      : []
  }, [groups, items, selectedItem])

  const openItem = (code: string) => {
    setSelectedCode(code)
    setQuery(code)
    setPage('search')
  }

  const searchItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const match = items.find(item => item.code.toLowerCase() === query.trim().toLowerCase())
    if (match) {
      setSelectedCode(match.code)
      setNotice(`Item encontrado: ${match.code}`)
    } else {
      setSelectedCode(query.trim())
      setNotice('Código não encontrado na base.')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setFormCode('')
    setFormTitle('')
    setFormDescription('')
    setFormImage('')
    setFormCodes('')
    setFormKind('standard')
  }

  const saveForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = formCode.trim()
    const title = formTitle.trim()
    const codes = formCodes.split(/[,;\n]/).map(value => value.trim()).filter(Boolean)

    if (adminTab === 'items') {
      if (!code || items.some(item => item.code.toLowerCase() === code.toLowerCase())) {
        setNotice('Informe um código único para o item.')
        return
      }
      setItems([...items, { code, title, image: formImage.trim() || undefined }])
    } else if (adminTab === 'alerts') {
      if (!codes.length) {
        setNotice('Informe pelo menos um código de item.')
        return
      }
      setAlerts([...alerts, { id: crypto.randomUUID(), kind: formKind, title, description: formDescription.trim(), codes, active: true, image: formImage.trim() || undefined }])
    } else if (adminTab === 'packaging') {
      if (!items.some(item => item.code.toLowerCase() === code.toLowerCase())) {
        setNotice('O código precisa corresponder a um item cadastrado.')
        return
      }
      setPackaging([...packaging, { id: crypto.randomUUID(), code, title, description: formDescription.trim(), image: formImage.trim() || undefined }])
    } else if (adminTab === 'similar') {
      if (codes.length < 2) {
        setNotice('Informe pelo menos dois códigos para o grupo.')
        return
      }
      setGroups([...groups, { id: crypto.randomUUID(), name: title, codes }])
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
  const filteredImages = imagePaths.filter(path => path.toLowerCase().includes(adminSearch.toLowerCase()))

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
    { id: 'images', title: 'Imagens', icon: Image },
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={event => { event.preventDefault(); setPage('search') }}>
          <span className="brand-mark"><ShieldCheck size={19} /></span>
          <span>quality<span>gate</span><sup>2.0</sup></span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <button className={page === 'search' ? 'active' : ''} onClick={() => setPage('search')}><Search size={16} /> Pesquisa</button>
          <button className={page === 'packaging' ? 'active' : ''} onClick={() => setPage('packaging')}><PackageCheck size={16} /> Embalagem</button>
          <button className={page === 'admin' ? 'active' : ''} onClick={() => setPage('admin')}><Settings2 size={16} /> Administração</button>
        </nav>
        <div className="admin-chip"><span /> Administrador · demonstração</div>
      </header>

      <main className="page">
        {page === 'search' && (
          <section>
            <div className="page-heading"><div><span className="eyebrow">CONSULTA DE DESENHOS</span><h1>Encontre seu desenho</h1><p>Pesquise pelo código para consultar imagem, alertas e embalagem.</p></div></div>
            <form className="search-bar" onSubmit={searchItem}>
              <Search size={19} />
              <input aria-label="Código do item" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex.: 4172-04-00" />
              <button className="button primary" type="submit">Pesquisar <ChevronRight size={16} /></button>
            </form>
            {selectedItem ? (
              <>
                <div className="result-title"><div><span className="eyebrow">RESULTADO</span><h2>{selectedItem.title}</h2></div><code>{selectedItem.code}</code></div>
                <div className="result-grid">
                  <section className="panel drawing-panel">
                    <div className="panel-heading"><div><span className="eyebrow">DESENHO / IMAGEM</span><h3>{selectedItem.code}</h3></div><FileImage size={19} /></div>
                    <div className="drawing-stage"><ImagePreview src={selectedItem.image} alt={`Desenho técnico ${selectedItem.code}`} /></div>
                  </section>
                  <div className="info-column">
                    <section className="panel">
                      <div className="panel-heading"><div><span className="eyebrow">QUALIDADE</span><h3>Alertas ativos</h3></div><AlertTriangle size={18} /></div>
                      {activeAlerts.length ? activeAlerts.map(alert => <article className={`alert-card ${alert.kind}`} key={alert.id}><span className="alert-type">{alert.kind === 'claim' ? 'RECLAMAÇÃO · PRIORIDADE' : 'ALERTA PADRÃO'}</span><h4>{alert.title}</h4><p>{alert.description}</p>{alert.image && <ImagePreview src={alert.image} alt={alert.title} />}</article>) : <p className="empty-note">Nenhum alerta ativo para este item.</p>}
                    </section>
                    <section className="panel">
                      <div className="panel-heading"><div><span className="eyebrow">EMBALAGEM</span><h3>{selectedPackaging?.title ?? 'Sem padrão cadastrado'}</h3></div><PackageCheck size={18} /></div>
                      <p className="body-copy">{selectedPackaging?.description ?? 'Cadastre um padrão de embalagem no painel administrativo.'}</p>
                    </section>
                    {similarItems.length > 0 && <section className="panel"><div className="panel-heading"><div><span className="eyebrow">COMPARAÇÃO</span><h3>Itens semelhantes</h3></div><Layers3 size={18} /></div><div className="link-list">{similarItems.map(item => <button key={item.code} onClick={() => openItem(item.code)}>{item.code} · {item.title}<ChevronRight size={15} /></button>)}</div></section>}
                  </div>
                </div>
              </>
            ) : <div className="empty-state"><CircleHelp size={25} /><h2>Nenhum item encontrado</h2><p>Confira o código ou cadastre o item no painel administrativo.</p></div>}
          </section>
        )}

        {page === 'packaging' && <section>
          <div className="page-heading"><div><span className="eyebrow">PADRÕES DE ACONDICIONAMENTO</span><h1>Embalagem</h1><p>Consulte as instruções cadastradas para cada código.</p></div></div>
          <div className="packaging-grid">{packaging.map(entry => <article className="panel packaging-card" key={entry.id}><div className="packaging-image"><ImagePreview src={entry.image} alt={entry.title} /></div><span className="eyebrow">{entry.code}</span><h3>{entry.title}</h3><p className="body-copy">{entry.description}</p><button className="text-button" onClick={() => openItem(entry.code)}>Consultar item <ChevronRight size={15} /></button></article>)}</div>
          {!packaging.length && <div className="empty-state"><PackageCheck size={25} /><h2>Nenhum padrão cadastrado</h2><p>Adicione padrões pela área de Administração.</p></div>}
        </section>}

        {page === 'admin' && <section>
          <div className="page-heading"><div><span className="eyebrow">GESTÃO DA BASE DE DADOS</span><h1>Painel administrativo</h1><p>Os dados de teste ficam salvos apenas neste navegador.</p></div><span className="demo-warning">Acesso de demonstração</span></div>
          <div className="metrics"><article><Box size={18} /><span><small>ITENS</small><strong>{items.length}</strong></span></article><article><AlertTriangle size={18} /><span><small>ALERTAS ATIVOS</small><strong>{alerts.filter(alert => alert.active).length}</strong></span></article><article><PackageCheck size={18} /><span><small>PADRÕES</small><strong>{packaging.length}</strong></span></article><article><Image size={18} /><span><small>IMAGENS</small><strong>{imagePaths.length}</strong></span></article></div>
          <div className="panel admin-panel">
            <div className="admin-tabs">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} className={adminTab === tab.id ? 'active' : ''} onClick={() => { setAdminTab(tab.id); setAdminSearch(''); setShowForm(false) }}><Icon size={15} />{tab.title}</button> })}</div>
            <div className="admin-content">
              <div className="admin-heading"><div><h2>{tabs.find(tab => tab.id === adminTab)?.title}</h2><p>{adminTab === 'images' ? 'Imagens em public/images e todas as subpastas.' : 'Cadastre e mantenha os dados de demonstração.'}</p></div>{adminTab !== 'images' && <button className="button primary" onClick={() => setShowForm(!showForm)}>{showForm ? <X size={15} /> : <Plus size={16} />}{showForm ? 'Cancelar' : 'Adicionar'}</button>}</div>
              {adminTab !== 'similar' && adminTab !== 'images' && <label className="filter-field"><Search size={15} /><input value={adminSearch} onChange={event => setAdminSearch(event.target.value)} placeholder="Filtrar registros" /></label>}
              {adminTab === 'images' && <label className="filter-field"><Search size={15} /><input value={adminSearch} onChange={event => setAdminSearch(event.target.value)} placeholder="Filtrar imagens pelo caminho" /></label>}
              {showForm && <form className="record-form" onSubmit={saveForm}>
                {(adminTab === 'items' || adminTab === 'packaging') && <label>Código<input required value={formCode} onChange={event => setFormCode(event.target.value)} placeholder="Ex.: 4172-04-02" /></label>}
                {adminTab === 'alerts' && <label>Tipo<select value={formKind} onChange={event => setFormKind(event.target.value as 'standard' | 'claim')}><option value="standard">Alerta padrão</option><option value="claim">Reclamação</option></select></label>}
                <label>{adminTab === 'similar' ? 'Nome do grupo' : 'Título'}<input required value={formTitle} onChange={event => setFormTitle(event.target.value)} placeholder="Título descritivo" /></label>
                {(adminTab === 'alerts' || adminTab === 'similar') && <label className="wide">Códigos separados por vírgula<input required value={formCodes} onChange={event => setFormCodes(event.target.value)} placeholder="4172-04-00, AX-2084" /></label>}
                {(adminTab === 'alerts' || adminTab === 'packaging') && <label className="wide">Descrição<textarea value={formDescription} onChange={event => setFormDescription(event.target.value)} rows={3} /></label>}
                {(adminTab === 'items' || adminTab === 'alerts' || adminTab === 'packaging') && <label className="wide">Caminho da imagem (opcional)<input value={formImage} onChange={event => setFormImage(event.target.value)} placeholder="/images/4172-04-02.png" /></label>}
                <button className="button primary" type="submit"><Check size={15} /> Salvar cadastro</button>
              </form>}
              {adminTab === 'items' && <div className="table-scroll"><table><thead><tr><th>CÓDIGO</th><th>TÍTULO</th><th>IMAGEM</th><th /></tr></thead><tbody>{filteredItems.map(item => <tr key={item.code}><td><code>{item.code}</code></td><td>{item.title}</td><td>{item.image ? 'Disponível' : 'Sem imagem'}</td><td><button className="icon-action" aria-label={`Excluir ${item.code}`} onClick={() => removeItem(item.code)}><Trash2 size={15} /></button></td></tr>)}</tbody></table>{!filteredItems.length && <p className="empty-note">Nenhum item encontrado.</p>}</div>}
              {adminTab === 'alerts' && <div className="table-scroll"><table><thead><tr><th>TIPO</th><th>TÍTULO</th><th>CÓDIGOS</th><th>STATUS</th><th /></tr></thead><tbody>{filteredAlerts.map(alert => <tr key={alert.id}><td>{alert.kind === 'claim' ? 'Reclamação' : 'Padrão'}</td><td>{alert.title}</td><td>{alert.codes.join(', ')}</td><td><button className={`status-toggle ${alert.active ? 'on' : ''}`} onClick={() => setAlerts(alerts.map(entry => entry.id === alert.id ? { ...entry, active: !entry.active } : entry))}>{alert.active ? 'Ativo' : 'Inativo'}</button></td><td><button className="icon-action" aria-label={`Excluir ${alert.title}`} onClick={() => setAlerts(alerts.filter(entry => entry.id !== alert.id))}><Trash2 size={15} /></button></td></tr>)}</tbody></table>{!filteredAlerts.length && <p className="empty-note">Nenhum alerta encontrado.</p>}</div>}
              {adminTab === 'packaging' && <div className="table-scroll"><table><thead><tr><th>CÓDIGO</th><th>TÍTULO</th><th>DESCRIÇÃO</th><th /></tr></thead><tbody>{packaging.filter(entry => `${entry.code} ${entry.title}`.toLowerCase().includes(adminSearch.toLowerCase())).map(entry => <tr key={entry.id}><td><code>{entry.code}</code></td><td>{entry.title}</td><td>{entry.description}</td><td><button className="icon-action" aria-label={`Excluir ${entry.title}`} onClick={() => setPackaging(packaging.filter(value => value.id !== entry.id))}><Trash2 size={15} /></button></td></tr>)}</tbody></table>{!packaging.length && <p className="empty-note">Nenhum padrão encontrado.</p>}</div>}
              {adminTab === 'similar' && <div className="table-scroll"><table><thead><tr><th>GRUPO</th><th>CÓDIGOS</th><th /></tr></thead><tbody>{groups.map(group => <tr key={group.id}><td>{group.name}</td><td>{group.codes.join(', ')}</td><td><button className="icon-action" aria-label={`Excluir ${group.name}`} onClick={() => setGroups(groups.filter(value => value.id !== group.id))}><Trash2 size={15} /></button></td></tr>)}</tbody></table>{!groups.length && <p className="empty-note">Nenhum grupo cadastrado.</p>}</div>}
              {adminTab === 'images' && <>
                {imageError && <p className="error-note">{imageError}</p>}
                <div className="image-grid">{filteredImages.map(path => { const assigned = items.find(item => item.image === path); return <article className="image-card" key={path}><div className="image-card-preview"><ImagePreview src={path} alt={path.split('/').pop() ?? 'Imagem'} /></div><div className="image-card-info"><strong>{path.split('/').pop()}</strong><code>{path}</code><label>Vincular ao item<select value={assigned?.code ?? ''} onChange={event => assignImage(event.target.value, path)}><option value="">Selecionar item...</option>{items.map(item => <option key={item.code} value={item.code}>{item.code} · {item.title}</option>)}</select></label></div></article>})}</div>
                {!filteredImages.length && <p className="empty-note">{imagePaths.length ? 'Nenhuma imagem corresponde ao filtro.' : 'Nenhuma imagem encontrada. Envie arquivos para public/images/ ou suas subpastas.'}</p>}
              </>}
            </div>
          </div>
        </section>}
      </main>
      <footer className="footer"><span>QUALITY GATE · FERRAMENTA DE TESTE</span><span>Dados locais deste navegador</span></footer>
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={15} /></button></div>}
    </div>
  )
}

export default App
