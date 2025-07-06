import React, { useState, useEffect } from 'react';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import { supabase } from '../supabaseClient';

function ProductView() {
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
    getProducts();
  }, []);

  const handleSuccess = () => {
    setProductToEdit(null);
    getProducts();
  };

  return (
    <div>
      <h1>Product Management</h1>
      <div className="product-view-container">
        <div className="form-section">
          <ProductForm 
            productToEdit={productToEdit} 
            onSuccess={handleSuccess} 
          />
        </div>
        <div className="list-section">
          <ProductList 
            products={products} 
            onEdit={setProductToEdit}
            onDelete={getProducts}
          />
        </div>
      </div>
    </div>
  );
}

export default ProductView;