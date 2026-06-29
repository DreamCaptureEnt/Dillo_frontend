import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './auth';
import { CartProvider } from './pages/CartContext';
import Preloader from './components/Preloader';

import './index.css';

function Root() {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
      <div style={{
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);