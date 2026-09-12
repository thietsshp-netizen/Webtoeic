type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  duration?: number;
  icon?: string;
}

export const showToast = (msg: string, type: ToastType = 'success', options?: ToastOptions) => {
  if (typeof document === 'undefined') return;

  const duration = options?.duration || 3000;

  // Tìm hoặc khởi tạo Toast Container cố định với z-index cao nhất
  let container = document.getElementById('global-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'global-toast-container';
    container.className = 'fixed top-3 right-3 sm:top-4 sm:right-4 z-[2147483647] flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-1.5rem)] sm:max-w-md';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');

  let bgClass = 'bg-slate-900/95 border-slate-700/50 text-white shadow-slate-950/20';
  let iconSvg = `<svg class="w-4 h-4 text-sky-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

  if (type === 'success') {
    bgClass = 'bg-emerald-600/95 border-emerald-400/30 text-white shadow-emerald-950/20';
    iconSvg = `<svg class="w-4 h-4 text-emerald-200 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else if (type === 'error') {
    bgClass = 'bg-rose-600/95 border-rose-400/30 text-white shadow-rose-950/20';
    iconSvg = `<svg class="w-4 h-4 text-rose-200 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  }

  const iconDisplay = options?.icon ? `<span class="text-sm leading-none">${options.icon}</span>` : iconSvg;

  // Kiểu dáng nhỏ gọn (compact), bóng mờ cao cấp, nổi lên trên cùng
  el.className = `pointer-events-auto px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl backdrop-blur-md border text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all duration-300 transform translate-x-8 opacity-0 max-w-full break-words select-none ${bgClass}`;

  el.innerHTML = `
    ${iconDisplay}
    <span class="leading-tight">${msg}</span>
  `;

  container.appendChild(el);

  // Trigger animation vào
  requestAnimationFrame(() => {
    el.classList.remove('translate-x-8', 'opacity-0');
    el.classList.add('translate-x-0', 'opacity-100');
  });

  // Tự động ẩn và dọn dẹp sau duration
  setTimeout(() => {
    el.classList.remove('translate-x-0', 'opacity-100');
    el.classList.add('translate-x-8', 'opacity-0');
    setTimeout(() => {
      el.remove();
      if (container && container.childNodes.length === 0) {
        container.remove();
      }
    }, 300);
  }, duration);
};

export const toast = {
  success: (msg: string, options?: ToastOptions) => showToast(msg, 'success', options),
  error: (msg: string, options?: ToastOptions) => showToast(msg, 'error', options),
  info: (msg: string, options?: ToastOptions) => showToast(msg, 'info', options),
};
