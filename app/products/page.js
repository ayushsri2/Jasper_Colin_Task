'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' });
  const [editId, setEditId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Fetching products (public)
  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(error => console.error(error));

    // Checking for authentication token
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please log in to add or edit products.");
      router.push('/login');
      return;
    }
    const token = localStorage.getItem('token');
    if (editId) {
      // Update product (Protected)
      const res = await fetch(`http://localhost:5000/api/products/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) })
      });
      const updatedProduct = await res.json();
      setProducts(products.map(p => p._id === editId ? updatedProduct : p));
      setEditId(null);
    } else {
      // Create product (Protected)
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) })
      });
      const newProduct = await res.json();
      setProducts([...products, newProduct]);
    }
    setForm({ name: '', description: '', price: '', category: '' });
  };

  const handleEdit = (product) => {
    if (!isAuthenticated) {
      alert("Please log in to edit products.");
      router.push('/login');
      return;
    }
    setEditId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category
    });
  };

  const handleDelete = async (id) => {
    if (!isAuthenticated) {
      alert("Please log in to delete products.");
      router.push('/login');
      return;
    }
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setProducts(products.filter(product => product._id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Products</h1>
        {isAuthenticated ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <button onClick={() => router.push('/login')}>Login</button>
        )}
      </div>

      {isAuthenticated && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            required
            style={{ marginRight: '0.5rem' }}
          />
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            style={{ marginRight: '0.5rem' }}
          />
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            required
            style={{ marginRight: '0.5rem' }}
          />
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category"
            style={{ marginRight: '0.5rem' }}
          />
          <button type="submit">{editId ? 'Update Product' : 'Add Product'}</button>
        </form>
      )}

      <ul>
        {products.map(product => (
          <li key={product._id} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>Price: ${product.price}</p>
            <p>Category: {product.category}</p>
            {isAuthenticated && (
              <>
                <button onClick={() => handleEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product._id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
