'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ImagePlus, X } from 'lucide-react';

const STORE_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

const HEADING_STYLES = [
  { value: 'dark', label: '🌙 Dark Theme' },
  { value: 'light', label: '☀️ Light Theme' },
  { value: 'gradient', label: '🌈 Gradient' },
  { value: 'image', label: '🖼️ Full Photo' },
];

const GRADIENT_OPTIONS = [
  { value: 'indigo-purple', label: 'Indigo → Purple', class: 'from-indigo-600 to-purple-700' },
  { value: 'rose-orange', label: 'Rose → Orange', class: 'from-rose-500 to-orange-500' },
  { value: 'teal-cyan', label: 'Teal → Cyan', class: 'from-teal-500 to-cyan-400' },
  { value: 'amber-red', label: 'Amber → Red', class: 'from-amber-500 to-red-500' },
  { value: 'green-blue', label: 'Green → Blue', class: 'from-green-500 to-blue-600' },
  { value: 'pink-violet', label: 'Pink → Violet', class: 'from-pink-500 to-violet-600' },
  { value: 'slate-gray', label: 'Slate → Gray', class: 'from-slate-700 to-gray-900' },
  { value: 'sky-indigo', label: 'Sky → Indigo', class: 'from-sky-400 to-indigo-600' },
];

interface Slide { image: string; link: string }
type DisplayStyle = 'cards' | 'circle' | 'rectangle';

interface HomeConfig {
  heroType: 'static' | 'sliding';
  heroHeading: string;
  heroSubtext: string;
  heroStyle: string;
  heroGradient: string;
  heroBgImage: string;
  heroSlides: Slide[];
  // Section panels
  showCategories: boolean;
  categoriesStyle: DisplayStyle;
  categoriesAlign: string;
  categoriesDescription: string;
  categoriesSize: string;
  showNewArrivals: boolean;
  newArrivalsStyle: DisplayStyle;
  newArrivalsAlign: string;
  newArrivalsDescription: string;
  newArrivalsSize: string;
  newArrivalIds: string[];
  showFeatured: boolean;
  featuredStyle: DisplayStyle;
  featuredAlign: string;
  featuredDescription: string;
  featuredSize: string;
  featuredIds: string[];
}

const defaultConfig: HomeConfig = {
  heroType: 'static',
  heroHeading: '',
  heroSubtext: '',
  heroStyle: 'dark',
  heroGradient: 'indigo-purple',
  heroBgImage: '',
  heroSlides: [],
  showCategories: false,
  categoriesStyle: 'cards',
  categoriesAlign: 'left',
  categoriesDescription: '',
  categoriesSize: 'md',
  showNewArrivals: false,
  newArrivalsStyle: 'cards',
  newArrivalsAlign: 'left',
  newArrivalsDescription: '',
  newArrivalsSize: 'md',
  newArrivalIds: [],
  showFeatured: false,
  featuredStyle: 'cards',
  featuredAlign: 'left',
  featuredDescription: '',
  featuredSize: 'md',
  featuredIds: [],
};

interface Product { id: string; name: string; images: string[] }

const STYLE_OPTIONS: { value: DisplayStyle; label: string }[] = [
  { value: 'cards', label: 'Cards (album frame)' },
  { value: 'circle', label: 'Circle (round image + name)' },
  { value: 'rectangle', label: 'Rectangle (tall image + name)' },
];

