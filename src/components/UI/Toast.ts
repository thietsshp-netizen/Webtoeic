export const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (typeof document === 'undefined') return;
  
  const el = document.createElement('div');
  
  let bgClass = 'bg-slate-800';
  let icon = 'ℹ️';
  
  if (type === 'success') {
    bgClass = 'bg-emerald-600';
    icon = '✅';
  } else if (type === 'error') {
    bgClass = 'bg-red-600';
    icon = '❌';
  }

  el.className = `fixed top-6 right-6 z-[999999] px-6 py-4 rounded-2xl shadow-2xl font-bold text-[14px] text-white flex items-center gap-3 transition-all duration-300 transform translate-x-0 opacity-100 ${bgClass}`;
  
  // Initial state for animation
  el.style.transform = 'translateX(100%)';
  el.style.opacity = '0';
  
  el.innerHTML = `
    <span class="text-lg">${icon}</span>
    <span>${msg}</span>
  `;
  
  document.body.appendChild(el);
  
  // Trigger animation
  requestAnimationFrame(() => {
    el.style.transform = 'translateX(0)';
    el.style.opacity = '1';
  });

  setTimeout(() => {
    el.style.transform = 'translateX(100%)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
};
