import { useMemo, useState } from 'react';
import { useUser, useClerk, Show } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, Copy, ExternalLink, Eye, EyeOff, FilePlus2, LayoutDashboard, LogOut, Pencil, Plus, Save, Settings2, Trash2, X } from 'lucide-react';
import { Link } from 'wouter';
import {
  getGetAdminHomeQueryKey,
  getGetAdminHomeSummaryQueryKey,
  getGetHomePageQueryKey,
  useCreateContentItem,
  useCreateContentSection,
  useDeleteContentItem,
  useDeleteContentSection,
  useGetAdminHome,
  useGetAdminHomeSummary,
  useHealthCheck,
  useUpdateContentItem,
  useUpdateContentSection,
  useUpdateSiteSettings,
} from '@workspace/api-client-react';
import type { ContentItem, ContentItemInput, ContentSection, ContentSectionInput, HomePage, NavigationLink, SiteSettings } from '@workspace/api-client-react';

type Flash = { tone: 'success' | 'error'; message: string } | null;

function errorMessage(error: unknown) {
  const candidate = error as { response?: { status?: number }; status?: number; message?: string };
  return candidate?.response?.status === 403 || candidate?.status === 403 ? 'Your account is signed in, but it is not on the admin allowlist.' : candidate?.message || 'Something went wrong. Please try again.';
}

