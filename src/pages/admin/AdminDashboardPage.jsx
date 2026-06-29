import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Boxes, ChevronDown, ChevronLeft, ChevronUp, ClipboardList, Edit, ImagePlus,
  LayoutDashboard, LogOut, PackagePlus, Plus, Search, Tag, Trash2,
  Users, X, Video, Upload, GripVertical, CheckSquare, Square,
} from 'lucide-react';
import { apiFetch, toQuery } from '../../api';
import { useAuth } from '../../auth';
import { formatPrice } from '../../products';
import { LogoLoader } from '../../components/Preloader';

// ─── tabs ─────────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard },
  { id: 'home-screen', label: 'Home Screen', icon: ImagePlus },
  { id: 'products',   label: 'Products',    icon: Boxes },
  { id: 'categories', label: 'Categories',  icon: Tag },
  { id: 'occasions',  label: 'Occasions',   icon: Tag },
  { id: 'orders',     label: 'Orders',      icon: ClipboardList },
  { id: 'video-shopping', label: 'Video Shopping', icon: Video },
  { id: 'users',      label: 'Users',       icon: Users },
];

const productInnerPages = {
  'product-names': 'Product Names',
  'saree-types': 'Saree Types',
  'product-info': 'Product Info',
};

function getPrimaryTabId(tabId) {
  return productInnerPages[tabId] ? 'products' : tabId;
}

// ─── paged resource hook ──────────────────────────────────────────────────────
function usePagedResource(path, params = {}, pageSize = 10) {
  const [page, setPage]       = useState(1);
  const [data, setData]       = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    setLoading(true);
    const query = toQuery({ page, page_size: pageSize, ...params });
    apiFetch(`${path}${query}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, page, pageSize, paramsKey, reloadKey]);

  return { data, loading, page, setPage, reload: () => { setPage(1); setReloadKey(k => k + 1); } };
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function Stat({ label, value }) {
  return (
    <div className="bg-white border border-gray-100 p-5 hover:border-gray-200 transition-colors">
      <p className="font-cinzel text-xs tracking-widest uppercase text-dillo-gold">{label}</p>
      <p className="font-display text-3xl font-bold text-dillo-charcoal mt-2">{value}</p>
    </div>
  );
}

// ─── Pager ────────────────────────────────────────────────────────────────────
function Pager({ page, data, setPage }) {
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="font-body text-sm text-gray-500">{data.count} records</p>
      <div className="flex gap-2 items-center">
        <button className="btn-outline text-xs px-3 py-1.5" disabled={!data.previous} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="px-3 py-1.5 border border-gray-200 text-sm font-body bg-white">{page}</span>
        <button className="btn-outline text-xs px-3 py-1.5" disabled={!data.next}     onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  );
}

// ─── FieldLabel ───────────────────────────────────────────────────────────────
function FieldLabel({ children, hint, required }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-gray-600">{children}</span>
      {required && <span className="text-dillo-red text-xs">*</span>}
      {hint && <span className="font-body text-xs text-gray-400 normal-case tracking-normal">— {hint}</span>}
    </div>
  );
}

// ─── ColorChips ──────────────────────────────────────────────────────────────
function ColorChips({ value, onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  };
  const remove = (c) => onChange(value.filter(x => x !== c));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[36px] p-2 bg-gray-50 border border-gray-200 rounded-sm">
        {value.map(c => (
          <span key={c} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-dillo-charcoal text-xs font-body px-2 py-1 shadow-sm">
            {c}
            <button type="button" onClick={() => remove(c)} className="text-gray-400 hover:text-dillo-red transition-colors"><X size={11} /></button>
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-gray-400 font-body italic">No colors added yet</span>}
      </div>
      <div className="flex gap-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder="e.g. Deep Red, Ivory, Navy…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} className="btn-outline px-3 flex items-center gap-1 text-sm whitespace-nowrap">
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

// ─── ImageManager ─────────────────────────────────────────────────────────────
const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PRODUCT_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function validateProductImage(file) {
  const name = file.name.toLowerCase();
  const hasAllowedExtension = PRODUCT_IMAGE_EXTENSIONS.some(ext => name.endsWith(ext));
  if (!hasAllowedExtension || (file.type && !PRODUCT_IMAGE_TYPES.has(file.type))) {
    return `${file.name}: only JPG, JPEG, PNG, and WebP images are allowed.`;
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return `${file.name}: image must be less than 5 MB.`;
  }
  return '';
}

function ImageManager({ value, onChange, files = [], onFilesChange, onError }) {
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const previews = files.map((file, index) => ({
      index,
      file,
      url: URL.createObjectURL(file),
      key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    }));
    setFilePreviews(previews);
    return () => previews.forEach(item => URL.revokeObjectURL(item.url));
  }, [files]);

  const addFiles = (incomingFiles) => {
    const accepted = [];
    const errors = [];
    for (const file of incomingFiles) {
      const error = validateProductImage(file);
      if (error) errors.push(error);
      else accepted.push(file);
    }
    if (errors.length) onError?.(errors.join(' '));
    if (accepted.length) onFilesChange([...(files || []), ...accepted]);
  };

  const addUrl = () => {
    const v = urlInput.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setUrlInput('');
  };

  const remove = (url) => onChange(value.filter(x => x !== url));
  const removeFile = (index) => onFilesChange((files || []).filter((_, i) => i !== index));
  const move = (i, dir) => {
    const arr = [...value];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const items = [
    ...value.map((url, index) => ({ type: 'url', key: url, src: url, index })),
    ...filePreviews.map(item => ({ type: 'file', key: item.key, src: item.url, index: item.index })),
  ];

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-sm p-5 text-center transition-colors cursor-pointer ${dragOver ? 'border-dillo-red bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={22} className={`mx-auto mb-2 ${dragOver ? 'text-dillo-red' : 'text-gray-400'}`} />
        <p className="font-body text-sm text-gray-600">Drop images here or <span className="text-dillo-red font-semibold">browse files</span></p>
        <p className="font-body text-xs text-gray-400 mt-1">WebP preferred. JPG, JPEG, PNG also supported. Max 5 MB each.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
      </div>

      {/* URL paste option */}
      <div className="flex gap-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder="Or paste an image URL…"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
        />
        <button type="button" onClick={addUrl} className="btn-outline px-3 flex items-center gap-1 text-sm whitespace-nowrap">
          <ImagePlus size={13} /> Add URL
        </button>
      </div>

      {/* Image grid previews */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {items.map((item, i) => (
            <div key={item.key} className="relative group border border-gray-200 bg-gray-50 aspect-square overflow-hidden rounded-sm">
              <img src={item.src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-dillo-gold text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">Main</span>
              )}
              {item.type === 'file' && (
                <span className="absolute bottom-1 left-1 bg-dillo-charcoal text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">New</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                <button type="button" onClick={() => move(item.index, -1)} disabled={item.type !== 'url' || item.index === 0}
                  title="Move left" className="text-white disabled:opacity-30 hover:text-dillo-gold transition-colors">
                  <ChevronUp size={15} />
                </button>
                <button type="button" onClick={() => item.type === 'url' ? remove(item.src) : removeFile(item.index)}
                  title="Remove" className="text-white hover:text-red-400 transition-colors bg-red-600/80 rounded-full p-0.5">
                  <Trash2 size={13} />
                </button>
                <button type="button" onClick={() => move(item.index, 1)} disabled={item.type !== 'url' || item.index === value.length - 1}
                  title="Move right" className="text-white disabled:opacity-30 hover:text-dillo-gold transition-colors">
                  <ChevronDown size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <p className="font-body text-xs text-gray-400 italic">No images yet. The first image will be used as the main display image.</p>
      )}
    </div>
  );
}

// ─── InformationEditor ────────────────────────────────────────────────────────
function InformationEditor({ value, onChange, options = [], onManageOptions }) {
  const [rows, setRows] = useState(() => {
    try {
      return Object.entries(typeof value === 'string' ? JSON.parse(value || '{}') : (value || {}));
    } catch { return []; }
  });
  const [selectedOptionId, setSelectedOptionId] = useState('');

  const sync = (updated) => {
    setRows(updated);
    onChange(Object.fromEntries(updated.filter(([k]) => k.trim())));
  };
  const update = (i, col, val) => sync(rows.map((r, idx) => idx === i ? (col === 0 ? [val, r[1]] : [r[0], val]) : r));
  const addRow = () => sync([...rows, ['', '']]);
  const remove = (i) => sync(rows.filter((_, idx) => idx !== i));
  const addOption = () => {
    const option = options.find(item => String(item.id) === selectedOptionId);
    if (!option) return;
    const next = rows.some(([label]) => label === option.label)
      ? rows.map(row => row[0] === option.label ? [option.label, option.value] : row)
      : [...rows, [option.label, option.value]];
    sync(next);
    setSelectedOptionId('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          className="input-field flex-1 text-sm"
          value={selectedOptionId}
          onChange={e => setSelectedOptionId(e.target.value)}
        >
          <option value="">Select saved label/value</option>
          {options.map(option => (
            <option key={option.id} value={option.id}>{option.label}: {option.value}</option>
          ))}
        </select>
        <button type="button" onClick={addOption} disabled={!selectedOptionId} className="btn-outline px-3 flex items-center gap-1 text-sm whitespace-nowrap disabled:opacity-50">
          <Plus size={13} /> Add
        </button>
        <button type="button" onClick={onManageOptions} className="btn-outline px-3" title="Manage product info options">
          <Plus size={14} />
        </button>
      </div>
      {rows.length > 0 && (
        <div className="rounded-sm border border-gray-100 overflow-hidden">
          {rows.map(([k, v], i) => (
            <div key={i} className={`flex gap-0 items-stretch ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <input className="flex-1 px-3 py-2 text-sm font-body bg-dillo-cream/40 border-r border-gray-200 outline-none focus:bg-dillo-cream" placeholder="Label (e.g. Fabric)"
                value={k} onChange={e => update(i, 0, e.target.value)} />
              <input className="flex-1 px-3 py-2 text-sm font-body outline-none focus:bg-gray-50" placeholder="Value (e.g. Pure Silk)"
                value={v} onChange={e => update(i, 1, e.target.value)} />
              <button type="button" onClick={() => remove(i)} className="px-3 text-gray-300 hover:text-dillo-red transition-colors border-l border-gray-100">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={addRow} className="btn-outline text-xs flex items-center gap-1 py-2 px-3">
        <Plus size={12} /> Add specification row
      </button>
    </div>
  );
}

