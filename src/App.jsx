import React, { useState, useEffect } from 'react';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import UserList from './components/UserList';
import Chat from './components/Chat'; // Import the new Chat component
import { supabase } from './supabaseClient';
import './app.css';

function App() {
  const [view, setView] = useState('products'); // 'products', 'users', or 'chat'
  const [products, setProducts] = useState([]);
  const [productToEdit, setProductToEdit] = useState(null);

  const getProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data);
    } catch (error) {
      alert('Error loading products: ' + error.message);
    }
  };

  useEffect(() => {
    if (view === 'products') {
      getProducts();
    }
  }, [view]);

  const handleSuccess = () => {
    setProductToEdit(null);
    getProducts();
  };

  return (
    <div className="app-container">
      <header>
        <h1>Star Furniture Admin Panel</h1>
        <nav>
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
      </header>
      <main>
        {view === 'products' && (
          <div>
            <ProductForm 
              productToEdit={productToEdit} 
              onSuccess={handleSuccess} 
            />
            <hr />
            <ProductList 
              products={products} 
              onEdit={setProductToEdit}
              onDelete={getProducts}
            />
          </div>
        )}

        {view === 'users' && (
          <UserList />
        )}

        {view === 'chat' && (
          // Use the real Chat component now
          <Chat />
        )}
      </main>
    </div>
  );
}

export default App;