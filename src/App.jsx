import React, { useState } from 'react';
import ProductView from './components/ProductView';
import UserList from './components/UserList';
import Chat from './components/Chat';
import './App.css'; // This path is now correct after deleting the duplicate file

function App() {
  const [view, setView] = useState('products'); // 'products', 'users', or 'chat'

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Star Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => setView('products')} className={view === 'products' ? 'active' : ''}>
            Products
          </button>
          <button onClick={() => setView('users')} className={view === 'users' ? 'active' : ''}>
            Users
          </button>
          <button onClick={() => setView('chat')} className={view === 'chat' ? 'active' : ''}>
            Chat
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {view === 'products' && <ProductView />}
        {view === 'users' && <UserList />}
        {view === 'chat' && <Chat />}
      </main>
    </div>
  );
}

export default App;