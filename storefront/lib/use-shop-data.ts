'use client';

import { useEffect, useState, useCallback } from 'react';
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

const PAGE_SIZE = 16;

export function useShopData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get('/catalog/categories').then((r) => setCategories(r.data.categories)),
      api.get('/catalog/products/tags').then((r) => setAllTags(r.data.tags)),
    ]).finally(() => setLoading(false));
  }, []);

  // Reset and fetch first page whenever filters change
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    api.get('/catalog/products', {
      params: {
        search: search || undefined,
        category: category || undefined,
        tag: activeTag || undefined,
        page: 1,
        limit: PAGE_SIZE,
      },
    }).then((r) => {
      setProducts(r.data.products);
      setTotal(r.data.total);
      setHasMore(r.data.products.length === PAGE_SIZE && r.data.total > PAGE_SIZE);
    }).catch(() => {});
  }, [search, category, activeTag]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    api.get('/catalog/products', {
      params: {
        search: search || undefined,
        category: category || undefined,
        tag: activeTag || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      },
    }).then((r) => {
      setProducts((prev) => [...prev, ...r.data.products]);
      setPage(nextPage);
      setHasMore(r.data.products.length === PAGE_SIZE && products.length + r.data.products.length < r.data.total);
    }).catch(() => {}).finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, search, category, activeTag, products.length]);

  return {
    products, categories, allTags,
    search, setSearch,
    category, setCategory,
    activeTag, setActiveTag,
    loading, loadingMore, hasMore, total, loadMore,
  };
}
