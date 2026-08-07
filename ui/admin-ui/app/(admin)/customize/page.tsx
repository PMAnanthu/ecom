'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ImagePlus } from 'lucide-react';

const STORE_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

const HEADING_STYLES = [
  { value: 'dark', label: 'Dark (black bg, white text)' },
  { value: 'light', label: 'Light (white bg, dark text)' },
  { value: 'gradient', label: 'Gradient (indigo to purple)' },
  { value: 'image', label: 'Full Background Image' },
];

interface Slide { image: string; link: string }

interface HomeConfig {
  heroType: 'static' | 'sliding';
  heroHeading: string;
  heroSubtext: string;
  heroStyle: string;
  heroBgImage: string;
  heroSlides: Slide[];
}

const defaultConfig: HomeConfig = {
  heroType: 'static',
  heroHeading: '',
  heroSubtext: '',
  heroStyle: 'dark',
  heroBgImage: '',
  heroSlides: [],
};

export default function CustomizePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<HomeConfig>(defaultConfig);
  const [bgPreview, setBgPreview] = useState('');
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [slideFiles, setSlideFiles] = useState<(File | null)[]>([]);
  const bgRef = useRef<HTMLInputElement>(null);
  const slideRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    api.get('/store').then((r) => {
      const b = r.data.store?.branding || {};
      const loaded: HomeConfig = {
        heroType: b.heroType || 'static',
        heroHeading: b.heroHeading || '',
        heroSubtext: b.heroSubtext || '',
        heroStyle: b.heroStyle || 'dark',
        heroBgImage: b.heroBgImage || '',
        heroSlides: b.heroSlides || [],
      };
      setConfig(loaded);
      setSlideFiles(new Array(loaded.heroSlides.length).fill(null));
      if (b.heroBgImage) setBgPreview(b.heroBgImage.startsWith('http') ? b.heroBgImage : `${STORE_SERVICE}${b.heroBgImage}`);
    }).finally(() => setLoading(false));
  }, []);

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
              <Label>Background Style</Label>
              <Select value={config.heroStyle} onValueChange={(v) => v && setConfig(c => ({ ...c, heroStyle: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HEADING_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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

        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save Customization'}
        </Button>
      </form>
    </div>
  );
}