// ─── TagsInput ────────────────────────────────────────────────────────────────
function TagsInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim().toLowerCase().replace(/\s+/g, '-');
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  };
  const remove = (t) => onChange(value.filter(x => x !== t));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-gray-50 border border-gray-200 rounded-sm">
        {value.map(t => (
          <span key={t} className="inline-flex items-center gap-1 bg-dillo-charcoal text-white text-xs font-body px-2 py-0.5">
            #{t}
            <button type="button" onClick={() => remove(t)} className="opacity-60 hover:opacity-100 transition-opacity"><X size={10} /></button>
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-gray-400 font-body italic">No tags yet</span>}
      </div>
      <div className="flex gap-2">
        <input className="input-field flex-1 text-sm" placeholder="e.g. festive, silk, handloom…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} className="btn-outline px-3 flex items-center gap-1 text-sm whitespace-nowrap">
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

// ─── slugify util ─────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Toggle Checkbox ──────────────────────────────────────────────────────────
function ToggleCard({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 p-3 border text-left w-full transition-all ${checked ? 'border-dillo-red bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
    >
      <span className={`mt-0.5 shrink-0 transition-colors ${checked ? 'text-dillo-red' : 'text-gray-300'}`}>
        {checked ? <CheckSquare size={16} /> : <Square size={16} />}
      </span>
      <div>
        <p className="font-body text-sm font-semibold text-dillo-charcoal">{label}</p>
        {hint && <p className="font-body text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
    </button>
  );
}

// ─── ProductForm ─────────────────────────────────────────────────────────────
function ProductForm({
  product,
  categories,
  occasions,
  productNameOptions = [],
  sareeTypeOptions = [],
  productInfoOptions = [],
  onSaved,
  onCancel,
  onAdminNavigate,
}) {
  const isEdit = Boolean(product);
  const formRef = useRef(null);

  const [form, setForm] = useState(() => ({
    name:           product?.name           || '',
    name_ta:        product?.name_ta        || '',
    slug:           product?.slug           || '',
    category:       product?.category       || categories[0]?.id || '',
    occasion:       product?.occasion       || occasions[0]?.id  || '',
    saree_type:     product?.saree_type     || '',
    description:    product?.description    || '',
    price:          product?.price          || '',
    original_price: product?.original_price || '',
    discount:       product?.discount       || 0,
    stock_count:    product?.stock_count    || 0,
    images:         product?.images         || [],
    image_files:    [],
    colors:         product?.colors         || [],
    tags:           product?.tags           || [],
    information:    product?.information    || {},
    video_url:      product?.video_url      || '',
    is_new:         product?.is_new         || false,
    is_featured:    product?.is_featured    || false,
    is_bestseller:  product?.is_bestseller  || false,
    is_active:      product?.is_active      ?? true,
  }));

  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [slugManual, setSlugManual] = useState(isEdit);
  // Track current section for progress nav
  const [activeSection, setActiveSection] = useState('basic');

  const change = useCallback((key, value) => setForm(f => ({ ...f, [key]: value })), []);

  const handleNameChange = (val) => {
    change('name', val);
    if (!slugManual) change('slug', slugify(val));
  };

  const handleProductNameSelect = (val) => {
    const selected = productNameOptions.find(item => item.name === val);
    change('name', val);
    change('name_ta', selected?.name_ta || '');
    if (!slugManual) change('slug', slugify(val));
  };

  const productNameChoices = useMemo(() => {
    const names = new Set(productNameOptions.map(item => item.name));
    return form.name && !names.has(form.name)
      ? [{ id: 'current', name: form.name, name_ta: form.name_ta }, ...productNameOptions]
      : productNameOptions;
  }, [form.name, form.name_ta, productNameOptions]);

  const sareeTypeChoices = useMemo(() => {
    const names = new Set(sareeTypeOptions.map(item => item.name));
    return form.saree_type && !names.has(form.saree_type)
      ? [{ id: 'current', name: form.saree_type, name_ta: '' }, ...sareeTypeOptions]
      : sareeTypeOptions;
  }, [form.saree_type, sareeTypeOptions]);

  const handlePriceChange = (key, val) => {
    const value = key === 'discount'
      ? Math.min(100, Math.max(0, Number(val) || 0))
      : val;
    const next = { ...form, [key]: value };
    const origPrice = Number(next.original_price);
    const discount = Number(next.discount || 0);
    const price = Number(next.price);

    if ((key === 'original_price' || key === 'discount') && origPrice > 0) {
      const sellingPrice = Math.max(0, Math.round(origPrice * (1 - discount / 100)));
      setForm(f => ({ ...f, [key]: value, price: sellingPrice }));
      return;
    }

    if (key === 'price' && price > 0 && origPrice > 0 && origPrice >= price) {
      setForm(f => ({
        ...f,
        price: val,
        discount: Math.round(((origPrice - price) / origPrice) * 100),
      }));
      return;
    }

    change(key, value);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { image_files, images, ...rest } = form;
      const payload = {
        ...rest,
        image_paths:     images,
        price:          Number(form.price),
        original_price: Number(form.original_price || form.price),
        discount:       Number(form.discount || 0),
        stock_count:    Number(form.stock_count || 0),
        information:    typeof form.information === 'string'
                          ? JSON.parse(form.information || '{}')
                          : form.information,
      };
      const method   = isEdit ? 'PATCH' : 'POST';
      const endpoint = isEdit ? `/sarees/${product.slug}/` : '/sarees/';
      const body = new FormData();
      body.append('payload', JSON.stringify(payload));
      image_files.forEach(file => body.append('uploaded_images', file));
      await apiFetch(endpoint, { method, body });
      onSaved();
    } catch (err) {
      setError(err.message);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'basic',      label: 'Basic Info' },
    { id: 'pricing',    label: 'Pricing' },
    { id: 'media',      label: 'Images' },
    { id: 'details',    label: 'Details' },
    { id: 'visibility', label: 'Visibility' },
  ];

  return (
    <div ref={formRef} className="bg-white border border-gray-200 rounded-sm overflow-hidden">
      {/* Form header */}
      <div className="bg-dillo-charcoal text-white px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">
            {isEdit ? `Editing: ${product.name}` : 'Add New Saree'}
          </h2>
          <p className="font-body text-xs text-white/60 mt-0.5">
            {isEdit ? 'Update product details below' : 'Fill in the details to add a new product to the catalogue'}
          </p>
        </div>
        <button type="button" onClick={onCancel}
          className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-sm" title="Close form">
          <X size={20} />
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiveSection(s.id);
              document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }}
            className={`px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
              activeSection === s.id
                ? 'border-dillo-red text-dillo-red bg-white'
                : 'border-transparent text-gray-500 hover:text-dillo-charcoal hover:bg-white/70'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center gap-2">
          <X size={15} className="text-red-500 shrink-0" />
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={submit} className="p-5 space-y-8">

        {/* ── Basic Info ─────────────────────────────────────── */}
        <section id="section-basic" onFocus={() => setActiveSection('basic')}>
          <SectionHeading>Basic Info</SectionHeading>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FieldLabel required>Product name</FieldLabel>
              <div className="flex gap-2">
                <select className="input-field flex-1" value={form.name} onChange={e => handleProductNameSelect(e.target.value)} required>
                  <option value="">Select product name</option>
                  {productNameChoices.map(option => (
                    <option key={option.id || option.name} value={option.name}>{option.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => onAdminNavigate?.('product-names')} className="btn-outline px-3" title="Manage product names">
                  <Plus size={14} />
                </button>
              </div>
              <div className="mt-2 inline-flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-1.5">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-gray-500">Product ID</span>
                <span className="font-body text-xs font-bold text-dillo-charcoal">
                  {product?.product_code || 'Auto generated after save'}
                </span>
              </div>
            </div>
            <div>
              <FieldLabel>Name in Tamil</FieldLabel>
              <input className="input-field w-full" placeholder="தமிழ் பெயர் (optional)"
                value={form.name_ta} onChange={e => change('name_ta', e.target.value)} />
            </div>
            <div>
              <FieldLabel hint="Auto-generated from name">URL slug</FieldLabel>
              <div className="flex gap-2">
                <input className="input-field flex-1" placeholder="kanjivaram-silk-saree"
                  value={form.slug}
                  onChange={e => { setSlugManual(true); change('slug', e.target.value); }}
                  required />
                {!isEdit && (
                  <button type="button" onClick={() => { setSlugManual(false); change('slug', slugify(form.name)); }}
                    className="btn-outline text-xs px-3 whitespace-nowrap">Reset</button>
                )}
              </div>
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <select className="input-field w-full" value={form.category} onChange={e => change('category', Number(e.target.value))}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel required hint="e.g. Silk, Cotton, Chiffon">Saree type</FieldLabel>
              <div className="flex gap-2">
                <select className="input-field flex-1" value={form.saree_type} onChange={e => change('saree_type', e.target.value)} required>
                  <option value="">Select saree type</option>
                  {sareeTypeChoices.map(option => (
                    <option key={option.id || option.name} value={option.name}>{option.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => onAdminNavigate?.('saree-types')} className="btn-outline px-3" title="Manage saree types">
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div>
              <FieldLabel>Occasion</FieldLabel>
              <select className="input-field w-full" value={form.occasion} onChange={e => change('occasion', Number(e.target.value))}>
                {occasions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <FieldLabel required>Description</FieldLabel>
              <textarea className="input-field w-full min-h-[100px] resize-y" placeholder="Describe the saree — weave, border, craftsmanship…"
                value={form.description} onChange={e => change('description', e.target.value)} required />
            </div>

          </div>
        </section>

        <Divider />

        {/* ── Pricing & Stock ──────────────────────────────────── */}
        <section id="section-pricing" onFocus={() => setActiveSection('pricing')}>
          <SectionHeading>Pricing & Stock</SectionHeading>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <FieldLabel required hint="MRP before discount">Original price (?)</FieldLabel>
              <input className="input-field w-full" type="number" min="0" step="0.01" placeholder="4500.00"
                value={form.original_price} onChange={e => handlePriceChange('original_price', e.target.value)} required />
            </div>
            <div>
              <FieldLabel hint="Selling price updates from this">Discount %</FieldLabel>
              <div className="relative">
                <input className="input-field w-full pr-8" type="number" min="0" max="100" placeholder="0"
                  value={form.discount} onChange={e => handlePriceChange('discount', e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-body">%</span>
              </div>
            </div>
            <div>
              <FieldLabel required hint="Calculated from original price and discount">Selling price (?)</FieldLabel>
              <input className="input-field w-full" type="number" min="0" step="0.01" placeholder="3500.00"
                value={form.price} onChange={e => handlePriceChange('price', e.target.value)} required />
            </div>
            <div>
              <FieldLabel>Stock count</FieldLabel>
              <input className="input-field w-full" type="number" min="0" placeholder="0"
                value={form.stock_count} onChange={e => change('stock_count', e.target.value)} />
            </div>
          </div>
          {form.price > 0 && form.original_price > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-sm">
              <p className="font-body text-sm text-green-700">
                Customer saves ?{(Number(form.original_price) - Number(form.price)).toLocaleString('en-IN')} - {form.discount}% off
              </p>
            </div>
          )}
        </section>

        <Divider />

        {/* ── Images & Video ──────────────────────────────────── */}
        <section id="section-media" onFocus={() => setActiveSection('media')}>
          <SectionHeading>Images & Video</SectionHeading>
          <div className="space-y-4">
            <div>
              <FieldLabel hint="First image is used as the main display image">Product images</FieldLabel>
              <ImageManager
                value={form.images}
                onChange={v => change('images', v)}
                files={form.image_files}
                onFilesChange={v => change('image_files', v)}
                onError={setError}
              />
            </div>
            <div>
              <FieldLabel hint="Optional — YouTube or Vimeo">Product video</FieldLabel>
              <div className="flex items-center gap-2">
                <Video size={16} className="text-gray-400 shrink-0" />
                <input className="input-field flex-1" placeholder="https://youtube.com/watch?v=…"
                  value={form.video_url} onChange={e => change('video_url', e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* ── Product Details ──────────────────────────────────── */}
        <section id="section-details" onFocus={() => setActiveSection('details')}>
          <SectionHeading>Colors, Tags & Specifications</SectionHeading>
          <div className="space-y-5">
            <div>
              <FieldLabel>Available colors</FieldLabel>
              <ColorChips value={form.colors} onChange={v => change('colors', v)} />
            </div>
            <div>
              <FieldLabel hint="Helps with search & filtering">Search tags</FieldLabel>
              <TagsInput value={form.tags} onChange={v => change('tags', v)} />
            </div>
            <div>
              <FieldLabel hint="Key-value pairs shown on product page">Specifications</FieldLabel>
              <InformationEditor
                value={form.information}
                onChange={v => change('information', v)}
                options={productInfoOptions}
                onManageOptions={() => onAdminNavigate?.('product-info')}
              />
            </div>
          </div>
        </section>

        <Divider />

        {/* ── Visibility ────────────────────────────────────────── */}
        <section id="section-visibility" onFocus={() => setActiveSection('visibility')}>
          <SectionHeading>Visibility & Badges</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'is_active',     label: 'Active',      hint: 'Visible on site' },
              { key: 'is_new',        label: 'New Arrival', hint: 'Shows "New" badge' },
              { key: 'is_featured',   label: 'Featured',    hint: 'Homepage spotlight' },
              { key: 'is_bestseller', label: 'Bestseller',  hint: 'Shows badge' },
            ].map(({ key, label, hint }) => (
              <ToggleCard key={key} checked={form[key]} onChange={v => change(key, v)} label={label} hint={hint} />
            ))}
          </div>
        </section>

        {/* ── Actions ────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 py-2.5 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? 'Updating…' : 'Creating…'}</>
            ) : (
              isEdit ? 'Update Saree' : 'Create Saree'
            )}
          </button>
          <button type="button" onClick={onCancel} className="btn-outline px-6 py-2.5">
            Discard changes
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h3 className="font-body text-sm font-bold uppercase tracking-widest text-dillo-charcoal mb-4 pb-2 border-b border-gray-100">
      {children}
    </h3>
  );
}

function Divider() {
  return <div className="border-t border-gray-100" />;
}

// ─── ProductsAdmin ────────────────────────────────────────────────────────────
function HomeScreenAdmin() {
  const { data, loading, page, setPage, reload } = usePagedResource('/home-screen-images/', {}, 8);
  const emptyForm = {
    title: '',
    title_ta: '',
    subtitle: '',
    badge: '',
    cta_label: '',
    cta_url: '/products',
    caption_label: '',
    caption_subtitle: '',
    sort_order: 0,
    is_active: true,
    landscape_file: null,
    portrait_file: null,
  };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const change = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const reset = () => {
    setForm(emptyForm);
    setEditing(null);
    setError('');
  };
  const setImageFile = (key, file) => {
    if (!file) return change(key, null);
    const validationError = validateProductImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    change(key, file);
  };
  const edit = (item) => {
    setEditing(item);
    setError('');
    setForm({
      title: item.title || '',
      title_ta: item.title_ta || '',
      subtitle: item.subtitle || '',
      badge: item.badge || '',
      cta_label: item.cta_label || '',
      cta_url: item.cta_url || '/products',
      caption_label: item.caption_label || '',
      caption_subtitle: item.caption_subtitle || '',
      sort_order: item.sort_order || 0,
      is_active: item.is_active,
      landscape_url: item.landscape_url || '',
      portrait_url: item.portrait_url || '',
      landscape_file: null,
      portrait_file: null,
    });
  };
  const getPreview = (file, existingUrl) => file ? URL.createObjectURL(file) : existingUrl;

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { landscape_file, portrait_file, landscape_url, portrait_url, ...payload } = form;
      const body = new FormData();
      body.append('payload', JSON.stringify({ ...payload, sort_order: Number(form.sort_order || 0) }));
      if (landscape_file) body.append('landscape_image_file', landscape_file);
      if (portrait_file) body.append('portrait_image_file', portrait_file);
      await apiFetch(editing ? `/home-screen-images/${editing.id}/` : '/home-screen-images/', {
        method: editing ? 'PATCH' : 'POST',
        body,
      });
      reset();
      reload();
    } catch (err) {
      setError(err.message || 'Unable to save home screen image.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete home screen image "${item.title || item.caption_label || item.id}"?`)) return;
    await apiFetch(`/home-screen-images/${item.id}/`, { method: 'DELETE' });
    if (editing?.id === item.id) reset();
    reload();
  };

  return (
    <section className="space-y-5">
      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between ${editing ? 'bg-amber-50' : 'bg-dillo-cream'}`}>
          <h3 className="font-body text-sm font-bold text-dillo-charcoal">
            {editing ? `Editing: ${editing.title || editing.caption_label || editing.id}` : 'Add home screen image'}
          </h3>
          {editing && (
            <button type="button" onClick={reset} className="font-body text-xs text-gray-500 hover:text-dillo-red flex items-center gap-1">
              <X size={13} /> Cancel editing
            </button>
          )}
        </div>
        <form onSubmit={save} className="p-5 space-y-5">
          {error && <p className="font-body text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: 'landscape_file', label: 'Landscape image', hint: 'Desktop and tablet', preview: getPreview(form.landscape_file, form.landscape_url) },
              { key: 'portrait_file', label: 'Portrait image', hint: 'Mobile', preview: getPreview(form.portrait_file, form.portrait_url) },
            ].map(item => (
              <div key={item.key} className="border border-gray-100 bg-gray-50 p-4">
                <FieldLabel hint={item.hint}>{item.label}</FieldLabel>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="input-field w-full bg-white"
                  onChange={e => setImageFile(item.key, e.target.files?.[0] || null)}
                />
                {item.preview && <img src={item.preview} alt="" className="mt-3 w-full aspect-video object-cover border border-gray-200 bg-white" />}
              </div>
            ))}
          </div>

          <div>
            <SectionHeading>Optional overlay details</SectionHeading>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Title</FieldLabel>
              <input className="input-field w-full" value={form.title} onChange={e => change('title', e.target.value)} placeholder="Grand Silk Saree Collection" />
            </div>
            <div>
              <FieldLabel>Tamil title</FieldLabel>
              <input className="input-field w-full" value={form.title_ta} onChange={e => change('title_ta', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Subtitle</FieldLabel>
              <input className="input-field w-full" value={form.subtitle} onChange={e => change('subtitle', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Badge</FieldLabel>
              <input className="input-field w-full" value={form.badge} onChange={e => change('badge', e.target.value)} />
            </div>
            <div>
              <FieldLabel>CTA label</FieldLabel>
              <input className="input-field w-full" value={form.cta_label} onChange={e => change('cta_label', e.target.value)} />
            </div>
            <div>
              <FieldLabel>CTA URL</FieldLabel>
              <input className="input-field w-full" value={form.cta_url} onChange={e => change('cta_url', e.target.value)} placeholder="/products" />
            </div>
            <div>
              <FieldLabel>Order</FieldLabel>
              <input className="input-field w-full" type="number" min="0" value={form.sort_order} onChange={e => change('sort_order', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Image caption</FieldLabel>
              <input className="input-field w-full" value={form.caption_label} onChange={e => change('caption_label', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Caption subtitle</FieldLabel>
              <input className="input-field w-full" value={form.caption_subtitle} onChange={e => change('caption_subtitle', e.target.value)} />
            </div>
          </div>

          <ToggleCard checked={form.is_active} onChange={value => change('is_active', value)} label="Active" hint="Visible on homepage" />

          <div className="flex gap-3">
            <button className="btn-primary px-6 py-2.5 flex items-center gap-2" disabled={saving}>
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ImagePlus size={15} />}
              {editing ? 'Update Image' : 'Create Image'}
            </button>
            <button type="button" onClick={reset} className="btn-outline px-5 py-2.5">Clear</button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="bg-dillo-cream text-dillo-charcoal">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Image</th>
              <th className="text-left px-4 py-3 font-semibold">Content</th>
              <th className="text-left px-4 py-3 font-semibold">Order</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map(item => (
              <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {item.landscape_url && <img src={item.landscape_url} alt="" className="w-20 h-12 object-cover border border-gray-100" />}
                    {item.portrait_url && <img src={item.portrait_url} alt="" className="w-10 h-12 object-cover border border-gray-100" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-dillo-charcoal">{item.title || item.caption_label || 'Untitled'}</p>
                  <p className="text-xs text-gray-500">{item.subtitle || item.caption_subtitle || '-'}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.landscape_image || 'No landscape'} / {item.portrait_image || 'No portrait'}</p>
                </td>
                <td className="px-4 py-3">{item.sort_order}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 font-semibold rounded-sm ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" onClick={() => edit(item)} className="p-2 text-dillo-charcoal hover:text-dillo-red">
                    <Edit size={16} />
                  </button>
                  <button type="button" onClick={() => remove(item)} className="p-2 text-dillo-charcoal hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && data.results.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No home screen images yet.</td></tr>
            )}
          </tbody>
        </table>
        {loading && <div className="p-6"><LogoLoader size="sm" label="Loading home screen images..." /></div>}
      </div>
      <Pager page={page} data={data} setPage={setPage} />
    </section>
  );
}

function ProductsAdmin({ onAdminNavigate }) {
  const [search,        setSearch]        = useState('');
  const [pageSize,      setPageSize]      = useState(5);
  const [editing,       setEditing]       = useState(null);   // product obj or null
  const [creating,      setCreating]      = useState(false);
  const [meta,          setMeta]          = useState({
    categories: [],
    occasions: [],
    productNames: [],
    sareeTypes: [],
    productInfo: [],
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const formAnchorRef = useRef(null);

  const params = useMemo(() => ({ search }), [search]);
  const { data, loading, page, setPage, reload } = usePagedResource('/sarees/', params, pageSize);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (value) => {
    setPageSize(Number(value));
    setPage(1);
  };

  useEffect(() => {
    Promise.all([
      apiFetch('/saree-categories/?page_size=100'),
      apiFetch('/occasion-categories/?page_size=100'),
      apiFetch('/product-name-options/?page_size=100&is_active=true'),
      apiFetch('/saree-type-options/?page_size=100&is_active=true'),
      apiFetch('/product-info-options/?page_size=100&is_active=true'),
    ]).then(([cat, occ, productNames, sareeTypes, productInfo]) => setMeta({
      categories: cat.results,
      occasions: occ.results,
      productNames: productNames.results,
      sareeTypes: sareeTypes.results,
      productInfo: productInfo.results,
    }));
  }, []);

  const remove = async (product) => {
    try {
      await apiFetch(`/sarees/${product.slug}/`, { method: 'DELETE' });
      setConfirmDelete(null);
      reload();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (product) => {
    setEditing(product);
    setCreating(false);
    // Scroll to form anchor without jumping the full page
    setTimeout(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setTimeout(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const formOpen = creating || editing !== null;

  return (
    <section className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 bg-white border border-gray-100 px-3 py-2 max-w-xs">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input className="outline-none font-body text-sm flex-1 min-w-0" placeholder="Search products…"
            value={search} onChange={e => handleSearchChange(e.target.value)} />
          {search && (
            <button type="button" onClick={() => handleSearchChange('')} className="text-gray-300 hover:text-gray-500">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 font-body text-xs text-gray-500">
            Page size
            <select
              className="outline-none bg-transparent text-dillo-charcoal font-semibold"
              value={pageSize}
              onChange={e => handlePageSizeChange(e.target.value)}
            >
              {[5, 10, 15, 20].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <button
            onClick={openCreate}
            className={`flex items-center gap-2 px-4 py-2 font-body text-sm font-semibold border transition-all ${
              creating && !editing
                ? 'bg-dillo-red text-white border-dillo-red'
                : 'bg-white text-dillo-charcoal border-gray-200 hover:border-dillo-red hover:text-dillo-red'
            }`}
          >
            <PackagePlus size={15} /> Add New Saree
          </button>
          <button type="button" onClick={() => onAdminNavigate?.('product-names')} className="btn-outline text-xs px-3 py-2 flex items-center gap-1">
            <Plus size={13} /> Product Names
          </button>
          <button type="button" onClick={() => onAdminNavigate?.('saree-types')} className="btn-outline text-xs px-3 py-2 flex items-center gap-1">
            <Plus size={13} /> Saree Types
          </button>
          <button type="button" onClick={() => onAdminNavigate?.('product-info')} className="btn-outline text-xs px-3 py-2 flex items-center gap-1">
            <Plus size={13} /> Product Info
          </button>
        </div>
      </div>

      {/* Form anchor */}
      <div ref={formAnchorRef} />

      {/* Form */}
      {formOpen && (
        <ProductForm
          key={editing?.id ?? 'create'}
          product={editing}
          categories={meta.categories}
          occasions={meta.occasions}
          productNameOptions={meta.productNames}
          sareeTypeOptions={meta.sareeTypes}
          productInfoOptions={meta.productInfo}
          onSaved={() => { closeForm(); reload(); }}
          onCancel={closeForm}
          onAdminNavigate={onAdminNavigate}
        />
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white border border-gray-200 p-6 max-w-sm w-full space-y-4 rounded-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-dillo-charcoal">Delete Saree?</h3>
            <p className="font-body text-sm text-gray-600">
              <span className="font-semibold">{confirmDelete.name}</span> will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => remove(confirmDelete)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-body font-semibold text-sm transition-colors">
                Delete permanently
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1 py-2.5">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Product table */}
      <div className="bg-white border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="bg-dillo-cream text-dillo-charcoal">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Product</th>
              <th className="text-left px-4 py-3 font-semibold">Price</th>
              <th className="text-left px-4 py-3 font-semibold">Stock</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map(product => {
              const isCurrentlyEditing = editing?.id === product.id;
              return (
                <tr key={product.id}
                  className={`border-t border-gray-100 transition-colors ${isCurrentlyEditing ? 'bg-red-50' : 'hover:bg-gray-50/80'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-10 h-10 object-cover border border-gray-100 shrink-0 rounded-sm" />
                      ) : (
                        <div className="w-10 h-10 bg-dillo-cream border border-gray-100 shrink-0 flex items-center justify-center text-gray-300 rounded-sm">
                          <Boxes size={16} />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-dillo-charcoal">{product.name}</p>
                        {product.product_code && (
                          <p className="text-xs font-semibold text-dillo-red">{product.product_code}</p>
                        )}
                        <p className="text-xs text-gray-500">{product.saree_type} · {product.occasion_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{formatPrice(Number(product.price))}</p>
                    {product.discount > 0 && (
                      <p className="text-xs text-green-600">{product.discount}% off</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-sm ${
                      product.stock_count === 0 ? 'bg-red-100 text-red-700' :
                      product.stock_count <= 5  ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-green-100 text-green-700'
                    }`}>
                      {product.stock_count === 0 ? 'Out of stock' : `${product.stock_count} in stock`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-xs px-2 py-0.5 font-semibold rounded-sm ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.is_active ? 'Active' : 'Hidden'}
                      </span>
                      {product.is_featured   && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-sm">Featured</span>}
                      {product.is_new        && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-sm">New</span>}
                      {product.is_bestseller && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-sm">Bestseller</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => isCurrentlyEditing ? closeForm() : openEdit(product)}
                      className={`p-2 transition-colors ${isCurrentlyEditing ? 'text-dillo-red' : 'text-dillo-charcoal hover:text-dillo-red'}`}
                      title={isCurrentlyEditing ? 'Close editor' : 'Edit product'}
                    >
                      {isCurrentlyEditing ? <X size={16} /> : <Edit size={16} />}
                    </button>
                    <button onClick={() => setConfirmDelete(product)}
                      className="p-2 text-dillo-charcoal hover:text-red-600 transition-colors" title="Delete product">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && data.results.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <Boxes size={32} className="mx-auto mb-3 text-gray-200" />
                  <p className="font-body text-gray-400">{search ? `No products matching "${search}"` : 'No products yet. Add your first saree!'}</p>
                  {search && (
                    <button onClick={() => setSearch('')} className="mt-2 font-body text-sm text-dillo-red hover:underline">Clear search</button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && (
          <div className="p-6">
            <LogoLoader size="sm" label="Loading products..." />
          </div>
        )}
      </div>
      <Pager page={page} data={data} setPage={setPage} />
    </section>
  );
}

// ─── SimpleTaxonomyAdmin ──────────────────────────────────────────────────────
function SimpleTaxonomyAdmin({ title, path, hasTamil = false }) {
  const { data, page, setPage, reload } = usePagedResource(path);
  const [form, setForm]       = useState({ name: '', slug: '', name_ta: '', icon: '', sort_order: 0, is_active: true });
  const [editing, setEditing] = useState(null);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const handleNameChange = (val) => {
    setForm(f => ({ ...f, name: val, ...(slugManual ? {} : { slug: slugify(val) }) }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = hasTamil
        ? form
        : { name: form.name, slug: form.slug, sort_order: form.sort_order, is_active: form.is_active };
      await apiFetch(editing ? `${path}${editing.slug}/` : path, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      setForm({ name: '', slug: '', name_ta: '', icon: '', sort_order: 0, is_active: true });
      setEditing(null);
      setSlugManual(false);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    setEditing(item);
    setSlugManual(true);
    setForm({ name: item.name, slug: item.slug, name_ta: item.name_ta || '', icon: item.icon || '', sort_order: item.sort_order, is_active: item.is_active });
  };

  const cancel = () => {
    setEditing(null);
    setSlugManual(false);
    setError('');
    setForm({ name: '', slug: '', name_ta: '', icon: '', sort_order: 0, is_active: true });
  };

  return (
    <section className="space-y-5">
      {/* Form */}
      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between ${editing ? 'bg-amber-50' : 'bg-dillo-cream'}`}>
          <h3 className="font-body text-sm font-bold text-dillo-charcoal">
            {editing ? `Editing: ${editing.name}` : `Add new ${title.toLowerCase()}`}
          </h3>
          {editing && (
            <button type="button" onClick={cancel} className="font-body text-xs text-gray-500 hover:text-dillo-red flex items-center gap-1">
              <X size={13} /> Cancel editing
            </button>
          )}
        </div>
        <form onSubmit={save} className="p-5 space-y-3">
          {error && <p className="font-body text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <FieldLabel required>{title} name</FieldLabel>
              <input className="input-field w-full" placeholder={`${title} name`}
                value={form.name} onChange={e => handleNameChange(e.target.value)} required />
            </div>
            <div>
              <FieldLabel hint="Auto-generated">Slug</FieldLabel>
              <input className="input-field w-full" placeholder="slug"
                value={form.slug}
                onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: e.target.value })); }}
                required />
            </div>
            {hasTamil && (
              <div>
                <FieldLabel>Tamil name</FieldLabel>
                <input className="input-field w-full" placeholder="தமிழ் பெயர்"
                  value={form.name_ta} onChange={e => setForm(f => ({ ...f, name_ta: e.target.value }))} />
              </div>
            )}
            <div className="flex items-end">
              <button className="btn-primary w-full py-2.5 flex items-center justify-center gap-2" disabled={saving}>
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {editing ? 'Update' : 'Add'} {title}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {data.results.map(item => (
          <div key={item.id}
            className={`bg-white border p-4 flex items-center justify-between hover:border-gray-300 transition-colors cursor-default ${editing?.id === item.id ? 'border-amber-300 bg-amber-50' : 'border-gray-100'}`}>
            <div>
              <p className="font-body font-semibold text-dillo-charcoal">{item.name}</p>
              {item.name_ta && <p className="font-body text-xs text-dillo-gold">{item.name_ta}</p>}
              <p className="font-body text-xs text-gray-400 mt-0.5">{item.slug} · {item.count || 0} products</p>
            </div>
            <button onClick={() => editing?.id === item.id ? cancel() : edit(item)}
              className={`p-2 transition-colors ${editing?.id === item.id ? 'text-amber-600' : 'text-dillo-charcoal hover:text-dillo-red'}`}>
              {editing?.id === item.id ? <X size={16} /> : <Edit size={16} />}
            </button>
          </div>
        ))}
        {data.results.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 py-10 text-center text-gray-400 font-body text-sm bg-white border border-gray-100">
            No {title.toLowerCase()}s yet.
          </div>
        )}
      </div>
      <Pager page={page} data={data} setPage={setPage} />
    </section>
  );
}

