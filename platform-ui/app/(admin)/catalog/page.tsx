'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product { id: string; name: string; price: number; stock: number; description?: string; images: string[]; categoryId?: string; category?: { id: string; name: string } }
interface Category { id: string; name: string }
interface ImageEntry { file: File; preview: string; id: string }

const CATALOG_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

function imgUrl(src: string) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return `${CATALOG_SERVICE}${src}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target?.result as string);
    reader.readAsDataURL(file);
  });
}

type FormState = { name: string; price: string; stock: string; description: string; categoryId: string };
const emptyForm: FormState = { name: '', price: '', stock: '0', description: '', categoryId: '' };

function ExistingImageThumb({ url, onRemove }: Readonly<{ url: string; onRemove: () => void }>) {
  return (
    <div className="relative w-20 h-20">
      <img src={imgUrl(url)} alt="" className="w-20 h-20 object-cover rounded border" />
      <button type="button" onClick={onRemove}
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600">
        ×
      </button>
    </div>
  );
}

function NewImageThumb({ preview, onRemove }: Readonly<{ preview: string; onRemove: () => void }>) {
  return (
    <div className="relative w-20 h-20">
      <img src={preview} alt="" className="w-20 h-20 object-cover rounded border opacity-70" />
      <button type="button" onClick={onRemove}
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
        ×
      </button>
    </div>
  );
}

export default function CatalogPage() {
  const { storeId } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mode, setMode] = useState<'idle' | 'add' | 'edit' | 'add-category'>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [newCategory, setNewCategory] = useState('');
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => api.get('/catalog/products').then((r) => setProducts(r.data.products)).catch(() => {});
  const loadCategories = () => api.get('/catalog/categories').then((r) => setCategories(r.data.categories)).catch(() => {});

  useEffect(() => { load(); loadCategories(); }, []);

  const openAdd = () => { setForm(emptyForm); setImages([]); setExistingImages([]); setEditingId(null); setError(''); setMode('add'); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, price: String(p.price), stock: String(p.stock), description: p.description || '', categoryId: p.categoryId || '' });
    setImages([]);
    setExistingImages(p.images || []);
    setEditingId(p.id);
    setError('');
    setMode('edit');
  };
  const closeForm = () => { setMode('idle'); setEditingId(null); setImages([]); setExistingImages([]); setError(''); };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(i => i !== url));
    // Images will be saved when the form is submitted via the images field
  };

  const addImageFiles = async (files: File[]) => {
    const entries = await Promise.all(files.map(async (file) => ({
      file, preview: await readFileAsDataUrl(file), id: `${file.name}-${file.size}-${Date.now()}`,
    })));
    setImages((prev) => [...prev, ...entries]);
  };

  const uploadImage = async (productId: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const token = localStorage.getItem('accessToken');
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');
    await fetch(`${baseUrl}/api/catalog/products/${productId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}`, 'x-store-id': storeId ?? '', 'x-user-role': 'ADMIN' },
      body: fd,
    });
  };

  const saveCategory = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api.post('/catalog/categories', { name: newCategory.trim() });
      setNewCategory('');
      setMode('idle');
      await loadCategories();
    } catch { setError('Failed to create category'); }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!storeId) { setError('Store not found — please re-login.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name,
        price: Number.parseFloat(form.price),
        stock: Number.parseInt(form.stock, 10),
        description: form.description || undefined,
        categoryId: form.categoryId || undefined,
      };
      let productId = editingId;
      if (mode === 'add') {
        const { data } = await api.post('/catalog/products', payload);
        productId = data.product.id;
      } else if (editingId) {
        await api.patch(`/catalog/products/${editingId}`, { ...payload, images: existingImages });
      }
      if (images.length > 0 && productId) {
        await Promise.all(images.map((img) => uploadImage(productId!, img.file)));
      }
      closeForm(); await load();
    } catch { setError('Failed to save product. Please try again.');
    } finally { setSaving(false); }
  };

  const del = async (id: string) => { await api.delete(`/catalog/products/${id}`); await load(); };
  const delCategory = async (id: string) => { await api.delete(`/catalog/categories/${id}`); await loadCategories(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Catalog</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setMode(mode === 'add-category' ? 'idle' : 'add-category')}>
            {mode === 'add-category' ? 'Cancel' : '+ Category'}
          </Button>
          <Button onClick={mode === 'add' || mode === 'edit' ? closeForm : openAdd}>
            {mode === 'add' || mode === 'edit' ? 'Cancel' : 'Add Product'}
          </Button>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-1 rounded-full">
              {c.name}
              <button onClick={() => delCategory(c.id)} className="text-neutral-400 hover:text-red-500 ml-1">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Form */}
      {mode === 'add-category' && (
        <Card className="mb-4 max-w-sm">
          <CardContent className="pt-4">
            <form onSubmit={saveCategory} className="flex gap-2">
              <Input placeholder="Category name" value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)} required autoFocus />
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Product Form */}
      {(mode === 'add' || mode === 'edit') && (
        <Card className="mb-6 max-w-lg">
          <CardHeader><CardTitle className="text-base">{mode === 'edit' ? 'Edit Product' : 'New Product'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" min="0" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Stock</Label>
                  <Input type="number" min="0" value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => v && setForm({ ...form, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category…">
                      {form.categoryId
                        ? (categories.find(c => c.id === form.categoryId)?.name || 'Select category…')
                        : 'Select category…'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Product Images</Label>
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Saved images</p>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((url) => (
                        <ExistingImageThumb key={url} url={url} onRemove={() => removeExistingImage(url)} />
                      ))}
                    </div>
                  </div>
                )}
                {images.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">New (not saved yet)</p>
                    <div className="flex flex-wrap gap-2">
                      {images.map((img) => (
                        <NewImageThumb key={img.id} preview={img.preview}
                          onRemove={() => setImages((prev) => prev.filter((i) => i.id !== img.id))} />
                      ))}
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { addImageFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  + Add Images
                </Button>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : mode === 'edit' ? 'Update Product' : 'Save Product'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Product List */}
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded border">
            {p.images?.[0] ? (
              <img src={imgUrl(p.images[0])} alt={p.name} className="w-12 h-12 object-cover rounded border flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 bg-neutral-100 rounded border flex items-center justify-center text-neutral-300 text-xl flex-shrink-0">📦</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{p.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-neutral-400">${p.price.toFixed(2)} · {p.stock} in stock</p>
                {p.category && <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-full">{p.category.name}</span>}
              </div>
            </div>
            {(p.images?.length ?? 0) > 0 && <Badge variant="secondary" className="text-xs">{p.images.length} img</Badge>}
            <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={() => del(p.id)}>Delete</Button>
          </div>
        ))}
        {products.length === 0 && mode === 'idle' && <p className="text-sm text-neutral-400">No products yet.</p>}
      </div>
    </div>
  );
}
