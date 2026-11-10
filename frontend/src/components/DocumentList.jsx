import { useEffect, useState } from 'react';
import { listDocuments } from '../services/documentApi.js';
import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export default function DocumentList({ userId, refreshKey }) {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listDocuments(userId)
      .then((data) => !cancelled && setDocuments(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (documents.length === 0) return <p>Nenhum documento enviado.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tamanho</th>
          <th>Enviado em</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr key={document.id}>
            <td>{document.originalName}</td>
            <td>{formatSize(document.size)}</td>
            <td>{new Date(document.uploadedAt).toLocaleString('pt-BR')}</td>
            <td>
              <DownloadButton userId={userId} document={document} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