export default function CustomizePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<HomeConfig>(defaultConfig);
  const [bgPreview, setBgPreview] = useState('');
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [slideFiles, setSlideFiles] = useState<(File | null)[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const bgRef = useRef<HTMLInputElement>(null);
  const slideRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadData = useCallback(async () => {
    const [storeRes, productsRes] = await Promise.all([
      api.get('/store'),
      api.get('/catalog/products?limit=100'),
    ]);
    const b = storeRes.data.store?.branding || {};
    const loaded: HomeConfig = {
      heroType: b.heroType || 'static',
      heroHeading: b.heroHeading || '',
      heroSubtext: b.heroSubtext || '',
      heroStyle: b.heroStyle || 'dark',
      heroGradient: b.heroGradient || 'indigo-purple',
      heroBgImage: b.heroBgImage || '',
      heroSlides: b.heroSlides || [],
      showCategories: b.showCategories || false,
      categoriesStyle: b.categoriesStyle || 'cards',
      categoriesAlign: b.categoriesAlign || 'left',
      categoriesDescription: b.categoriesDescription || '',
      categoriesSize: b.categoriesSize || 'md',
      showNewArrivals: b.showNewArrivals || false,
      newArrivalsStyle: b.newArrivalsStyle || 'cards',
      newArrivalsAlign: b.newArrivalsAlign || 'left',
      newArrivalsDescription: b.newArrivalsDescription || '',
      newArrivalsSize: b.newArrivalsSize || 'md',
      newArrivalIds: b.newArrivalIds || [],
      showFeatured: b.showFeatured || false,
      featuredStyle: b.featuredStyle || 'cards',
      featuredAlign: b.featuredAlign || 'left',
      featuredDescription: b.featuredDescription || '',
      featuredSize: b.featuredSize || 'md',
      featuredIds: b.featuredIds || [],
    };
    setConfig(loaded);
    setSlideFiles(new Array(loaded.heroSlides.length).fill(null));
    if (b.heroBgImage) setBgPreview(b.heroBgImage.startsWith('http') ? b.heroBgImage : `${STORE_SERVICE}${b.heroBgImage}`);
    setProducts(productsRes.data.products || []);
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${STORE_SERVICE}/api/store/upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${token ?? ''}` }, body: fd,
    });
    return (await res.json()).url as string;
  };

  const addSlide = () => {
    setConfig(c => ({ ...c, heroSlides: [...c.heroSlides, { image: '', link: '' }] }));
    setSlideFiles(f => [...f, null]);
  };

  const removeSlide = (i: number) => {
    setConfig(c => ({ ...c, heroSlides: c.heroSlides.filter((_, j) => j !== i) }));
    setSlideFiles(f => f.filter((_, j) => j !== i));
  };

  const updateSlide = (i: number, field: keyof Slide, value: string) =>
    setConfig(c => ({ ...c, heroSlides: c.heroSlides.map((s, j) => j === i ? { ...s, [field]: value } : s) }));

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = { ...config };

      if (config.heroType === 'static' && bgFile) {
        updated.heroBgImage = await uploadFile(bgFile);
      }

      if (config.heroType === 'sliding') {
        const slides = await Promise.all(config.heroSlides.map(async (slide, i) => {
          if (slideFiles[i]) {
            return { ...slide, image: await uploadFile(slideFiles[i]!) };
          }
          return slide;
        }));
        updated.heroSlides = slides;
      }

      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', { branding: { ...existing, ...updated } });
      setConfig(updated);
      setBgFile(null);
      setSlideFiles(new Array(updated.heroSlides.length).fill(null));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <p className="text-neutral-400">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Customize Home</h1>
      <form onSubmit={save} className="space-y-6">

        {/* Hero Type Tabs */}
        <div className="space-y-1">
          <Label>Hero Style</Label>
          <div className="flex gap-2">
            {(['static', 'sliding'] as const).map(type => (
              <button key={type} type="button"
                onClick={() => setConfig(c => ({ ...c, heroType: type }))}
                className={`px-5 py-2 rounded-full border text-sm font-medium capitalize transition-colors ${config.heroType === type ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-600 hover:border-black'}`}>
                {type === 'static' ? 'Static' : 'Sliding'}
              </button>
            ))}
          </div>
        </div>

        {/* STATIC fields */}
        {config.heroType === 'static' && (
          <div className="space-y-4 p-4 border rounded-xl">
            <div className="space-y-1">
              <Label>Heading</Label>
              <Input placeholder="Welcome to our store" value={config.heroHeading}
                onChange={e => setConfig(c => ({ ...c, heroHeading: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Subtext</Label>
              <Textarea placeholder="Discover our curated collection" rows={2} value={config.heroSubtext}
                onChange={e => setConfig(c => ({ ...c, heroSubtext: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Banner Style</Label>
              <Select value={config.heroStyle} onValueChange={(v) => v && setConfig(c => ({ ...c, heroStyle: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HEADING_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              {config.heroStyle === 'dark' && <p className="text-xs text-neutral-400 mt-1">Uses your dark theme background + text colors.</p>}
              {config.heroStyle === 'light' && <p className="text-xs text-neutral-400 mt-1">Uses your light theme background + text colors.</p>}
            </div>

            {config.heroStyle === 'gradient' && (
              <div className="space-y-2">
                <Label>Gradient Style</Label>
                <div className="grid grid-cols-4 gap-2">
                  {GRADIENT_OPTIONS.map(g => (
                    <button key={g.value} type="button"
                      onClick={() => setConfig(c => ({ ...c, heroGradient: g.value }))}
                      className={`h-12 rounded-lg bg-gradient-to-br ${g.class} transition-all ${config.heroGradient === g.value ? 'ring-2 ring-black ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
                      title={g.label} />
                  ))}
                </div>
                <p className="text-xs text-neutral-400">{GRADIENT_OPTIONS.find(g => g.value === config.heroGradient)?.label || 'Select a gradient'}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Background Image {config.heroStyle === 'image' ? '(required)' : '(optional)'}</Label>
              {bgPreview && <img src={bgPreview} alt="Background" className="w-full h-28 object-cover rounded-lg border" />}
              <input ref={bgRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setBgFile(f);
                  const reader = new FileReader();
                  reader.onload = ev => setBgPreview(ev.target?.result as string);
                  reader.readAsDataURL(f);
                }} />
              <Button type="button" variant="outline" size="sm" onClick={() => bgRef.current?.click()}>
                {bgPreview ? 'Change Image' : 'Upload Image'}
              </Button>
              {bgFile && <p className="text-xs text-neutral-500">{bgFile.name}</p>}
            </div>
          </div>
        )}

        {/* SLIDING fields */}
        {config.heroType === 'sliding' && (
          <div className="space-y-3 p-4 border rounded-xl">
            <p className="text-sm text-neutral-500">Add slides — each with an image and optional link.</p>
            {config.heroSlides.map((slide, i) => (
              <div key={`slide-${i}-${slide.image.slice(-8)}`} className="flex gap-3 items-start p-3 bg-neutral-50 rounded-lg border">
                <div className="flex flex-col items-center gap-1">
                  {slide.image
                    ? <img src={slide.image} alt="" className="w-16 h-12 object-cover rounded border" />
                    : <div className="w-16 h-12 bg-neutral-200 rounded border flex items-center justify-center"><ImagePlus size={18} className="text-neutral-400" /></div>}
                  <input ref={el => { slideRefs.current[i] = el; }} type="file" accept="image/*" className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const newFiles = [...slideFiles]; newFiles[i] = f;
                      setSlideFiles(newFiles);
                      const reader = new FileReader();
                      reader.onload = ev => updateSlide(i, 'image', ev.target?.result as string);
                      reader.readAsDataURL(f);
                    }} />
                  <button type="button" onClick={() => slideRefs.current[i]?.click()}
                    className="text-xs text-indigo-600 hover:underline">{slide.image ? 'Change' : 'Upload'}</button>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Input placeholder="/products or https://..." value={slide.link}
                    onChange={e => updateSlide(i, 'link', e.target.value)}
                    className="h-8 text-sm" />
                  <p className="text-xs text-neutral-400">Link when slide is clicked (optional)</p>
                </div>
                <button type="button" onClick={() => removeSlide(i)} className="text-neutral-300 hover:text-red-500 mt-1">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addSlide}>+ Add Slide</Button>
          </div>
        )}

        {/* Section Panels — inside the form */}
        <SectionPanel
          title="Shop by Category"
          enabled={config.showCategories}
          onToggle={v => setConfig(c => ({ ...c, showCategories: v }))}
          style={config.categoriesStyle}
          onStyleChange={v => setConfig(c => ({ ...c, categoriesStyle: v as DisplayStyle }))}
          align={config.categoriesAlign}
          onAlignChange={v => setConfig(c => ({ ...c, categoriesAlign: v }))}
          description={config.categoriesDescription}
          onDescriptionChange={v => setConfig(c => ({ ...c, categoriesDescription: v }))}
          size={config.categoriesSize}
          onSizeChange={v => setConfig(c => ({ ...c, categoriesSize: v }))}>
          <p className="text-xs text-neutral-400">All your store categories will be shown here.</p>
        </SectionPanel>

        <SectionPanel
          title="New Arrivals"
          enabled={config.showNewArrivals}
          onToggle={v => setConfig(c => ({ ...c, showNewArrivals: v }))}
          style={config.newArrivalsStyle}
          onStyleChange={v => setConfig(c => ({ ...c, newArrivalsStyle: v as DisplayStyle }))}
          align={config.newArrivalsAlign}
          onAlignChange={v => setConfig(c => ({ ...c, newArrivalsAlign: v }))}
          description={config.newArrivalsDescription}
          onDescriptionChange={v => setConfig(c => ({ ...c, newArrivalsDescription: v }))}
          size={config.newArrivalsSize}
          onSizeChange={v => setConfig(c => ({ ...c, newArrivalsSize: v }))}>
          <ProductPicker label="Select products" products={products} selected={config.newArrivalIds} onChange={ids => setConfig(c => ({ ...c, newArrivalIds: ids }))} />
        </SectionPanel>

        <SectionPanel
          title="Featured"
          enabled={config.showFeatured}
          onToggle={v => setConfig(c => ({ ...c, showFeatured: v }))}
          style={config.featuredStyle}
          onStyleChange={v => setConfig(c => ({ ...c, featuredStyle: v as DisplayStyle }))}
          align={config.featuredAlign}
          onAlignChange={v => setConfig(c => ({ ...c, featuredAlign: v }))}
          description={config.featuredDescription}
          onDescriptionChange={v => setConfig(c => ({ ...c, featuredDescription: v }))}
          size={config.featuredSize}
          onSizeChange={v => setConfig(c => ({ ...c, featuredSize: v }))}>
          <ProductPicker label="Select products" products={products} selected={config.featuredIds} onChange={ids => setConfig(c => ({ ...c, featuredIds: ids }))} />
        </SectionPanel>

        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </div>
  );
}

function SectionPanel({ title, enabled, onToggle, style, onStyleChange, align, onAlignChange, description, onDescriptionChange, size, onSizeChange, children }: Readonly<{
  title: string; enabled: boolean; onToggle: (v: boolean) => void;
  style: string; onStyleChange: (v: string) => void;
  align: string; onAlignChange: (v: string) => void;
  description: string; onDescriptionChange: (v: string) => void;
  size: string; onSizeChange: (v: string) => void;
  children?: React.ReactNode;
}>) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={e => onToggle(e.target.checked)} className="accent-black w-4 h-4" />
            <span className="text-sm text-neutral-500">{enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Display Style</Label>
              <Select value={style} onValueChange={v => v && onStyleChange(v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{STYLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Heading Align</Label>
              <Select value={align} onValueChange={v => v && onAlignChange(v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Item Size</Label>
              <Select value={size} onValueChange={v => v && onSizeChange(v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description <span className="text-neutral-400">(optional)</span></Label>
            <Textarea placeholder="Add a section description…" rows={2} value={description} onChange={e => onDescriptionChange(e.target.value)} />
          </div>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function ProductPicker({ label, products, selected, onChange }: Readonly<{
  label: string; products: Product[]; selected: string[]; onChange: (ids: string[]) => void;
}>) {
  const toggle = (id: string) => {
    if (selected.includes(id)) { onChange(selected.filter(s => s !== id)); }
    else { onChange([...selected, id]); }
  };
  return (
    <div className="space-y-2">
      <Label>{label} ({selected.length} selected)</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-lg p-2">
        {products.map(p => {
          const isSelected = selected.includes(p.id);
          return (
            <button key={p.id} type="button" onClick={() => toggle(p.id)}
              className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${isSelected ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
              {p.images?.[0]
                ? <img src={p.images[0]} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
                : <div className="w-8 h-8 bg-neutral-200 rounded shrink-0" />}
              <span className="truncate font-medium">{p.name}</span>
              {isSelected && <X size={12} className="shrink-0 ml-auto text-neutral-400" />}
            </button>
          );
        })}
        {products.length === 0 && <p className="text-neutral-400 text-xs col-span-3 py-4 text-center">No products yet.</p>}
      </div>
    </div>
  );
}
