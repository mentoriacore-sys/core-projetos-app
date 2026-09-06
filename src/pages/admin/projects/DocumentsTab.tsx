import { useEffect, useState } from 'react'
import {
  createFile,
  createLink,
  deleteFile,
  deleteLink,
  listFiles,
  listLinks,
  type ProjectFileInput,
  type ProjectLinkInput,
} from '../../../services/supabase/files'
import { FILE_CATEGORY_OPTIONS, VISIBILITY_OPTIONS } from '../../../types/database'
import type { ProjectFile, ProjectLink } from '../../../types/database'
import { getErrorMessage } from '../../../lib/errorMessage'

interface Props {
  projectId: string
}

function emptyFileForm(projectId: string): Partial<ProjectFileInput> {
  return { project_id: projectId, name: '', category: null, file_or_url: '', file_date: new Date().toISOString().slice(0, 10), visibility: 'both' }
}

function emptyLinkForm(projectId: string): Partial<ProjectLinkInput> {
  return { project_id: projectId, tool: '', purpose: '', url: '', notes: '' }
}

export default function DocumentsTab({ projectId }: Props) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [links, setLinks] = useState<ProjectLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFileForm, setShowFileForm] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [fileForm, setFileForm] = useState<Partial<ProjectFileInput>>(emptyFileForm(projectId))
  const [linkForm, setLinkForm] = useState<Partial<ProjectLinkInput>>(emptyLinkForm(projectId))

  async function reload() {
    setLoading(true)
    try {
      const [f, l] = await Promise.all([listFiles(projectId), listLinks(projectId)])
      setFiles(f)
      setLinks(l)
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar documentos'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleSaveFile() {
    try {
      await createFile(fileForm)
      setShowFileForm(false)
      setFileForm(emptyFileForm(projectId))
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar documento'))
    }
  }

  async function handleSaveLink() {
    try {
      await createLink(linkForm)
      setShowLinkForm(false)
      setLinkForm(emptyLinkForm(projectId))
      await reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar link'))
    }
  }

  async function handleDeleteFile(item: ProjectFile) {
    if (!confirm(`Excluir "${item.name}"?`)) return
    await deleteFile(item.id)
    await reload()
  }

  async function handleDeleteLink(item: ProjectLink) {
    if (!confirm(`Excluir a ferramenta "${item.tool}"?`)) return
    await deleteLink(item.id)
    await reload()
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      {error && <p className="form-error">{error}</p>}

      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Documentos</h2>
        <button className="btn-primary" onClick={() => setShowFileForm(true)}>
          + Novo documento
        </button>
      </div>

      {showFileForm && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label>
              Nome *
              <input value={fileForm.name ?? ''} onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })} />
            </label>
            <label>
              Categoria
              <select
                value={fileForm.category ?? ''}
                onChange={(e) => setFileForm({ ...fileForm, category: (e.target.value || null) as ProjectFileInput['category'] })}
              >
                <option value="">—</option>
                {FILE_CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Link do arquivo (Drive, etc.) *
              <input value={fileForm.file_or_url ?? ''} onChange={(e) => setFileForm({ ...fileForm, file_or_url: e.target.value })} />
            </label>
            <label>
              Visibilidade
              <select
                value={fileForm.visibility}
                onChange={(e) => setFileForm({ ...fileForm, visibility: e.target.value as ProjectFileInput['visibility'] })}
              >
                {VISIBILITY_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="row-actions">
            <button className="btn-primary" onClick={handleSaveFile} type="button">
              Salvar
            </button>
            <button onClick={() => setShowFileForm(false)} type="button">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="empty-state">Nenhum documento cadastrado.</div>
      ) : (
        <table className="data-table" style={{ marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id}>
                <td data-label="Nome">
                  <a href={f.file_or_url} target="_blank" rel="noreferrer">
                    {f.name}
                  </a>
                </td>
                <td data-label="Categoria">{f.category ?? '—'}</td>
                <td data-label="Data">{f.file_date}</td>
                <td data-label="Ações">
                  <div className="row-actions">
                    <button className="danger" onClick={() => handleDeleteFile(f)} type="button">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="page-header">
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Ferramentas e Links</h2>
        <button className="btn-primary" onClick={() => setShowLinkForm(true)}>
          + Novo link
        </button>
      </div>

      {showLinkForm && (
        <div className="inline-form">
          <div className="inline-form-grid">
            <label>
              Ferramenta *
              <input value={linkForm.tool ?? ''} onChange={(e) => setLinkForm({ ...linkForm, tool: e.target.value })} />
            </label>
            <label>
              Finalidade
              <input value={linkForm.purpose ?? ''} onChange={(e) => setLinkForm({ ...linkForm, purpose: e.target.value })} />
            </label>
            <label className="full-width">
              URL *
              <input value={linkForm.url ?? ''} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} />
            </label>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem' }}>
            Nunca coloque senha, token ou credencial aqui — só o link de acesso.
          </p>
          <div className="row-actions">
            <button className="btn-primary" onClick={handleSaveLink} type="button">
              Salvar
            </button>
            <button onClick={() => setShowLinkForm(false)} type="button">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <div className="empty-state">Nenhum link cadastrado.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Ferramenta</th>
              <th>Finalidade</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id}>
                <td data-label="Ferramenta">
                  <a href={l.url} target="_blank" rel="noreferrer">
                    {l.tool}
                  </a>
                </td>
                <td data-label="Finalidade">{l.purpose ?? '—'}</td>
                <td data-label="Ações">
                  <div className="row-actions">
                    <button className="danger" onClick={() => handleDeleteLink(l)} type="button">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
