import React from 'react';
import { supabase } from '../supabaseClient';

// The component now receives props: products, onEdit, onDelete
function ProductList({ products, onEdit, onDelete }) {

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .match({ id: id });

        if (error) throw error;

        alert('Product deleted successfully!');
        onDelete(); // Call the onDelete function passed from App.jsx to refresh the list

      } catch (error) {
        alert('Error deleting product: ' + error.message);
      }
    }
  };

  // If there are no products, show a message
  if (!products || products.length === 0) {
    return <p>No products found. Add one using the form above.</p>;
  }

  return (
    <div className="product-list-container">
      <h2>Product List</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price (₦)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.description}</td>
              <td>{product.price.toLocaleString()}</td>
              <td>
                {/* The Edit button now calls the onEdit prop */}
                <button onClick={() => onEdit(product)}>Edit</button>
                <button onClick={() => deleteProduct(product.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductList;