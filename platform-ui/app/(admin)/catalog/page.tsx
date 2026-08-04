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

interface Product { id: string; name: string; price: number; stock: number; description?: string; images: string[] }
interface ImageEntry { file: File; preview: string; id: string }

const CATALOG_SERVICE = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:3004';

function imgUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${CATALOG_SERVICE}${path}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target?.result as string);
    reader.readAsDataURL(file);
  });
}

type FormState = { name: string; price: string; stock: string; description: string };
const emptyForm: FormState = { name: '', price: '', stock: '0', description: '' };

function submitLabel(saving: boolean, mode: string): string {
  if (saving) return 'Saving…';
  if (mode === 'edit') return 'Update Product';
  return 'Save Product';
}

function SubmitButton({ saving, mode }: Readonly<{ saving: boolean; mode: string }>) {
  return <Button type="submit" disabled={saving}>{submitLabel(saving, mode)}</Button>;
}

export default function CatalogPage() {
  const { storeId } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<'idle' | 'add' | 'edit'>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => api.get('/catalog/products').then((r) => setProducts(r.data.products)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setImages([]); setEditingId(null); setError(''); setMode('add'); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, price: String(p.price), stock: String(p.stock), description: p.description || '' });
    setImages([]);
    setEditingId(p.id);
    setError('');
    setMode('edit');
  };
  const closeForm = () => { setMode('idle'); setEditingId(null); setImages([]); setError(''); };

  const addImageFiles = async (files: File[]) => {
    const entries = await Promise.all(
      files.map(async (file) => ({
        file,
        preview: await readFileAsDataUrl(file),
        id: `${file.name}-${file.size}-${Date.now()}`,
      }))
    );
    setImages((prev) => [...prev, ...entries]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImageFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const uploadImage = async (productId: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const token = localStorage.getItem('accessToken');
    await fetch(`${CATALOG_SERVICE}/products/${productId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}`, 'x-store-id': storeId ?? '', 'x-user-role': 'ADMIN' },
      body: fd,
    });
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!storeId) { setError('Store not found — please re-login.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        price: Number.parseFloat(form.price),
        stock: Number.parseInt(form.stock, 10),
        description: form.description || undefined,
      };

      let productId = editingId;
      if (mode === 'add') {
        const { data } = await api.post('/catalog/products', payload);
        productId = data.product.id;
      } else if (editingId) {
        await api.patch(`/catalog/products/${editingId}`, payload);
      }

      if (images.length > 0 && productId) {
        await Promise.all(images.map((img) => uploadImage(productId!, img.file)));
      }

      closeForm();
      await load();
    } catch {
      setError('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => { await api.delete(`/catalog/products/${id}`); await load(); };

  const isOpen = mode !== 'idle';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Catalog</h1>
        <Button onClick={isOpen ? closeForm : openAdd}>{isOpen ? 'Cancel' : 'Add Product'}</Button>
      </div>

      {isOpen && (
        <Card className="mb-6 max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">{mode === 'edit' ? 'Edit Product' : 'New Product'}</CardTitle>
          </CardHeader>
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
                <Label>Description</Label>
                <Textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{mode === 'edit' ? 'Add More Images' : 'Product Images'}</Label>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative w-20 h-20">
                        <img src={img.preview} alt="" className="w-20 h-20 object-cover rounded border" />
                        <button type="button"
                          onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  + Add Images
                </Button>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <SubmitButton saving={saving} mode={mode} />
            </form>
          </CardContent>
        </Card>
      )}

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
              <p className="text-xs text-neutral-400">${p.price.toFixed(2)} · {p.stock} in stock</p>
            </div>
            {(p.images?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="text-xs">{p.images.length} img</Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={() => del(p.id)}>Delete</Button>
          </div>
        ))}
        {products.length === 0 && !isOpen && <p className="text-sm text-neutral-400">No products yet.</p>}
      </div>
    </div>
  );
}
