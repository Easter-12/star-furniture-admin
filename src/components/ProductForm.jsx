import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function ProductForm({ productToEdit, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null); // State for the new image file
  const [existingImageUrl, setExistingImageUrl] = useState(''); // State for current image URL when editing
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price);
      setExistingImageUrl(productToEdit.image_url || ''); // Set existing image URL
      setImageFile(null); // Clear any selected file
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setExistingImageUrl('');
      setImageFile(null);
    }
  }, [productToEdit]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name || !description || !price) {
      alert('Please fill in all fields.');
      return;
    }

    // When adding a new product, an image is required
    if (!productToEdit && !imageFile) {
      alert('Please select an image for the new product.');
      return;
    }

    setLoading(true);
    let imageUrl = existingImageUrl; // Start with the existing URL

    try {
      // If a new image file is selected, upload it
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images') // Our bucket name
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Get the public URL of the uploaded image
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // Prepare product data for the database
      const productData = { name, description, price, image_url: imageUrl };
      let error;

      if (productToEdit) {
        // UPDATE logic
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .match({ id: productToEdit.id });
        error = updateError;
      } else {
        // INSERT logic
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        error = insertError;
      }

      if (error) throw error;

      alert(`Product ${productToEdit ? 'updated' : 'added'} successfully!`);
      onSuccess();

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>

      <label htmlFor="name">Product Name</label>
      <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />

      <label htmlFor="description">Description</label>
      <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />

      <label htmlFor="price">Price (₦)</label>
      <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />

      <label htmlFor="image">Product Image</label>
      <input id="image" type="file" accept="image/*" onChange={handleImageChange} />

      {/* Show a preview of the existing image when editing */}
      {existingImageUrl && !imageFile && (
        <div style={{ marginTop: '10px' }}>
          <p>Current Image:</p>
          <img src={existingImageUrl} alt="Current product" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : (productToEdit ? 'Update Product' : 'Add Product')}
      </button>
    </form>
  );
}

export default ProductForm;