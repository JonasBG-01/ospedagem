import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AdminSessionApp from './AdminSessionApp'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Não foi encontrado o elemento raiz da aplicação.')
}

const root = createRoot(rootElement)
root.render(<StrictMode><AdminSessionApp /></StrictMode>)