function Button({ children, onClick, tone = 'quiet', testId, type = 'button', disabled = false }: { children: React.ReactNode; onClick?: () => void; tone?: 'quiet' | 'primary' | 'danger'; testId: string; type?: 'button' | 'submit'; disabled?: boolean }) {
  const styles = tone === 'primary' ? 'bg-[#0B3472] text-white hover:bg-[#082859]' : tone === 'danger' ? 'text-[#c51924] hover:bg-[#fff0f0]' : 'text-slate-600 hover:bg-slate-100';
  return <button type={type} onClick={onClick} disabled={disabled} className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles}`} data-testid={testId}>{children}</button>;
}

function Field({ label, value, onChange, placeholder, multiline = false, required = false, testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; required?: boolean; testId: string }) {
  const common = { value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), placeholder, required, className: 'focus-ring mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-[#0B3472]/40 focus:ring-4 focus:ring-[#0B3472]/10' };
  return <label className="block text-sm font-semibold text-slate-700">{label}{multiline ? <textarea {...common} rows={4} data-testid={testId} /> : <input {...common} data-testid={testId} />}</label>;
}

function Shell({ children, home, onNavigate }: { children: React.ReactNode; home?: HomePage; onNavigate?: (value: string) => void }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileNav, setMobileNav] = useState(false);
  return <div className="min-h-[100dvh] bg-[#f5f7fb] text-slate-900"><aside className={`${mobileNav ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-[#0B3472] px-5 py-6 text-white transition-transform md:translate-x-0`}><div className="flex items-center justify-between"><Link href="/" className="focus-ring flex items-center gap-3" data-testid="link-admin-brand"><span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1"><img src={home?.settings.logoUrl || '/shastra-college-logo.png'} alt="" className="h-full w-full object-contain" /></span><span className="min-w-0"><span className="block truncate font-display text-sm font-bold">{home?.settings.collegeName || 'Shastra Junior College'}</span><span className="eyebrow block text-blue-200">Admin workspace</span></span></Link><button className="rounded-lg p-2 text-white md:hidden" onClick={() => setMobileNav(false)} aria-label="Close sidebar" data-testid="button-close-sidebar"><X className="h-5 w-5" /></button></div><div className="mt-12"><p className="eyebrow mb-3 text-blue-200">Manage</p><button onClick={() => { onNavigate?.('overview'); setMobileNav(false); }} className="focus-ring flex w-full items-center gap-3 rounded-xl bg-white/10 px-3.5 py-3 text-left text-sm font-semibold" data-testid="button-nav-overview"><LayoutDashboard className="h-4 w-4" /> Homepage</button><button onClick={() => { onNavigate?.('settings'); setMobileNav(false); }} className="focus-ring mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-blue-100 hover:bg-white/10" data-testid="button-nav-settings"><Settings2 className="h-4 w-4" /> Site settings</button></div><div className="mt-auto border-t border-white/15 pt-5"><p className="truncate text-xs text-blue-100" data-testid="text-admin-user">{user?.primaryEmailAddress?.emailAddress || user?.id}</p><Button onClick={() => signOut({ redirectUrl: '/' })} testId="button-sign-out"><LogOut className="h-4 w-4" /> Sign out</Button></div></aside>{mobileNav ? <button className="fixed inset-0 z-40 bg-[#0B3472]/30 md:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation overlay" data-testid="button-nav-overlay" /> : null}<div className="md:pl-[272px]"><header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-[#f5f7fb]/90 px-5 backdrop-blur-xl sm:px-8"><button onClick={() => setMobileNav(true)} className="focus-ring rounded-lg p-2 text-[#0B3472] md:hidden" aria-label="Open sidebar" data-testid="button-open-sidebar"><ChevronDown className="h-5 w-5" /></button><div className="hidden md:block"><p className="eyebrow text-[#E3212B]">Content operations</p><p className="font-display text-lg font-extrabold text-[#0B3472]">Keep the front door current.</p></div><Link href="/" className="focus-ring ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-[#0B3472]" data-testid="link-view-site"><ExternalLink className="h-4 w-4" /> View site</Link></header><main>{children}</main></div></div>;
}

function SettingsEditor({ home, flash, setFlash }: { home: HomePage; flash: Flash; setFlash: (flash: Flash) => void }) {
  const client = useQueryClient();
  const mutation = useUpdateSiteSettings();
  const [collegeName, setCollegeName] = useState(home.settings.collegeName);
  const [logoUrl, setLogoUrl] = useState(home.settings.logoUrl || '');
  const [footerNote, setFooterNote] = useState(home.settings.footerNote);
  const [navigation, setNavigation] = useState<NavigationLink[]>(home.settings.navigation);
  const addNav = () => setNavigation([...navigation, { label: '', path: '/' }]);
  const updateNav = (index: number, key: keyof NavigationLink, value: string) => setNavigation(navigation.map((link, i) => i === index ? { ...link, [key]: value } : link));
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!collegeName.trim() || navigation.some((link) => !link.label.trim() || !link.path.trim())) {
      setFlash({ tone: 'error', message: 'Add a college name and complete every navigation link.' }); return;
    }
    mutation.mutate({ data: { collegeName: collegeName.trim(), logoUrl: logoUrl.trim() || null, footerNote, navigation } }, {
      onSuccess: () => { client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }); client.invalidateQueries({ queryKey: getGetHomePageQueryKey() }); setFlash({ tone: 'success', message: 'Site settings saved.' }); },
      onError: (error) => setFlash({ tone: 'error', message: errorMessage(error) }),
    });
  };
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" data-testid="panel-site-settings"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="eyebrow text-[#E3212B]">Shared identity</p><h2 className="mt-2 font-display text-2xl font-extrabold text-[#0B3472]">Site settings</h2><p className="mt-1 text-sm text-slate-500">These details appear across the public homepage.</p></div><div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#eaf0f8] text-[#0B3472] sm:flex"><Settings2 className="h-5 w-5" /></div></div><form onSubmit={save} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="College name" value={collegeName} onChange={setCollegeName} required testId="input-college-name" /><Field label="Logo URL" value={logoUrl} onChange={setLogoUrl} placeholder="Optional hosted image URL" testId="input-logo-url" /></div><Field label="Footer note" value={footerNote} onChange={setFooterNote} multiline testId="input-footer-note" /><div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-semibold text-slate-700">Navigation links</label><Button onClick={addNav} testId="button-add-navigation"><Plus className="h-4 w-4" /> Add link</Button></div><div className="space-y-2">{navigation.map((link, index) => <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" key={`${index}-${link.path}`}><input value={link.label} onChange={(e) => updateNav(index, 'label', e.target.value)} placeholder="Label" className="focus-ring rounded-xl border border-slate-200 px-3 py-2 text-sm" aria-label={`Navigation label ${index + 1}`} data-testid={`input-navigation-label-${index}`} /><input value={link.path} onChange={(e) => updateNav(index, 'path', e.target.value)} placeholder="/path" className="focus-ring rounded-xl border border-slate-200 px-3 py-2 text-sm" aria-label={`Navigation path ${index + 1}`} data-testid={`input-navigation-path-${index}`} /><Button onClick={() => setNavigation(navigation.filter((_, i) => i !== index))} tone="danger" testId={`button-remove-navigation-${index}`}><Trash2 className="h-4 w-4" /></Button></div>)}</div></div><div className="flex items-center justify-end gap-3"><span className="text-xs text-slate-500">{flash?.tone === 'success' ? 'Saved just now' : ''}</span><Button type="submit" tone="primary" testId="button-save-settings" disabled={mutation.isPending}><Save className="h-4 w-4" /> {mutation.isPending ? 'Saving…' : 'Save settings'}</Button></div></form></section>;
}

