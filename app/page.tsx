'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, getAccessToken, logout } from '@/lib/firebase';
import { Settings, Save, FileDown, Plus, Trash2, Upload, Cloud, Grid, Type, Layout, BookOpen, LogOut, Menu, X, Bold, Italic, Image as ImageIcon, Palette, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// OKLCH to RGB parsing and conversion functions to prevent html2canvas crashing on Tailwind CSS v4 OKLCH colors
const oklchToRgb = (l: number, c: number, h: number, a = 1): string => {
  const hRad = (h * Math.PI) / 180;
  const a_val = c * Math.cos(hRad);
  const b_val = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a_val + 0.2158037573 * b_val;
  const m_ = l - 0.1055613458 * a_val - 0.0638541728 * b_val;
  const s_ = l - 0.0894841775 * a_val - 1.2914855480 * b_val;

  const l_3 = l_ * l_ * l_;
  const m_3 = m_ * m_ * m_;
  const s_3 = s_ * s_ * s_;

  let r = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  let g = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  let b = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.7076147010 * s_3;

  const f = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  
  const red = Math.round(Math.max(0, Math.min(1, f(r))) * 255);
  const green = Math.round(Math.max(0, Math.min(1, f(g))) * 255);
  const blue = Math.round(Math.max(0, Math.min(1, f(b))) * 255);

  if (a === 1) {
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    return `rgba(${red}, ${green}, ${blue}, ${a})`;
  }
};

const convertOklchStringToRgb = (oklchStr: string): string => {
  if (typeof oklchStr !== 'string') return oklchStr;
  
  return oklchStr.replace(/oklch\(([^)]+)\)/gi, (match, contents) => {
    try {
      const parts = contents.trim().replace(/[,/]/g, ' ').replace(/\s+/g, ' ').split(' ');
      
      if (parts.length >= 3) {
        let l = parseFloat(parts[0]);
        if (parts[0].endsWith('%')) {
          l = parseFloat(parts[0]) / 100;
        }
        
        let c = parseFloat(parts[1]);
        if (parts[1].endsWith('%')) {
          c = parseFloat(parts[1]) / 100;
        }
        
        let h = parseFloat(parts[2]);
        if (parts[2].endsWith('deg')) {
          h = parseFloat(parts[2]);
        } else if (parts[2].endsWith('rad')) {
          h = parseFloat(parts[2]) * (180 / Math.PI);
        } else if (parts[2].endsWith('turn')) {
          h = parseFloat(parts[2]) * 360;
        }
        
        let a = 1;
        if (parts.length >= 4) {
          a = parseFloat(parts[3]);
          if (parts[3].endsWith('%')) {
            a = parseFloat(parts[3]) / 100;
          }
        }
        
        return oklchToRgb(l, c, h, a);
      }
    } catch (e) {
      console.error("Error parsing oklch", e);
    }
    return match;
  });
};

// Dynamically import jsPDF to avoid SSR issues
import dynamic from 'next/dynamic';
export default function Page() {
  return <BookDesignStudio />;
}

type BindStyle = 'Perfect' | 'Saddle' | 'Spiral';
type PaperSize = 'A4' | 'A5' | 'Trade' | 'Digest' | 'Custom';

interface BookConfig {
  size: PaperSize;
  customWidthMm: number;
  customHeightMm: number;
  paperColor: string;
  texture: string;
  bindStyle: BindStyle;
  innerMarginMm: number;
  outerMarginMm: number;
  topMarginMm: number;
  bottomMarginMm: number;
  fontFamily: string;
  fontSizePt: number;
  lineHeight: number;
  textColor: string;
}

interface PageData {
  id: string;
  type: 'cover' | 'title' | 'chapter' | 'text';
  content: string;
  title?: string;
  subtitle?: string;
  imageData?: string;
}

interface Book {
  id: string;
  title: string;
  config: BookConfig;
  pages: PageData[];
  updatedAt: number;
}

const PAGE_SIZES: Record<Exclude<PaperSize, 'Custom'>, {w: number, h: number}> = {
  'A4': { w: 210, h: 297 },
  'A5': { w: 148, h: 210 },
  'Trade': { w: 152.4, h: 228.6 }, // 6x9 inches
  'Digest': { w: 139.7, h: 215.9 }, // 5.5x8.5 inches
};

const DEFAULT_CONFIG: BookConfig = {
  size: 'Trade',
  customWidthMm: 152.4,
  customHeightMm: 228.6,
  paperColor: '#fffaed', // Cream
  texture: 'none',
  bindStyle: 'Perfect',
  innerMarginMm: 20,
  outerMarginMm: 15,
  topMarginMm: 20,
  bottomMarginMm: 20,
  fontFamily: 'var(--font-playfair), serif',
  fontSizePt: 11,
  lineHeight: 1.5,
  textColor: '#1a1a1a',
};

