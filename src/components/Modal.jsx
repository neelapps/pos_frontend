import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const isElectron = typeof window !== 'undefined' && window.navigator && window.navigator.userAgent.toLowerCase().includes('electron');

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [externalWindow, setExternalWindow] = useState(null);
  
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !isElectron) {
      if (externalWindow) {
        externalWindow.close();
        setExternalWindow(null);
      }
      return;
    }

    // Configure window sizes
    const width = size === 'sm' ? 500 : size === 'md' ? 650 : size === 'lg' ? 850 : 1100;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const winName = `modal-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
    const winFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;

    const win = window.open('', winName, winFeatures);
    if (!win) {
      console.error('Failed to open native modal window');
      return;
    }

    win.document.title = title;

    // Ensure the title is set and preserved after the asynchronous load
    const updateTitle = () => {
      if (win && !win.closed) {
        win.document.title = title;
        let titleTag = win.document.head.querySelector('title');
        if (!titleTag) {
          titleTag = win.document.createElement('title');
          win.document.head.appendChild(titleTag);
        }
        titleTag.innerText = title;
      }
    };
    win.addEventListener('load', updateTitle);
    const titleTimer1 = setTimeout(updateTitle, 100);
    const titleTimer2 = setTimeout(updateTitle, 500);

    // Apply dark mode if parent has it
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      win.document.documentElement.classList.add('dark');
    }
    
    // Add margin, basic styling, and structure to child window
    win.document.body.className = 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 m-0 h-screen overflow-hidden';

    // Inject base href tag to resolve relative paths for styles and assets
    const base = win.document.createElement('base');
    base.href = window.location.origin + '/';
    win.document.head.appendChild(base);

    // Copy stylesheet styles from parent to child
    const copyStyles = () => {
      // Clear head first
      const existingBase = win.document.head.querySelector('base');
      win.document.head.innerHTML = '';
      if (existingBase) {
        win.document.head.appendChild(existingBase);
      }

      // Copy styles
      Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((styleNode) => {
        win.document.head.appendChild(styleNode.cloneNode(true));
      });

      // Copy dynamic vite styles
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.cssRules) {
            const style = win.document.createElement('style');
            Array.from(sheet.cssRules).forEach((rule) => {
              style.appendChild(win.document.createTextNode(rule.cssText));
            });
            win.document.head.appendChild(style);
          }
        } catch (e) {
          // Ignore external stylesheet errors
        }
      });
    };

    copyStyles();

    // Listen for new style nodes (e.g. during dev HMR)
    const observer = new MutationObserver(() => {
      copyStyles();
    });
    observer.observe(document.head, { childList: true, subtree: true });

    // Handle closing the window via OS controls (the title bar 'X')
    const handleBeforeUnload = () => {
      onCloseRef.current();
    };
    win.addEventListener('beforeunload', handleBeforeUnload);

    setExternalWindow(win);

    return () => {
      observer.disconnect();
      clearTimeout(titleTimer1);
      clearTimeout(titleTimer2);
      win.removeEventListener('beforeunload', handleBeforeUnload);
      win.removeEventListener('load', updateTitle);
      if (!win.closed) {
        win.close();
      }
    };
  }, [isOpen, size, title]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  const modalContent = (
    <div className={isElectron ? 'h-full flex flex-col' : `relative z-10 w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all transform ${sizeClasses[size]}`}>
      {/* Header section */}
      <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          {title}
        </h3>
        {!isElectron && (
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-500 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Modal body */}
      <div className={isElectron ? 'flex-1 overflow-y-auto pr-1 scrollbar-thin' : 'max-h-[calc(100vh-12rem)] overflow-y-auto pr-1 scrollbar-thin'}>
        {children}
      </div>
    </div>
  );

  // If inside Electron, render to the portal of the child window
  if (isElectron) {
    if (!externalWindow) return null; // Wait for window creation
    return createPortal(modalContent, externalWindow.document.body);
  }

  // Otherwise, render inline web modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />
      {modalContent}
    </div>
  );
};

export default Modal;