function SectionForm({ initial, onClose, onSaved }: { initial?: ContentSection; onClose: () => void; onSaved: (message: string) => void }) {
  const client = useQueryClient();
  const create = useCreateContentSection();
  const update = useUpdateContentSection();
  const [title, setTitle] = useState(initial?.title || '');
  const [sectionKey, setSectionKey] = useState(initial?.sectionKey || '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle || '');
  const [position, setPosition] = useState(String(initial?.position ?? 0));
  const [visible, setVisible] = useState(initial?.isVisible ?? true);
  const [content, setContent] = useState(JSON.stringify(initial?.content || {}, null, 2));
  const [error, setError] = useState('');
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !sectionKey.trim() || Number(position) < 0) { setError('Title, section key, and a non-negative position are required.'); return; }
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(content || '{}'); } catch { setError('Content must be valid JSON.'); return; }
    const data = { pageSlug: 'home', sectionKey: sectionKey.trim(), title: title.trim(), subtitle: subtitle.trim() || null, content: parsed, isVisible: visible, position: Number(position) };
    const options = { onSuccess: () => { client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }); client.invalidateQueries({ queryKey: getGetAdminHomeSummaryQueryKey() }); client.invalidateQueries({ queryKey: getGetHomePageQueryKey() }); onSaved(initial ? 'Section updated.' : 'Section created.'); onClose(); }, onError: (e: unknown) => setError(errorMessage(e)) };
    if (initial) update.mutate({ id: initial.id, data }, options); else create.mutate({ data: data as ContentSectionInput }, options);
  };
  return <form onSubmit={save} className="mt-4 rounded-2xl border border-[#0B3472]/15 bg-[#f5f8fc] p-5" data-testid="form-section"><div className="mb-4 flex items-center justify-between"><h3 className="font-display font-extrabold text-[#0B3472]">{initial ? 'Edit section' : 'New section'}</h3><Button onClick={onClose} testId="button-close-section-form"><X className="h-4 w-4" /></Button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Section title" value={title} onChange={setTitle} required testId="input-section-title" /><Field label="Section key" value={sectionKey} onChange={setSectionKey} placeholder="e.g. hero" required testId="input-section-key" /></div><div className="mt-4"><Field label="Subtitle" value={subtitle} onChange={setSubtitle} testId="input-section-subtitle" /></div><div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]"><Field label="Position" value={position} onChange={setPosition} testId="input-section-position" /><label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 accent-[#0B3472]" data-testid="input-section-visible" /> Visible on site</label></div><div className="mt-4"><Field label="Content JSON" value={content} onChange={setContent} multiline testId="input-section-content" /></div>{error ? <p className="mt-3 text-sm font-semibold text-[#c51924]" data-testid="error-section-form">{error}</p> : null}<div className="mt-5 flex justify-end"><Button type="submit" tone="primary" testId="button-submit-section" disabled={create.isPending || update.isPending}><Save className="h-4 w-4" /> Save section</Button></div></form>;
}

