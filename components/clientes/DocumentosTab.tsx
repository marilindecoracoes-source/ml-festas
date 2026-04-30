'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Download, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ClienteDocumento } from '@/types'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Props {
  clienteId: string
  documentosIniciais: ClienteDocumento[]
}

export default function DocumentosTab({ clienteId, documentosIniciais }: Props) {
  const [documentos, setDocumentos] = useState(documentosIniciais)
  const [enviando, setEnviando] = useState(false)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setEnviando(true)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clienteId', clienteId)

      const res = await fetch(`/api/upload/${clienteId}`, { method: 'POST', body: formData })
      if (res.ok) {
        const doc = await res.json()
        setDocumentos(prev => [...prev, doc])
      } else {
        toast.error(`Erro ao enviar ${file.name}`)
      }
    }

    setEnviando(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function excluirDoc(id: string) {
    const res = await fetch(`/api/upload/${clienteId}?docId=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDocumentos(prev => prev.filter(d => d.id !== id))
      toast.success('Documento excluído.')
    } else {
      toast.error('Erro ao excluir.')
    }
  }

  const isImagem = (nome: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(nome)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-zinc-400 text-sm">{documentos.length} documento{documentos.length !== 1 ? 's' : ''}</p>
        <label className="gold-btn flex items-center gap-2 cursor-pointer text-sm">
          {enviando ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {enviando ? 'Enviando...' : 'Enviar arquivo'}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.gif,.webp"
            onChange={handleUpload}
            disabled={enviando}
          />
        </label>
      </div>

      {documentos.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-700 rounded-xl p-10 text-center">
          <FileText size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Nenhum documento enviado ainda.</p>
          <p className="text-zinc-600 text-xs mt-1">JPG, PNG e PDF aceitos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {documentos.map(doc => (
            <div key={doc.id} className="gold-card p-3 group relative">
              <div className="aspect-square rounded-lg bg-zinc-800 flex items-center justify-center mb-2 overflow-hidden">
                {isImagem(doc.nome_arquivo) ? (
                  <img
                    src={`/uploads/clientes/${clienteId}/${doc.nome_arquivo}`}
                    alt={doc.nome_arquivo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText size={32} className="text-gold/60" />
                )}
              </div>
              <p className="text-xs text-zinc-300 truncate">{doc.nome_arquivo}</p>
              <p className="text-xs text-zinc-600">{doc.tipo}</p>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={`/uploads/clientes/${clienteId}/${doc.nome_arquivo}`}
                  download
                  className="p-1 bg-zinc-700 rounded text-zinc-300 hover:text-white"
                >
                  <Download size={12} />
                </a>
                <button
                  onClick={() => setExcluindo(doc.id)}
                  className="p-1 bg-red-900/50 rounded text-red-400 hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!excluindo}
        onClose={() => setExcluindo(null)}
        onConfirm={() => excluindo && excluirDoc(excluindo)}
        title="Excluir documento"
        message="Tem certeza que deseja excluir este documento?"
        confirmLabel="Excluir"
        danger
      />
    </div>
  )
}
