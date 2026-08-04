'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  tags: string[];
  description?: string;
  category?: { id: string; name: string };
}

export interface Category { id: string; name: string }

export function useShopData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/catalog/categories').then((r) => setCategories(r.data.categories)),
      api.get('/catalog/products/tags').then((r) => setAllTags(r.data.tags)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/catalog/products', {
      params: { search: search || undefined, category: category || undefined, tag: activeTag || undefined },
    }).then((r) => setProducts(r.data.products)).catch(() => {});
  }, [search, category, activeTag]);

  return { products, categories, allTags, search, setSearch, category, setCategory, activeTag, setActiveTag, loading };
}