function ItemForm({ sectionId, initial, onClose, onSaved }: { sectionId: string; initial?: ContentItem; onClose: () => void; onSaved: (message: string) => void }) {
  const client = useQueryClient();
  const create = useCreateContentItem();
  const update = useUpdateContentItem();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [itemType, setItemType] = useState(initial?.itemType || 'card');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [linkPath, setLinkPath] = useState(initial?.linkPath || '');
  const [label, setLabel] = useState(initial?.label || '');
  const [position, setPosition] = useState(String(initial?.position ?? 0));
  const [visible, setVisible] = useState(initial?.isVisible ?? true);
  const [content, setContent] = useState(JSON.stringify(initial?.content || {}, null, 2));
  const [error, setError] = useState('');
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !itemType.trim() || Number(position) < 0) { setError('Title, item type, and a non-negative position are required.'); return; }
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(content || '{}'); } catch { setError('Content must be valid JSON.'); return; }
    const data: ContentItemInput = { sectionId, itemType: itemType.trim(), title: title.trim(), description: description.trim() || null, imageUrl: imageUrl.trim() || null, linkPath: linkPath.trim() || null, label: label.trim() || null, content: parsed, isVisible: visible, position: Number(position) };
    const options = { onSuccess: () => { client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }); client.invalidateQueries({ queryKey: getGetAdminHomeSummaryQueryKey() }); client.invalidateQueries({ queryKey: getGetHomePageQueryKey() }); onSaved(initial ? 'Item updated.' : 'Item created.'); onClose(); }, onError: (e: unknown) => setError(errorMessage(e)) };
    if (initial) update.mutate({ id: initial.id, data }, options); else create.mutate({ data }, options);
  };
  return <form onSubmit={save} className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" data-testid="form-item"><div className="mb-4 flex items-center justify-between"><h4 className="font-bold text-[#0B3472]">{initial ? 'Edit item' : 'New item'}</h4><Button onClick={onClose} testId="button-close-item-form"><X className="h-4 w-4" /></Button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Title" value={title} onChange={setTitle} required testId="input-item-title" /><Field label="Type" value={itemType} onChange={setItemType} required testId="input-item-type" /><Field label="Description" value={description} onChange={setDescription} multiline testId="input-item-description" /><Field label="Image URL" value={imageUrl} onChange={setImageUrl} testId="input-item-image-url" /><Field label="Link path" value={linkPath} onChange={setLinkPath} testId="input-item-link-path" /><Field label="Link label" value={label} onChange={setLabel} testId="input-item-label" /><Field label="Position" value={position} onChange={setPosition} testId="input-item-position" /><label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 accent-[#0B3472]" data-testid="input-item-visible" /> Visible on site</label></div><div className="mt-4"><Field label="Content JSON" value={content} onChange={setContent} multiline testId="input-item-content" /></div>{error ? <p className="mt-3 text-sm font-semibold text-[#c51924]" data-testid="error-item-form">{error}</p> : null}<div className="mt-5 flex justify-end"><Button type="submit" tone="primary" testId="button-submit-item" disabled={create.isPending || update.isPending}><Save className="h-4 w-4" /> Save item</Button></div></form>;
}