// ─── OrdersAdmin ──────────────────────────────────────────────────────────────
function OptionTableAdmin({ title, path, mode = 'name', onBack }) {
  const [pageSize, setPageSize] = useState(5);
  const { data, page, setPage, reload } = usePagedResource(path, {}, pageSize);
  const isInfo = mode === 'info';
  const emptyForm = isInfo
    ? { label: '', value: '', sort_order: 0, is_active: true }
    : { name: '', name_ta: '', slug: '', sort_order: 0, is_active: true };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val) => {
    setForm(f => ({ ...f, name: val, ...(slugManual ? {} : { slug: slugify(val) }) }));
  };

  const cancel = () => {
    setEditing(null);
    setSlugManual(false);
    setError('');
    setForm(emptyForm);
  };

  const edit = (item) => {
    setEditing(item);
    setSlugManual(!isInfo);
    setForm(isInfo
      ? { label: item.label || '', value: item.value || '', sort_order: item.sort_order || 0, is_active: item.is_active }
      : { name: item.name || '', name_ta: item.name_ta || '', slug: item.slug || '', sort_order: item.sort_order || 0, is_active: item.is_active }
    );
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const endpoint = editing
        ? `${path}${isInfo ? `${editing.id}/` : `${editing.slug}/`}`
        : path;
      await apiFetch(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(form),
      });
      cancel();
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePageSizeChange = (value) => {
    setPageSize(Number(value));
    setPage(1);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className="btn-outline text-xs px-3 py-2 inline-flex items-center gap-1 self-start">
          <ChevronLeft size={14} /> Products
        </button>
        <label className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 font-body text-xs text-gray-500 self-start">
          Page size
          <select
            className="outline-none bg-transparent text-dillo-charcoal font-semibold"
            value={pageSize}
            onChange={e => handlePageSizeChange(e.target.value)}
          >
            {[5, 10, 15, 20].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between ${editing ? 'bg-amber-50' : 'bg-dillo-cream'}`}>
          <h3 className="font-body text-sm font-bold text-dillo-charcoal">
            {editing ? `Editing: ${isInfo ? editing.label : editing.name}` : `Add new ${title.toLowerCase()}`}
          </h3>
          {editing && (
            <button type="button" onClick={cancel} className="font-body text-xs text-gray-500 hover:text-dillo-red flex items-center gap-1">
              <X size={13} /> Cancel editing
            </button>
          )}
        </div>
        <form onSubmit={save} className="p-5 space-y-3">
          {error && <p className="font-body text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}
          <div className="grid md:grid-cols-5 gap-3">
            {isInfo ? (
              <>
                <div className="md:col-span-2">
                  <FieldLabel required>Label</FieldLabel>
                  <input className="input-field w-full" placeholder="e.g. Fabric" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} required />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel required>Value</FieldLabel>
                  <input className="input-field w-full" placeholder="e.g. Pure Silk" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
                </div>
              </>
            ) : (
              <>
                <div>
                  <FieldLabel required>{title}</FieldLabel>
                  <input className="input-field w-full" placeholder={title} value={form.name} onChange={e => handleNameChange(e.target.value)} required />
                </div>
                <div>
                  <FieldLabel>Tamil name</FieldLabel>
                  <input className="input-field w-full" placeholder="Tamil name" value={form.name_ta} onChange={e => setForm(f => ({ ...f, name_ta: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel hint="Auto-generated">Slug</FieldLabel>
                  <input className="input-field w-full" placeholder="slug" value={form.slug} onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: e.target.value })); }} required />
                </div>
              </>
            )}
            <div>
              <FieldLabel>Sort</FieldLabel>
              <input className="input-field w-full" type="number" min="0" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
            <div className="flex items-end gap-2">
              <label className="h-10 flex items-center gap-2 border border-gray-200 bg-white px-3 font-body text-xs text-gray-600">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Active
              </label>
              <button className="btn-primary h-10 px-4 flex items-center justify-center gap-2" disabled={saving}>
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {editing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="bg-dillo-cream text-dillo-charcoal">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">{isInfo ? 'Label' : title}</th>
              <th className="text-left px-4 py-3 font-semibold">{isInfo ? 'Value' : 'Tamil Name'}</th>
              {!isInfo && <th className="text-left px-4 py-3 font-semibold">Slug</th>}
              <th className="text-left px-4 py-3 font-semibold">Sort</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map(item => {
              const active = item.is_active ?? true;
              return (
                <tr key={item.id} className={`border-t border-gray-100 transition-colors ${editing?.id === item.id ? 'bg-amber-50' : 'hover:bg-gray-50/80'}`}>
                  <td className="px-4 py-3 font-semibold text-dillo-charcoal">{isInfo ? item.label : item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{isInfo ? item.value : (item.name_ta || '-')}</td>
                  {!isInfo && <td className="px-4 py-3 text-gray-500">{item.slug}</td>}
                  <td className="px-4 py-3 text-gray-500">{item.sort_order}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 font-semibold rounded-sm ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => editing?.id === item.id ? cancel() : edit(item)}
                      className={`p-2 transition-colors ${editing?.id === item.id ? 'text-amber-600' : 'text-dillo-charcoal hover:text-dillo-red'}`}
                      title={editing?.id === item.id ? 'Close editor' : 'Edit'}
                    >
                      {editing?.id === item.id ? <X size={16} /> : <Edit size={16} />}
                    </button>
                  </td>
                </tr>
              );
            })}
            {data.results.length === 0 && (
              <tr>
                <td colSpan={isInfo ? 5 : 6} className="px-4 py-10 text-center text-gray-400">
                  No {title.toLowerCase()} records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} data={data} setPage={setPage} />
    </section>
  );
}

function OrdersAdmin() {
  const [status, setStatus] = useState('');
  const params = useMemo(() => ({ status }), [status]);
  const { data, page, setPage, reload } = usePagedResource('/orders/', params);

  const updateStatus = async (order, nextStatus) => {
    try {
      await apiFetch(`/orders/${order.id}/`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      reload();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors = {
    pending:   'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    packed:    'bg-indigo-100 text-indigo-800',
    shipped:   'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const allStatuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
  const paymentLabels = {
    cod: 'Cash on Delivery',
    upi: 'UPI',
    card: 'Card',
    netbanking: 'Net Banking',
    wallet: 'Wallet',
    other: 'Other',
  };
  const sourceLabels = {
    website: 'Website',
    video_shopping: 'Video Shopping',
    live_show: 'Live Show',
    whatsapp: 'WhatsApp',
    phone: 'Phone',
    other: 'Other',
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <FieldLabel>Filter by status</FieldLabel>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatus('')}
            className={`px-3 py-1.5 text-xs font-body font-semibold border transition-colors ${!status ? 'bg-dillo-charcoal text-white border-dillo-charcoal' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
          >
            All
          </button>
          {allStatuses.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs font-body font-semibold border transition-colors capitalize ${status === s ? 'bg-dillo-charcoal text-white border-dillo-charcoal' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {data.results.map(order => {
          const address = order.shipping_address || {};
          const customerName = [address.first_name, address.last_name].filter(Boolean).join(' ') || order.user_detail?.username || 'Customer';

          return (
          <div key={order.id} className="bg-white border border-gray-100 p-4 hover:border-gray-200 transition-colors">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div>
                <p className="font-body font-bold text-dillo-charcoal">{order.order_number}</p>
                <p className="font-body text-sm text-gray-500">
                  {order.user_detail?.username} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </p>
                <p className="font-body text-xs text-gray-400 mt-1">
                  Booked via {sourceLabels[order.order_source] || order.order_source || 'Website'} · {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="price-tag font-bold">{formatPrice(Number(order.total))}</p>
                <span className={`text-xs font-semibold px-2 py-1 capitalize rounded-sm ${statusColors[order.status] || ''}`}>
                  {order.status}
                </span>
                <select
                  className="input-field py-1.5 text-xs"
                  value={order.status}
                  onChange={e => updateStatus(order, e.target.value)}
                >
                  {allStatuses.map(s => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="bg-dillo-cream/60 p-3">
                <p className="font-cinzel text-[10px] tracking-widest uppercase text-dillo-gold mb-1">Payment</p>
                <p className="font-body text-sm font-semibold text-dillo-charcoal">{paymentLabels[order.payment_method] || order.payment_method}</p>
                <p className="font-body text-xs text-gray-500 capitalize">{order.payment_status || 'pending'}</p>
              </div>
              <div className="bg-dillo-cream/60 p-3">
                <p className="font-cinzel text-[10px] tracking-widest uppercase text-dillo-gold mb-1">Customer</p>
                <p className="font-body text-sm font-semibold text-dillo-charcoal">{customerName}</p>
                <p className="font-body text-xs text-gray-500">{address.phone || order.user_detail?.email || 'No phone'}</p>
              </div>
              <div className="bg-dillo-cream/60 p-3 sm:col-span-2 xl:col-span-1">
                <p className="font-cinzel text-[10px] tracking-widest uppercase text-dillo-gold mb-1">Delivery</p>
                <p className="font-body text-xs text-gray-600 leading-relaxed">
                  {[address.address, address.landmark, address.city, address.state, address.pincode].filter(Boolean).join(', ') || 'No address saved'}
                </p>
              </div>
              <div className="bg-dillo-cream/60 p-3">
                <p className="font-cinzel text-[10px] tracking-widest uppercase text-dillo-gold mb-1">Booking Info</p>
                <p className="font-body text-xs text-gray-600">{order.coupon_code ? `Coupon: ${order.coupon_code}` : 'No coupon'}</p>
                <p className="font-body text-xs text-gray-500 truncate" title={order.device_info || ''}>
                  {order.ip_address ? `IP: ${order.ip_address}` : 'IP not captured'}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {order.items.map(item => (
                <span key={item.id} className="bg-white border border-gray-200 px-2.5 py-1 text-xs font-body text-gray-600">
                  {item.product_snapshot?.name || 'Product'} × {item.quantity}
                </span>
              ))}
            </div>
          </div>
          );
        })}
        {data.results.length === 0 && (
          <p className="font-body text-sm text-gray-400 text-center py-10 bg-white border border-gray-100">
            No orders found.
          </p>
        )}
      </div>
      <Pager page={page} data={data} setPage={setPage} />
    </section>
  );
}

// ─── UsersAdmin ───────────────────────────────────────────────────────────────
function VideoShoppingAdmin() {
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const params = useMemo(() => ({ status, date }), [status, date]);
  const { data, loading, page, setPage, reload } = usePagedResource('/admin/video-shopping/', params);

  const bookings = data.results || [];
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  const editableStatuses = ['pending', 'completed'];

  useEffect(() => {
    setDrafts(current => {
      const next = { ...current };
      bookings.forEach(booking => {
        if (!next[booking.id]) {
          next[booking.id] = {
            status: booking.status || 'pending',
            attendee_name: booking.attendee_name || '',
          };
        }
      });
      return next;
    });
  }, [bookings]);

  const updateDraft = (id, field, value) => {
    setDrafts(current => ({
      ...current,
      [id]: {
        status: 'pending',
        attendee_name: '',
        ...current[id],
        [field]: value,
      },
    }));
  };

  const saveBooking = async (booking) => {
    const draft = drafts[booking.id] || {};
    const nextStatus = draft.status || booking.status || 'pending';
    const attendeeName = (draft.attendee_name || '').trim();

    if (nextStatus === 'completed' && !attendeeName) {
      setError('Enter attendee name before marking a video shopping session completed.');
      return;
    }

    setSavingId(booking.id);
    setError('');
    try {
      await apiFetch(`/admin/video-shopping/${booking.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          attendee_name: attendeeName,
        }),
      });
      reload();
    } catch (err) {
      setError(err.message || 'Unable to update video shopping booking.');
    } finally {
      setSavingId(null);
    }
  };

  const formatBookingDate = (value) => {
    if (!value) return '-';
    return new Date(`${value}T00:00:00`).toLocaleDateString();
  };

  const changeStatusFilter = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const changeDateFilter = (nextDate) => {
    setDate(nextDate);
    setPage(1);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <FieldLabel>Filter by status</FieldLabel>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => changeStatusFilter('')}
                className={`px-3 py-1.5 text-xs font-body font-semibold border transition-colors ${!status ? 'bg-dillo-charcoal text-white border-dillo-charcoal' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                All
              </button>
              {editableStatuses.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-body font-semibold border transition-colors capitalize ${status === s ? 'bg-dillo-charcoal text-white border-dillo-charcoal' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Date</FieldLabel>
            <input
              type="date"
              className="input-field py-2 text-sm"
              value={date}
              onChange={e => changeDateFilter(e.target.value)}
            />
          </div>
          {date && (
            <button type="button" onClick={() => changeDateFilter('')} className="btn-outline text-xs px-3 py-2">
              Clear date
            </button>
          )}
        </div>
        {loading && <LogoLoader size="sm" label="Loading bookings..." />}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 font-body text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm font-body">
          <thead className="bg-dillo-cream">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Customer</th>
              <th className="text-left px-4 py-3 font-semibold">Contact</th>
              <th className="text-left px-4 py-3 font-semibold">Slot</th>
              <th className="text-left px-4 py-3 font-semibold">Meet Link</th>
              <th className="text-left px-4 py-3 font-semibold">Note</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Attendee</th>
              <th className="text-left px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => {
              const draft = drafts[booking.id] || {
                status: booking.status || 'pending',
                attendee_name: booking.attendee_name || '',
              };
              const hasChanges =
                draft.status !== booking.status ||
                (draft.attendee_name || '') !== (booking.attendee_name || '');

              return (
                <tr key={booking.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-dillo-charcoal">{booking.name}</p>
                    <p className="text-xs text-gray-400">Booked {booking.created_at ? new Date(booking.created_at).toLocaleString() : '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{booking.email}</p>
                    <p className="text-xs text-gray-400">{booking.phone || 'No phone'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-dillo-charcoal">{formatBookingDate(booking.date)}</p>
                    <p className="text-xs text-gray-500">{booking.time_slot_display || booking.time_slot}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    {booking.meet_link ? (
                      <a
                        href={booking.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-dillo-red hover:underline break-all"
                      >
                        {booking.meet_link}
                      </a>
                    ) : (
                      <span className="text-gray-400">No link</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[220px] text-gray-600">
                    <p className="line-clamp-3">{booking.note || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-semibold px-2 py-1 capitalize rounded-sm mb-2 ${statusColors[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                      {booking.status}
                    </span>
                    <select
                      className="input-field py-1.5 text-xs min-w-[130px]"
                      value={draft.status}
                      onChange={e => updateDraft(booking.id, 'status', e.target.value)}
                    >
                      {editableStatuses.map(s => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="input-field py-1.5 text-xs min-w-[170px]"
                      placeholder="Attendee name"
                      value={draft.attendee_name}
                      onChange={e => updateDraft(booking.id, 'attendee_name', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={!hasChanges || savingId === booking.id}
                      onClick={() => saveBooking(booking)}
                      className="btn-primary text-xs px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingId === booking.id ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  No video shopping bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} data={data} setPage={setPage} />
    </section>
  );
}

function UsersAdmin() {
  const [search, setSearch] = useState('');
  const params = useMemo(() => ({ search }), [search]);
  const { data, page, setPage } = usePagedResource('/admin/users/', params);

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2 bg-white border border-gray-100 px-3 py-2 max-w-sm">
        <Search size={15} className="text-gray-400" />
        <input className="outline-none font-body text-sm flex-1" placeholder="Search users…"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500"><X size={13} /></button>
        )}
      </div>
      <div className="bg-white border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="bg-dillo-cream">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">User</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Role</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map(user => (
              <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-semibold">{user.username}</td>
                <td className="px-4 py-3 text-gray-600">{user.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${user.is_staff ? 'bg-dillo-charcoal text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {user.is_staff ? 'Admin' : 'Customer'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {data.results.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} data={data} setPage={setPage} />
    </section>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview() {
  const [summary, setSummary] = useState(null);
  useEffect(() => { apiFetch('/admin/dashboard/').then(setSummary).catch(console.error); }, []);
  if (!summary) return (
    <div className="py-10">
      <LogoLoader size="sm" label="Loading overview..." />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Stat label="Products"  value={summary.totals.products} />
        <Stat label="Users"     value={summary.totals.users} />
        <Stat label="Orders"    value={summary.totals.orders} />
        <Stat label="Revenue"   value={formatPrice(Number(summary.totals.revenue || 0))} />
        <Stat label="Low Stock" value={summary.totals.low_stock} />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white border border-gray-100 p-5">
          <h2 className="font-display text-xl font-bold text-dillo-charcoal mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {summary.recent_orders.map(order => (
              <div key={order.id} className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-body font-semibold text-dillo-charcoal">{order.order_number}</p>
                  <p className="font-body text-xs text-gray-500">{order.user_detail?.username}</p>
                </div>
                <div className="text-right">
                  <p className="price-tag text-sm font-bold">{formatPrice(Number(order.total))}</p>
                  <p className="font-body text-xs text-gray-500 capitalize">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-white border border-gray-100 p-5">
          <h2 className="font-display text-xl font-bold text-dillo-charcoal mb-4">Top Products</h2>
          <div className="space-y-3">
            {summary.top_products.map((item, i) => (
              <div key={item.saree__id} className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="font-cinzel text-xs text-dillo-gold w-4">{i + 1}</span>
                  <p className="font-body font-semibold text-dillo-charcoal">{item.saree__name}</p>
                </div>
                <p className="font-body text-sm text-gray-500">{item.quantity} sold</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── AdminDashboardPage ───────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const primaryTabId = getPrimaryTabId(activeTab);
  const headingTab = tabs.find(t => t.id === primaryTabId);
  const HeadingIcon = headingTab?.icon || LayoutDashboard;
  const headingLabel = productInnerPages[activeTab] || headingTab?.label;

  if (loading) return (
    <div className="min-h-screen bg-dillo-ivory flex items-center justify-center">
      <LogoLoader size="md" label="Checking admin access..." />
    </div>
  );
  if (!user?.is_staff) return <Navigate to="/admin/login" replace />;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Only scroll to top when switching tabs — not on any other interaction
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen bg-dillo-ivory">
      {/* Header */}
      <div className="bg-dillo-charcoal text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-cinzel text-[10px] tracking-widest uppercase text-dillo-gold">Dillo Admin</p>
            <h1 className="font-display text-2xl font-bold leading-tight">Dashboard</h1>
          </div>
          {/* Tab bar inside header on desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-2 font-body text-xs font-semibold flex items-center gap-1.5 rounded-sm transition-colors ${
                    primaryTabId === tab.id
                      ? 'bg-dillo-red text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </nav>
          <button onClick={logout}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 font-body text-sm flex items-center gap-2 transition-colors rounded-sm whitespace-nowrap">
            <LogOut size={15} /> Logout
          </button>
        </div>
        {/* Mobile tab bar */}
        <div className="lg:hidden flex overflow-x-auto border-t border-white/10">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 px-4 py-2.5 font-body text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                  primaryTabId === tab.id
                    ? 'border-dillo-red text-white bg-white/10'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                <Icon size={13} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Section heading */}
        <div className="flex items-center gap-2 mb-6">
          <HeadingIcon size={20} className="text-dillo-red" />
          <h2 className="font-display text-2xl font-bold text-dillo-charcoal">
            {headingLabel}
          </h2>
        </div>

        {activeTab === 'overview'    && <Overview />}
        {activeTab === 'home-screen' && <HomeScreenAdmin />}
        {activeTab === 'products'    && <ProductsAdmin onAdminNavigate={handleTabChange} />}
        {activeTab === 'categories'  && <SimpleTaxonomyAdmin title="Category" path="/saree-categories/" hasTamil />}
        {activeTab === 'product-names' && <OptionTableAdmin title="Product Name" path="/product-name-options/" onBack={() => handleTabChange('products')} />}
        {activeTab === 'saree-types' && <OptionTableAdmin title="Saree Type" path="/saree-type-options/" onBack={() => handleTabChange('products')} />}
        {activeTab === 'product-info' && <OptionTableAdmin title="Product Info" path="/product-info-options/" mode="info" onBack={() => handleTabChange('products')} />}
        {activeTab === 'occasions'   && <SimpleTaxonomyAdmin title="Occasion" path="/occasion-categories/" />}
        {activeTab === 'orders'      && <OrdersAdmin />}
        {activeTab === 'video-shopping' && <VideoShoppingAdmin />}
        {activeTab === 'users'       && <UsersAdmin />}
      </div>
    </div>
  );
}