const INITIAL_PAGES: PageData[] = [
  { id: '1', type: 'cover', content: '', title: 'The Great Design', subtitle: 'A Comprehensive Guide' },
  { id: '2', type: 'title', content: '', title: 'The Great Design', subtitle: 'A Comprehensive Guide\n\n\nJane Doe' },
  { id: '3', type: 'chapter', content: 'In the beginning, there was empty space. And then, there was structure. This chapter explores the fundamental layout of modern book binding, tracing historical techniques through contemporary digital workflows.', title: '1. The Foundations' },
  { id: '4', type: 'text', content: 'Typography is the art of giving language a physical body. When we set words on a page, we change how they are perceived. The interplay of margins, leading, and tracking creates the rhythm of reading.\n\nNotice how the inner margin is slightly wider than the outer margin—this accommodates the curve of the perfect binding when the book is built.' },
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const RichTextEditor = ({ value, onChange, placeholder, className, style }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '\t');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: inherit;
          opacity: 0.4;
          cursor: text;
        }
      `}} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={`focus:outline-none focus:ring-1 focus:ring-indigo-500/50 whitespace-pre-wrap ${className}`}
        style={style}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
      />
    </>
  );
};

function BookDesignStudio() {
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [library, setLibrary] = useState<Book[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [showNewBookModal, setShowNewBookModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');

  const [config, setConfig] = useState<BookConfig>(DEFAULT_CONFIG);
  const [pages, setPages] = useState<PageData[]>(INITIAL_PAGES);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const bookRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');

  const getPageDimensions = () => {
    const w = config.size === 'Custom' ? config.customWidthMm : PAGE_SIZES[config.size as Exclude<PaperSize, 'Custom'>].w;
    const h = config.size === 'Custom' ? config.customHeightMm : PAGE_SIZES[config.size as Exclude<PaperSize, 'Custom'>].h;
    return { w, h };
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('my_books');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setLibrary(JSON.parse(saved));
  }, []);

  // Save current book
  useEffect(() => {
    if (currentBookId) {
       // eslint-disable-next-line react-hooks/set-state-in-effect
       setLibrary(prev => {
          const updated = prev.map(b => b.id === currentBookId ? { ...b, config, pages, updatedAt: Date.now() } : b);
          localStorage.setItem('my_books', JSON.stringify(updated));
          return updated;
       });
    }
  }, [config, pages, currentBookId]);

  const confirmCreateNewBook = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newBookTitle.trim() || 'Untitled Book';
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const newBook: Book = {
      id: now.toString(),
      title,
      config: DEFAULT_CONFIG,
      pages: INITIAL_PAGES,
      updatedAt: now
    };
    setLibrary(prev => {
      const up = [...prev, newBook];
      localStorage.setItem('my_books', JSON.stringify(up));
      return up;
    });
    setShowNewBookModal(false);
    setNewBookTitle('');
    openBook(newBook);
  };

  const openBook = (book: Book) => {
    setConfig(book.config);
    setPages(book.pages);
    setCurrentBookId(book.id);
    setCurrentPageIndex(0);
    setView('editor');
  };

  const startDeleteBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(id);
  };

  const confirmDeleteBook = () => {
    if (showDeleteConfirm) {
      setLibrary(prev => {
        const up = prev.filter(b => b.id !== showDeleteConfirm);
        localStorage.setItem('my_books', JSON.stringify(up));
        return up;
      });
      setShowDeleteConfirm(null);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setUser(user),
      () => setUser(null)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const computeScale = () => {
      if (zoomMode === 'actual') {
        setScale(1);
        return;
      }
      // Add a margin of 40px on sides for the preview
      if (containerRef.current) {
         const { w, h } = getPageDimensions();
         // simple mm to px roughly 3.78
         const pxW = w * 3.78;
         const pxH = h * 3.78;
         
         const containerW = containerRef.current.clientWidth - 40;
         const containerH = containerRef.current.clientHeight - 100; // Account for floating bottom bar

         if (pxW > containerW || pxH > containerH) {
           const scaleW = containerW / pxW;
           const scaleH = containerH / pxH;
           setScale(Math.min(scaleW, scaleH, 1));
         } else {
           setScale(1);
         }
      }
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [config.size, config.customWidthMm, config.customHeightMm, zoomMode]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) setUser(result.user);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = (updates: Partial<BookConfig>) => {
    setConfig({ ...config, ...updates });
  };

  const updateCurrentPage = (updates: Partial<PageData>) => {
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], ...updates };
    setPages(newPages);
  };
  
  const addPage = () => {
    setPages([
      ...pages, 
      { id: Date.now().toString(), type: 'text', content: 'New page content...' }
    ]);
    setCurrentPageIndex(pages.length);
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) return;
    const newPages = [...pages];
    newPages.splice(index, 1);
    setPages(newPages);
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateCurrentPage({ imageData: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const exportPDF = async (toDrive = false) => {
    if (toDrive) {
      if (!user) {
        alert("Please sign in to save to Google Drive");
        return;
      }
      // Removed windows.confirm because it is blocked in iframe sandbox
    }
    
    setIsExporting(true);
    const originalGetComputedStyle = window.getComputedStyle;
    
    try {
      // Intercept default computed styles and transform oklch to rgb format
      window.getComputedStyle = function (el, pseudoElt) {
        const style = originalGetComputedStyle(el, pseudoElt);
        return new Proxy(style, {
          get(target, prop, receiver) {
            const val = Reflect.get(target, prop, receiver);
            if (typeof val === 'string' && val.includes('oklch(')) {
              return convertOklchStringToRgb(val);
            }
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const originalVal = target.getPropertyValue(propertyName);
                if (typeof originalVal === 'string' && originalVal.includes('oklch(')) {
                  return convertOklchStringToRgb(originalVal);
                }
                return originalVal;
              };
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          }
        });
      };

      const { jsPDF } = await import('jspdf');
      
      const { w: widthMm, h: heightMm } = getPageDimensions();
      
      const pdf = new jsPDF({
        orientation: widthMm > heightMm ? 'l' : 'p',
        unit: 'mm',
        format: [widthMm, heightMm]
      });

      // Temporarily render all pages for export (normally virtualised, but for PDF we need all)
      const exportContainerElement = document.createElement('div');
      exportContainerElement.style.position = 'absolute';
      exportContainerElement.style.left = '-9999px';
      document.body.appendChild(exportContainerElement);
      
      // Render to PDF implementation would normally go page by page.
      // Here we will do a trick: we'll render each page into the DOM briefly, html2canvas it, then move to next
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        
        // We'll just take the current preview DOM node by temporarily switching page index
        // In a real robust app, we'd render the whole book invisibly. 
        // For this, we'll quickly render the specific page in the main preview container.
      }
      
      // Since html2canvas is async, let's use a simpler approach for the prototype:
      // We will loop, set the current page index, wait a tick, capture, and add to PDF.
      for (let i = 0; i < pages.length; i++) {
        setCurrentPageIndex(i);
        await new Promise(r => setTimeout(r, 100)); // wait for render
        
        if (bookRef.current) {
           const canvas = await html2canvas(bookRef.current, { scale: 2 });
           const imgData = canvas.toDataURL('image/jpeg', 1.0);
           pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
        }
        if (i < pages.length - 1) pdf.addPage();
      }

      // Restore
      setCurrentPageIndex(0);
      
      if (toDrive) {
         const token = await getAccessToken();
         if (!token) throw new Error("No access token available.");
         
         const pdfBlob = pdf.output('blob');
         const metadata = {
            name: `Book_Export_${new Date().getTime()}.pdf`,
            mimeType: 'application/pdf'
         };
         
         const form = new FormData();
         form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
         form.append('file', pdfBlob);
         
         const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
           method: 'POST',
           headers: {
             Authorization: `Bearer ${token}`
           },
           body: form
         });
         
         if (res.ok) {
           alert("Successfully uploaded to Google Drive!");
         } else {
           const errData = await res.json();
           throw new Error(errData.error?.message || 'Upload failed');
         }
      } else {
         pdf.save('Book_Export.pdf');
      }
      
    } catch (err: any) {
      console.error(err);
      alert("Export failed: " + err.message);
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
      setIsExporting(false);
    }
  };

  const handleSizeChange = (s: PaperSize) => {
    if (s === 'Custom') {
       updateConfig({ size: s });
    } else {
       updateConfig({ size: s, customWidthMm: PAGE_SIZES[s as Exclude<PaperSize, 'Custom'>].w, customHeightMm: PAGE_SIZES[s as Exclude<PaperSize, 'Custom'>].h });
    }
  };

  const isRightPage = currentPageIndex % 2 !== 0; // page 0 is left. 1 is right. Wait, cover is usually right. Let\'s say cover (0) is Right (recto). So even is Right, odd is Left (verso).
  const isRecto = currentPageIndex % 2 === 0;
  const dim = getPageDimensions();

  if (view === 'library') {
    return (
      <div className="min-h-screen bg-neutral-100 p-4 sm:p-8 md:p-16">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 pb-6 border-b border-gray-200">
             <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-serif flex items-center gap-2.5 sm:gap-3">
                  <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 shrink-0" />
                  Book Design Studio
                </h1>
                <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg">Your personal library of beautifully crafted books.</p>
             </div>
             <button 
                onClick={() => setShowNewBookModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg shadow-md font-medium transition flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
             >
                <Plus className="w-5 h-5"/> Create Book
             </button>
          </header>

          <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {library.map(book => (
               <div 
                 key={book.id} 
                 onClick={() => openBook(book)}
                 className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col overflow-hidden border border-gray-200"
               >
                 <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {book.pages[0]?.imageData ? (
                       <img src={book.pages[0].imageData} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                       <BookOpen className="w-16 h-16 text-gray-300" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                 </div>
                 <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold font-serif mb-1 truncate">{book.title}</h3>
                    <p className="text-xs text-gray-500 mb-4">{new Date(book.updatedAt).toLocaleDateString()}</p>
                    
                    <div className="mt-auto flex justify-between items-center">
                       <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">Open Studio &rarr;</span>
                       <button onClick={(e) => startDeleteBook(book.id, e)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors relative z-10">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
               </div>
            ))}
            {library.length === 0 && (
               <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-dashed border-gray-300">
                  <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No books yet</h3>
                  <p className="text-gray-500 max-w-md pb-6">Create your first book design to get started building your customized library.</p>
                  <button onClick={() => setShowNewBookModal(true)} className="text-indigo-600 font-medium hover:underline">Get Started</button>
               </div>
            )}
          </main>
          
          {showNewBookModal && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={confirmCreateNewBook} className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                   <h3 className="text-lg font-bold text-gray-900 mb-2">Create New Book</h3>
                   <input 
                     type="text" 
                     value={newBookTitle}
                     onChange={e => setNewBookTitle(e.target.value)}
                     placeholder="Enter book title"
                     autoFocus
                     className="w-full border border-neutral-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 mb-6 outline-none"
                   />
                   <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowNewBookModal(false)} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm">Create</button>
                   </div>
                </form>
             </div>
          )}

          {showDeleteConfirm && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                   <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Book</h3>
                   <p className="text-gray-500 mb-6">Are you sure you want to delete this book? This action cannot be undone.</p>
                   <div className="flex justify-end gap-3">
                      <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg">Cancel</button>
                      <button onClick={confirmDeleteBook} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm">Delete</button>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-neutral-100 overflow-hidden text-sm">
      {/* MOBILE-ONLY TOP BAR ACTIONS */}
      <div className="md:hidden fixed top-4 left-4 z-30 flex items-center gap-2">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2.5 bg-white rounded-full shadow-md border border-neutral-200 text-neutral-600 hover:text-indigo-600 transition-colors active:scale-95 cursor-pointer"
          title="Open Settings Menu"
        >
          <Menu className="w-5 h-5 animate-none" />
        </button>
        <button 
          onClick={() => setView('library')}
          className="py-2.5 px-3.5 bg-white rounded-full shadow-md border border-neutral-200 text-neutral-600 hover:text-indigo-600 transition-colors font-medium text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          title="Back to Library"
        >
          <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Library</span>
        </button>
      </div>

      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div className={`fixed md:relative w-80 bg-white border-r border-neutral-200 flex flex-col h-screen overflow-y-auto shrink-0 shadow-xl md:shadow-sm z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-neutral-200 sticky top-0 bg-white/90 backdrop-blur z-20 flex justify-between items-start">
          <div>
            <button onClick={() => setView('library')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mb-2">
               &larr; Back to Library
            </button>
            <h1 className="font-semibold text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Book Design Studio
            </h1>
            <p className="text-xs text-neutral-500 mt-1">Configure layout, formatting & export</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-neutral-500 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* PAGES PANEL */}
          <section>
            <h2 className="font-semibold text-xs uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1"><Grid className="w-4 h-4"/> Pages</h2>
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {pages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentPageIndex(idx);
                    setIsSidebarOpen(false);
                  }}
                  className={`relative shrink-0 w-12 h-16 rounded border ${currentPageIndex === idx ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-neutral-300'} bg-white flex items-center justify-center text-xs overflow-hidden group`}
                >
                  {p.type === 'cover' ? 'CVR' : idx}
                  {pages.length > 1 && (
                    <div 
                      onClick={(e) => { e.stopPropagation(); removePage(idx); }}
                      className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl"
                    >
                      <Trash2 className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
              <button 
                onClick={addPage}
                className="shrink-0 w-12 h-16 rounded border border-dashed border-neutral-400 text-neutral-500 flex items-center justify-center hover:bg-neutral-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </section>

          {/* PAGE SETTINGS */}
          <section>
             <h2 className="font-semibold text-xs uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1"><Layout className="w-4 h-4"/> Format & Margins</h2>
             <div className="space-y-3">
               <div>
                  <label className="text-xs text-neutral-600 font-medium">Book Size</label>
                  <select 
                    value={config.size} 
                    onChange={(e) => handleSizeChange(e.target.value as PaperSize)}
                    className="w-full mt-1 border border-neutral-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Trade">Trade (6 x 9&quot;)</option>
                    <option value="Digest">Digest (5.5 x 8.5&quot;)</option>
                    <option value="A4">A4 (210 x 297mm)</option>
                    <option value="A5">A5 (148 x 210mm)</option>
                    <option value="Custom">Custom Size</option>
                  </select>
               </div>
               
               {config.size === 'Custom' && (
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                      <label className="text-xs text-neutral-600 font-medium">Width (mm)</label>
                      <input type="number" value={config.customWidthMm} onChange={e => updateConfig({ customWidthMm: Number(e.target.value) })} className="w-full mt-1 border border-neutral-300 rounded p-1.5" />
                   </div>
                   <div>
                      <label className="text-xs text-neutral-600 font-medium">Height (mm)</label>
                      <input type="number" value={config.customHeightMm} onChange={e => updateConfig({ customHeightMm: Number(e.target.value) })} className="w-full mt-1 border border-neutral-300 rounded p-1.5" />
                   </div>
                 </div>
               )}
               
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-xs text-neutral-600 font-medium">Bind Style</label>
                    <select 
                      value={config.bindStyle} 
                      onChange={(e) => updateConfig({ bindStyle: e.target.value as BindStyle })}
                      className="w-full mt-1 border border-neutral-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Perfect">Perfect</option>
                      <option value="Saddle">Saddle Stitch</option>
                      <option value="Spiral">Spiral</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-neutral-600 font-medium">Paper Color</label>
                    <input 
                      type="color" 
                      value={config.paperColor} 
                      onChange={(e) => updateConfig({ paperColor: e.target.value })}
                      className="w-full mt-1 h-8 rounded border border-neutral-300 cursor-pointer"
                    />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3">
                 <div>
                    <label className="text-xs text-neutral-600 font-medium">Inner Margin (mm)</label>
                    <input type="number" value={config.innerMarginMm} onChange={e => updateConfig({ innerMarginMm: Number(e.target.value) })} className="w-full mt-1 border border-neutral-300 rounded p-1.5" />
                 </div>
                 <div>
                    <label className="text-xs text-neutral-600 font-medium">Outer Margin (mm)</label>
                    <input type="number" value={config.outerMarginMm} onChange={e => updateConfig({ outerMarginMm: Number(e.target.value) })} className="w-full mt-1 border border-neutral-300 rounded p-1.5" />
                 </div>
                 <div>
                    <label className="text-xs text-neutral-600 font-medium">Top Margin (mm)</label>
                    <input type="number" value={config.topMarginMm} onChange={e => updateConfig({ topMarginMm: Number(e.target.value) })} className="w-full mt-1 border border-neutral-300 rounded p-1.5" />
                 </div>
                 <div>
                    <label className="text-xs text-neutral-600 font-medium">Bot Margin (mm)</label>
                    <input type="number" value={config.bottomMarginMm} onChange={e => updateConfig({ bottomMarginMm: Number(e.target.value) })} className="w-full mt-1 border border-neutral-300 rounded p-1.5" />
                 </div>
               </div>
             </div>
          </section>

          {/* TYPOGRAPHY */}
          <section>
             <h2 className="font-semibold text-xs uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1"><Type className="w-4 h-4"/> Typography</h2>
             <div className="space-y-3">
               <div>
                  <label className="text-xs text-neutral-600 font-medium">Font Family</label>
                  <select 
                    value={config.fontFamily} 
                    onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                    className="w-full mt-1 border border-neutral-300 rounded p-1.5"
                  >
                    <option value="var(--font-playfair), serif">Playfair Display (Serif)</option>
                    <option value="var(--font-lora), serif">Lora (Serif)</option>
                    <option value="var(--font-merriweather), serif">Merriweather (Serif)</option>
                    <option value="var(--font-sans), sans-serif">Inter (Sans)</option>
                    <option value="var(--font-space), sans-serif">Space Grotesk (Sans)</option>
                    <option value="var(--font-mono), monospace">JetBrains Mono</option>
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-xs text-neutral-600 font-medium">Font Size (pt)</label>
                    <input type="number" value={config.fontSizePt} onChange={e => updateConfig({ fontSizePt: Number(e.target.value) })} className="w-full mt-1 border border-neutral-300 rounded p-1.5" />
                 </div>
                 <div>
                    <label className="text-xs text-neutral-600 font-medium">Line Height</label>
                    <input type="number" step="0.1" value={config.lineHeight} onChange={e => updateConfig({ lineHeight: Number(e.target.value) })} className="w-full mt-1 border border-neutral-300 rounded p-1.5" />
                 </div>
               </div>
               <div>
                  <label className="text-xs text-neutral-600 font-medium">Text Color</label>
                  <input 
                    type="color" 
                    value={config.textColor} 
                    onChange={(e) => updateConfig({ textColor: e.target.value })}
                    className="w-full mt-1 h-8 rounded border border-neutral-300 cursor-pointer"
                  />
               </div>
             </div>
          </section>
        </div>
        
        {/* FOOTER ACTIONS */}
        <div className="mt-auto border-t border-neutral-200 p-4 bg-neutral-50 flex flex-col gap-2">
          {user ? (
             <div className="text-xs text-green-700 flex justify-between items-center bg-green-50 p-2 rounded border border-green-200">
               Connected to Drive
               <button onClick={logout} className="text-neutral-500 hover:text-black" title="Sign out"><LogOut className="w-4 h-4" /></button>
             </div>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-2 bg-white border border-neutral-300 rounded flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors shadow-sm"
            >
               <Cloud className="w-4 h-4 text-blue-500" />
               {isLoading ? 'Connecting...' : 'Connect Google Drive'}
            </button>
          )}

          <div className="flex gap-2">
            <button 
              onClick={() => exportPDF(false)}
              disabled={isExporting}
              className="flex-1 py-2 bg-white border border-neutral-300 rounded flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors shadow-sm"
            >
               <FileDown className="w-4 h-4" />
               Download
            </button>
            <button 
              onClick={() => exportPDF(true)}
              disabled={isExporting || !user}
              className="flex-1 py-2 bg-indigo-600 text-white rounded flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <Cloud className="w-4 h-4" />
               Save to Drive
            </button>
          </div>
          {isExporting && <div className="text-xs text-center text-indigo-600 animate-pulse mt-1">Generating high-quality PDF...</div>}
        </div>
      </div>

      {/* MAIN PREVIEW AREA */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto relative bg-neutral-200 flex flex-col items-center pt-24 pb-28 px-4 w-full md:w-auto"
      >
        {/* TOP Actions Toolbar - Perfectly positioned on all devices */}
        <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
          {/* Zoom Toggle */}
          <button 
            onClick={() => setZoomMode(prev => prev === 'fit' ? 'actual' : 'fit')}
            className="h-10 px-3 bg-white hover:bg-neutral-50 rounded-full shadow-md border border-neutral-200 text-neutral-600 hover:text-indigo-600 transition-all font-semibold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Toggle zoom level"
          >
            {zoomMode === 'fit' ? <Maximize2 className="w-4 h-4 text-indigo-500" /> : <Minimize2 className="w-4 h-4 text-indigo-500" />}
            <span>{zoomMode === 'fit' ? '100%' : 'Fit'}</span>
          </button>

          {/* Download PDF Shortcut */}
          <button 
            onClick={() => exportPDF(false)}
            disabled={isExporting}
            className="h-10 px-3 bg-white hover:bg-neutral-50 rounded-full shadow-md border border-neutral-200 text-neutral-600 hover:text-indigo-600 transition-all font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
            title="Download PDF"
          >
            <FileDown className="w-4 h-4 text-emerald-500" />
            <span className="hidden xs:inline">PDF</span>
          </button>

          {/* Connect / Save Google Drive */}
          <button 
            onClick={() => {
              if (!user) {
                handleLogin();
              } else {
                exportPDF(true);
              }
            }}
            disabled={isExporting || isLoading}
            className={`h-10 px-3.5 rounded-full shadow-md transition-all font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95 ${user ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' : 'bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 hover:text-indigo-600'}`}
            title={user ? "Linked to Google Drive" : "Connect & Save to Google Drive"}
          >
            <Cloud className={`w-4 h-4 ${!user ? 'text-blue-500' : 'text-white'}`} />
            <span className="hidden xs:inline">{user ? 'Drive' : 'Connect'}</span>
          </button>
        </div>

        {/* Page Editor Control Floating Bar */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-full px-3.5 py-2 flex items-center gap-2.5 z-25 border border-neutral-200 max-w-[95%] overflow-x-auto whitespace-nowrap scrollbar-none">
          {/* Easy Mobile Navigation: Prev Page */}
          <button
            onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
            disabled={currentPageIndex === 0}
            className="p-1.5 text-neutral-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors rounded-full hover:bg-neutral-100 cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-semibold text-neutral-700 select-none px-0.5">
            Page {currentPageIndex + 1} / {pages.length}
          </span>

          {/* Easy Mobile Navigation: Next Page */}
          <button
            onClick={() => setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
            disabled={currentPageIndex === pages.length - 1}
            className="p-1.5 text-neutral-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors rounded-full hover:bg-neutral-100 cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="h-4 w-px bg-neutral-200 shrink-0" />

          {/* Formatting Control Buttons - vital for phone users! */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => document.execCommand('bold', false)}
              className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-100 rounded transition-colors cursor-pointer active:scale-95"
              title="Bold Selected Text"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.execCommand('italic', false)}
              className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-100 rounded transition-colors cursor-pointer active:scale-95"
              title="Italic Selected Text"
            >
              <Italic className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-200 shrink-0" />

          {/* Page Type selector */}
          <select 
            value={pages[currentPageIndex].type}
            onChange={(e) => updateCurrentPage({ type: e.target.value as any })}
            className="text-xs border-none outline-none focus:ring-0 focus:outline-none bg-transparent py-1 font-semibold text-indigo-600 cursor-pointer shrink-0"
          >
            <option value="cover">Cover Page</option>
            <option value="title">Title Page</option>
            <option value="chapter">Chapter Start</option>
            <option value="text">Standard Text</option>
          </select>

          {pages[currentPageIndex].type === 'cover' && (
            <>
              <div className="h-4 w-px bg-neutral-200 shrink-0" />
              <label className="text-xs flex items-center gap-1 cursor-pointer hover:text-indigo-600 text-neutral-600 transition-colors font-medium shrink-0">
                <Upload className="w-4 h-4 text-indigo-500" /> <span>Upload Art</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
            </>
          )}
        </div>

        {/* Scaled Preview Wrapper (Constrains container space to match visual content size perfectly on mobile) */}
        <div 
          className="flex justify-center items-start my-auto shadow-2xl rounded-sm overflow-hidden bg-white shrink-0"
          style={{ 
            width: `calc(${dim.w}mm * ${scale})`, 
            height: `calc(${dim.h}mm * ${scale})`,
            transition: 'width 0.2s, height 0.2s, transform 0.2s'
          }}
        >
          <div style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left', 
            width: `${dim.w}mm`,
            height: `${dim.h}mm`,
            transition: 'transform 0.2s ease-in-out' 
          }}>
          {/* THE ACTUAL PAGE DOM (Exported to PDF) */}
          <div 
            ref={bookRef}
            className="w-full h-full relative bg-white overflow-hidden"
            style={{
              backgroundColor: config.paperColor,
              paddingLeft: `${isRecto ? config.innerMarginMm : config.outerMarginMm}mm`,
              paddingRight: `${isRecto ? config.outerMarginMm : config.innerMarginMm}mm`,
              paddingTop: `${config.topMarginMm}mm`,
              paddingBottom: `${config.bottomMarginMm}mm`,
              fontFamily: config.fontFamily,
              fontSize: `${config.fontSizePt}pt`,
              lineHeight: config.lineHeight,
              color: config.textColor,
            }}
          >
            {/* Visual binding edge indicator (not exported but helpful for preview) */}
            <div className="absolute inset-y-0 w-px mix-blend-multiply flex pointer-events-none" style={{ [isRecto ? 'left' : 'right']: 0, width: `${config.innerMarginMm * 0.7}mm`, borderLeft: isRecto ? '1px solid rgba(0,0,0,0.05)' : 'none', borderRight: !isRecto ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              {config.bindStyle === 'Perfect' && (
                <div className="w-full h-full bg-gradient-to-r from-black/10 to-transparent opacity-50" style={{ transform: isRecto ? 'none' : 'scaleX(-1)' }} />
              )}
              {config.bindStyle === 'Saddle' && (
                <div className="w-full h-full relative" style={{ transform: isRecto ? 'none' : 'scaleX(-1)' }}>
                   <div className="absolute left-0 inset-y-0 w-px bg-black bg-opacity-20 flex flex-col justify-evenly">
                      {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-4 bg-gray-500 rounded-sm -ml-[0.5px]" />)}
                   </div>
                   <div className="w-full h-full bg-gradient-to-r from-black/5 to-transparent opacity-30" />
                </div>
              )}
              {config.bindStyle === 'Spiral' && (
                <div className="w-full h-full relative flex flex-col justify-between py-6" style={{ transform: isRecto ? 'none' : 'scaleX(-1)' }}>
                   {[...Array(16)].map((_, i) => (
                      <div key={i} className="w-6 h-3 border-2 border-slate-400 rounded-full border-l-0 -ml-2" />
                   ))}
                </div>
              )}
            </div>

            {/* PAGE CONTENT RENDERING */}
            <div className="w-full h-full relative outline-none z-10">
              
              {pages[currentPageIndex].type === 'cover' && (
                <div className="absolute inset-0 z-0">
                  {pages[currentPageIndex].imageData ? (
                     <img src={pages[currentPageIndex].imageData} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full border-4 border-dashed border-black/10 flex items-center justify-center text-black/30 font-bold tracking-widest uppercase">Select Cover Art</div>
                  )}
                  {/* Overlay text if any */}
                  <div className="absolute inset-x-8 bottom-16 text-center bg-white/80 p-8 backdrop-blur" style={{ color: config.textColor, fontFamily: config.fontFamily }}>
                    <RichTextEditor 
                      className="w-full text-center bg-transparent border-none outline-none overflow-hidden" 
                      style={{ fontSize: '2.5em', fontWeight: 'bold', fontFamily: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
                      value={pages[currentPageIndex].title || ''} 
                      onChange={content => updateCurrentPage({ title: content })}
                      placeholder="Book Title"
                    />
                    <RichTextEditor 
                      className="w-full text-center bg-transparent border-none outline-none mt-4 overflow-hidden" 
                      style={{ fontSize: '1.2em', fontFamily: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
                      value={pages[currentPageIndex].subtitle || ''} 
                      onChange={content => updateCurrentPage({ subtitle: content })}
                      placeholder="Subtitle or Author"
                    />
                  </div>
                </div>
              )}

              {pages[currentPageIndex].type === 'title' && (
                <div className="w-full h-full flex flex-col justify-center items-center text-center">
                    <RichTextEditor 
                      className="w-full text-center bg-transparent border-none outline-none overflow-hidden" 
                      style={{ fontSize: '3em', fontWeight: 'bold', marginBottom: '1em', fontFamily: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
                      value={pages[currentPageIndex].title || ''} 
                      onChange={content => updateCurrentPage({ title: content })}
                      placeholder="Book Title"
                    />
                    <RichTextEditor 
                      className="w-full h-32 text-center bg-transparent border-none outline-none" 
                      style={{ fontSize: '1.2em', fontFamily: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
                      value={pages[currentPageIndex].subtitle || ''} 
                      onChange={content => updateCurrentPage({ subtitle: content })}
                      placeholder="Subtitle \n\n Author Name"
                    />
                </div>
              )}

              {pages[currentPageIndex].type === 'chapter' && (
                <div className="w-full h-full pt-20 flex flex-col">
                    <input 
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500/50 outline-none flex-shrink-0" 
                      style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '2em', fontFamily: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
                      value={pages[currentPageIndex].title} 
                      onChange={e => updateCurrentPage({ title: e.target.value })}
                      placeholder="Chapter Title"
                    />
                    <RichTextEditor 
                      className="w-full h-full bg-transparent border-none outline-none pb-20 text-justify" 
                      style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
                      value={pages[currentPageIndex].content || ''} 
                      onChange={content => updateCurrentPage({ content })}
                      placeholder="Start writing..."
                    />
                </div>
              )}

              {pages[currentPageIndex].type === 'text' && (
                <div className="w-full h-full text-justify text-justify-inter-word pt-6">
                    <RichTextEditor 
                      className="w-full h-full bg-transparent border-none outline-none pb-20 text-justify" 
                      style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
                      value={pages[currentPageIndex].content || ''} 
                      onChange={content => updateCurrentPage({ content })}
                      placeholder="Continue writing..."
                    />
                </div>
              )}

              {/* Page Number (if not cover/title) */}
              {['text', 'chapter'].includes(pages[currentPageIndex].type) && (
                 <div className="absolute bottom-[-10mm] inset-x-0 tracking-widest text-[0.8em] opacity-60 pointer-events-none" style={{ textAlign: isRecto ? 'right' : 'left' }}>
                    {currentPageIndex}
                 </div>
              )}

            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