function SectionRow({ section, items, index, total, onFlash }: { section: ContentSection; items: ContentItem[]; index: number; total: number; onFlash: (message: string) => void }) {
  const client = useQueryClient();
  const update = useUpdateContentSection();
  const itemUpdate = useUpdateContentItem();
  const deleteSection = useDeleteContentSection();
  const deleteItem = useDeleteContentItem();
  const [expanded, setExpanded] = useState(index === 0);
  const [sectionForm, setSectionForm] = useState(false);
  const [itemForm, setItemForm] = useState<string | 'new' | null>(null);
  const mutateSection = (data: { isVisible?: boolean; position?: number }) => update.mutate({ id: section.id, data }, { onSuccess: () => { client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }); client.invalidateQueries({ queryKey: getGetAdminHomeSummaryQueryKey() }); client.invalidateQueries({ queryKey: getGetHomePageQueryKey() }); onFlash('Section updated.'); }, onError: (e) => onFlash(errorMessage(e)) });
  const confirmDelete = () => { if (window.confirm(`Delete “${section.title}” and its items?`)) deleteSection.mutate({ id: section.id }, { onSuccess: () => { client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }); client.invalidateQueries({ queryKey: getGetAdminHomeSummaryQueryKey() }); client.invalidateQueries({ queryKey: getGetHomePageQueryKey() }); onFlash('Section deleted.'); }, onError: (e) => onFlash(errorMessage(e)) }); };
  const move = (direction: -1 | 1) => mutateSection({ position: Math.max(0, section.position + direction) });
  const mutateItem = (item: ContentItem, data: { isVisible?: boolean; position?: number }) => itemUpdate.mutate({ id: item.id, data }, { onSuccess: () => { client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }); client.invalidateQueries({ queryKey: getGetAdminHomeSummaryQueryKey() }); client.invalidateQueries({ queryKey: getGetHomePageQueryKey() }); onFlash('Item updated.'); }, onError: (e) => onFlash(errorMessage(e)) });
  return <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" data-testid={`row-section-${section.id}`}><div className="flex flex-wrap items-center gap-3 p-4 sm:p-5"><button onClick={() => setExpanded(!expanded)} className="focus-ring flex min-w-0 flex-1 items-center gap-3 text-left" data-testid={`button-expand-section-${section.id}`}>{expanded ? <ChevronUp className="h-5 w-5 shrink-0 text-[#0B3472]" /> : <ChevronDown className="h-5 w-5 shrink-0 text-[#0B3472]" />}<span className="min-w-0"><span className="block truncate font-display text-lg font-extrabold text-[#0B3472]">{section.title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{section.sectionKey} · {items.length} item{items.length === 1 ? '' : 's'}</span></span></button><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${section.isVisible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`} data-testid={`status-section-${section.id}`}>{section.isVisible ? 'Visible' : 'Hidden'}</span><div className="flex items-center gap-1 border-l border-slate-200 pl-2"><Button onClick={() => move(-1)} testId={`button-move-section-up-${section.id}`} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button><Button onClick={() => move(1)} testId={`button-move-section-down-${section.id}`} disabled={index === total - 1}><ArrowDown className="h-4 w-4" /></Button><Button onClick={() => mutateSection({ isVisible: !section.isVisible })} testId={`button-toggle-section-${section.id}`}>{section.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button><Button onClick={() => setSectionForm(!sectionForm)} testId={`button-edit-section-${section.id}`}><Pencil className="h-4 w-4" /></Button><Button onClick={confirmDelete} tone="danger" testId={`button-delete-section-${section.id}`}><Trash2 className="h-4 w-4" /></Button></div></div>{sectionForm ? <div className="px-4 pb-4 sm:px-5"><SectionForm initial={section} onClose={() => setSectionForm(false)} onSaved={onFlash} /></div> : null}{expanded ? <div className="border-t border-slate-100 px-4 py-4 sm:px-5"><div className="mb-3 flex items-center justify-between"><p className="eyebrow text-slate-400">Repeatable items</p><Button onClick={() => setItemForm('new')} testId={`button-add-item-${section.id}`}><Plus className="h-4 w-4" /> Add item</Button></div>{items.length === 0 && itemForm !== 'new' ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-sm text-slate-500" data-testid={`empty-items-${section.id}`}>No items in this section yet.</div> : <div className="space-y-2">{items.map((item, itemIndex) => <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3" data-testid={`row-item-${item.id}`}><div className="flex flex-wrap items-center gap-2"><span className="w-5 text-center text-xs font-bold text-slate-400">{item.position + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{item.title}</p><p className="truncate text-xs text-slate-500">{item.itemType}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.isVisible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{item.isVisible ? 'Shown' : 'Hidden'}</span><Button onClick={() => mutateItem(item, { position: Math.max(0, item.position - 1) })} testId={`button-move-item-up-${item.id}`} disabled={itemIndex === 0}><ArrowUp className="h-3.5 w-3.5" /></Button><Button onClick={() => mutateItem(item, { position: item.position + 1 })} testId={`button-move-item-down-${item.id}`} disabled={itemIndex === items.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button><Button onClick={() => mutateItem(item, { isVisible: !item.isVisible })} testId={`button-toggle-item-${item.id}`}>{item.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button><Button onClick={() => setItemForm(itemForm === item.id ? null : item.id)} testId={`button-edit-item-${item.id}`}><Pencil className="h-3.5 w-3.5" /></Button><Button onClick={() => { if (window.confirm(`Delete “${item.title}”?`)) deleteItem.mutate({ id: item.id }, { onSuccess: () => { client.invalidateQueries({ queryKey: getGetAdminHomeQueryKey() }); client.invalidateQueries({ queryKey: getGetAdminHomeSummaryQueryKey() }); client.invalidateQueries({ queryKey: getGetHomePageQueryKey() }); onFlash('Item deleted.'); }, onError: (e) => onFlash(errorMessage(e)) }); }} tone="danger" testId={`button-delete-item-${item.id}`}><Trash2 className="h-3.5 w-3.5" /></Button></div>{itemForm === item.id ? <ItemForm sectionId={section.id} initial={item} onClose={() => setItemForm(null)} onSaved={onFlash} /> : null}</div>)}</div>}{itemForm === 'new' ? <ItemForm sectionId={section.id} onClose={() => setItemForm(null)} onSaved={onFlash} /> : null}</div> : null}</div>;
}

