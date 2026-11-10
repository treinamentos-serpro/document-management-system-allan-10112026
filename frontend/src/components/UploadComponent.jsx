import { useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ userId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setStatus({ type: 'error', message: 'Selecione um arquivo' });
      return;
    }

    setUploading(true);
    setStatus({ type: '', message: '' });
    try {
      await uploadDocument(userId, file);
      setStatus({ type: 'success', message: 'Documento enviado com sucesso' });
      setFile(null);
      event.target.reset();
      onUploaded();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={(event) => setFile(event.target.files[0] || null)} />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Enviando...' : 'Enviar'}
      </button>
      {status.message && <p role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}
    </form>
  );
}
