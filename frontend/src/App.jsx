import { useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';

export default function App() {
  const [userId, setUserId] = useState('usuario-demo');
  const [refreshKey, setRefreshKey] = useState(0);
  const trimmedUserId = userId.trim();

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <label>
        Usuário:{' '}
        <input value={userId} onChange={(event) => setUserId(event.target.value)} />
      </label>

      {trimmedUserId ? (
        <>
          <h2>Enviar documento</h2>
          <UploadComponent userId={trimmedUserId} onUploaded={() => setRefreshKey((key) => key + 1)} />

          <h2>Meus documentos</h2>
          <DocumentList userId={trimmedUserId} refreshKey={refreshKey} />
        </>
      ) : (
        <p role="alert">Informe um usuário para continuar.</p>
      )}
    </main>
  );
}
