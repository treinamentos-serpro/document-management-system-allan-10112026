import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ userId, document }) {
  const [error, setError] = useState('');

  async function handleClick() {
    setError('');
    try {
      await downloadDocument(userId, document);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick}>
        Baixar
      </button>
      {error && <span role="alert"> {error}</span>}
    </>
  );
}