function AdminWorkspace() {
  const { user } = useUser();
  const admin = useGetAdminHome();
  const summary = useGetAdminHomeSummary();
  const health = useHealthCheck();
  const [tab, setTab] = useState('overview');
  const [sectionForm, setSectionForm] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);
  const home = admin.data;
  const sections = useMemo(() => [...(home?.sections || [])].sort((a, b) => a.position - b.position), [home?.sections]);
  const items = home?.items || [];
  if (admin.isLoading) return <AdminLoading />;
  if (admin.isError || !home) return <AccessDenied userId={user?.id} error={admin.error} />;
  const showFlash = (message: string) => { setFlash(message.startsWith('Your account') || message.includes('wrong') ? { tone: 'error', message } : { tone: 'success', message }); window.setTimeout(() => setFlash(null), 3500); };
  return <Shell home={home} onNavigate={setTab}><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">{flash ? <div className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${flash.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`} role="status" data-testid="status-flash"><Check className="h-4 w-4" />{flash.message}<button onClick={() => setFlash(null)} className="ml-auto" aria-label="Dismiss message" data-testid="button-dismiss-flash"><X className="h-4 w-4" /></button></div> : null}<div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow text-[#E3212B]">{tab === 'settings' ? 'Settings' : 'Homepage'}</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0B3472] sm:text-4xl">{tab === 'settings' ? 'The shared site details.' : 'Your publishing desk.'}</h1><p className="mt-2 max-w-xl text-slate-500">{tab === 'settings' ? 'Keep the identity and navigation consistent wherever students find you.' : 'Shape the public homepage, one clear section at a time.'}</p></div><div className="flex items-center gap-2 text-xs text-slate-500" data-testid="status-health"><span className={`h-2 w-2 rounded-full ${health.data?.status === 'ok' ? 'bg-emerald-500' : health.isError ? 'bg-amber-500' : 'bg-slate-300'}`} /> API {health.data?.status || (health.isError ? 'checking' : 'ready')}</div></div>{tab === 'settings' ? <SettingsEditor home={home} flash={flash} setFlash={setFlash} /> : <><div className="mb-8 grid gap-3 sm:grid-cols-3">{[['Visible sections', summary.data?.visibleSectionCount ?? 0, 'of ' + (summary.data?.sectionCount ?? sections.length)], ['Visible items', summary.data?.visibleItemCount ?? 0, 'of ' + (summary.data?.itemCount ?? items.length)], ['Hidden for review', (summary.data?.hiddenSectionCount ?? 0) + (summary.data?.hiddenItemCount ?? 0), 'not published']].map(([label, value, note], index) => <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={String(label)} data-testid={`card-summary-${index}`}><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 font-display text-3xl font-extrabold text-[#0B3472]">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>)}</div><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-2xl font-extrabold text-[#0B3472]">Homepage sections</h2><p className="mt-1 text-sm text-slate-500">Order, visibility, and repeatable content all live here.</p></div><Button onClick={() => setSectionForm(!sectionForm)} tone="primary" testId="button-add-section"><FilePlus2 className="h-4 w-4" /> New section</Button></div>{sectionForm ? <SectionForm onClose={() => setSectionForm(false)} onSaved={showFlash} /> : null}<div className="mt-4 space-y-3">{sections.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center" data-testid="empty-sections"><FilePlus2 className="mx-auto h-8 w-8 text-[#0B3472]" /><h3 className="mt-4 font-display text-xl font-extrabold text-[#0B3472]">No homepage sections yet.</h3><p className="mt-2 text-sm text-slate-500">Start with a hero, then add the sections you want students to see.</p></div> : sections.map((section, index) => <SectionRow key={section.id} section={section} index={index} total={sections.length} items={items.filter((item) => item.sectionId === section.id).sort((a, b) => a.position - b.position)} onFlash={showFlash} />)}</div></>}</div></Shell>;
}

function AdminLoading() {
  return <div className="min-h-[100dvh] bg-[#f5f7fb] p-8 md:pl-[320px]"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /><div className="mt-8 grid max-w-5xl gap-4 sm:grid-cols-3"><div className="h-32 animate-pulse rounded-2xl bg-white" /><div className="h-32 animate-pulse rounded-2xl bg-white" /><div className="h-32 animate-pulse rounded-2xl bg-white" /></div><div className="mt-6 h-56 max-w-5xl animate-pulse rounded-2xl bg-white" /></div>;
}

function AccessDenied({ userId, error }: { userId?: string; error: unknown }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { if (userId) { await navigator.clipboard?.writeText(userId); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } };
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] p-6"><div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-[#0B3472]/5 sm:p-10"><Link href="/" className="focus-ring text-sm font-bold text-[#0B3472]" data-testid="link-denied-home">← Return to public site</Link><p className="eyebrow mt-12 text-[#E3212B]">Admin access</p><h1 className="mt-3 font-display text-3xl font-extrabold text-[#0B3472]">This workspace is restricted.</h1><p className="mt-4 leading-7 text-slate-600">{errorMessage(error)} Ask the site owner to add the signed-in user ID below to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">ADMIN_USER_IDS</code> in Replit Secrets.</p>{userId ? <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"><code className="min-w-0 flex-1 truncate text-sm text-slate-700" data-testid="text-user-id">{userId}</code><Button onClick={copy} testId="button-copy-user-id"><Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy ID'}</Button></div> : <Link href="/sign-in" className="focus-ring mt-6 inline-flex rounded-xl bg-[#0B3472] px-5 py-3 text-sm font-bold text-white" data-testid="link-sign-in">Sign in to continue</Link>}</div></div>;
}

export default function AdminPage() {
  return <><Show when="signed-out"><div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] p-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-[#0B3472]/5"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B3472] text-white"><LayoutDashboard /></span><p className="eyebrow mt-8 text-[#E3212B]">Staff workspace</p><h1 className="mt-3 font-display text-3xl font-extrabold text-[#0B3472]">Sign in to manage the homepage.</h1><p className="mt-3 leading-7 text-slate-600">The public college site is open to everyone. This calm workspace is reserved for the team keeping it current.</p><Link href="/sign-in" className="focus-ring mt-7 inline-flex w-full items-center justify-center rounded-xl bg-[#0B3472] px-5 py-3.5 text-sm font-bold text-white" data-testid="link-admin-sign-in">Continue to sign in</Link></div></div></Show><Show when="signed-in"><AdminWorkspace /></Show></>;
}