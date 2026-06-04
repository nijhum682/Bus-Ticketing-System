document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const nameDisplay = document.getElementById('nameDisplay');
  const emailDisplay = document.getElementById('emailDisplay');
  const phoneDisplay = document.getElementById('phoneDisplay');
  const dateDisplay = document.getElementById('dateDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Search Controls
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  const swapBtn = document.getElementById('swapBtn');
  const journeyDateInput = document.getElementById('journeyDateInput');
  const searchBtn = document.getElementById('searchBtn');

  // --- Session Verification ---
  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');
  if (!userEmail) {
    window.location.href = 'signin.html';
    return;
  }
  if (userRole === 'Admin') {
    window.location.href = 'admin_dashboard.html';
    return;
  }

  // --- API Setup & Fetch Profile ---
  const apiBase = (window.location.host === 'localhost:5080' || window.location.host === '127.0.0.1:5080') 
    ? '' 
    : 'http://localhost:5080';

  fetch(`${apiBase}/api/auth/profile?email=${encodeURIComponent(userEmail)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Could not fetch user profile details from database.');
      }
      return response.json();
    })
    .then(user => {
      // Display user data
      if (nameDisplay) nameDisplay.textContent = user.name;
      if (emailDisplay) emailDisplay.textContent = user.email;
      if (phoneDisplay) phoneDisplay.textContent = user.phone || 'N/A';
      
      // Format CreatedAt date nicely
      if (dateDisplay && user.createdAt) {
        const date = new Date(user.createdAt);
        dateDisplay.textContent = date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    })
    .catch(error => {
      showToast(`❌ Error: ${error.message}`, 'danger');
      if (nameDisplay) nameDisplay.textContent = 'Error loading profile';
      if (emailDisplay) emailDisplay.textContent = 'Error loading profile';
      if (phoneDisplay) phoneDisplay.textContent = 'Error loading profile';
      if (dateDisplay) dateDisplay.textContent = 'Error loading profile';
    });

  // --- Fetch Notices from Database ---
  const noticesContainer = document.getElementById('noticesContainer');
  if (noticesContainer) {
    fetch(`${apiBase}/api/notice`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Could not fetch notice data from database.');
        }
        return response.json();
      })
      .then(notices => {
        noticesContainer.innerHTML = '';
        if (notices.length === 0) {
          noticesContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No notices available.</div>';
          return;
        }

        notices.forEach(notice => {
          const div = document.createElement('div');
          
          const titleSpan = `<strong style="color: var(--text-primary);">${notice.noticeNumber}. ${notice.title}:</strong> `;
          let contentHtml = notice.content;
          
          // Let's highlight some parts for premium look (just like the original HTML):
          if (notice.title.toLowerCase().includes('refund policy')) {
            contentHtml = contentHtml.replace('non-cancellable, non-transferable, and non-refundable', '<strong style="color: var(--danger);">non-cancellable, non-transferable, and non-refundable</strong>');
          } else if (notice.title.toLowerCase().includes('eid period')) {
            contentHtml = contentHtml.replace('14 May 2026 to 13 June 2026', '<span style="background: rgba(6, 182, 212, 0.15); color: var(--accent-secondary); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 600;">14 May 2026 to 13 June 2026</span>');
          } else if (notice.title.toLowerCase().includes('reporting time')) {
            contentHtml = contentHtml.replace('30 minutes', '<span style="color: var(--success); text-decoration: underline; font-weight: 700;">30 minutes</span>');
          }

          div.innerHTML = `${titleSpan}${contentHtml}`;
          noticesContainer.appendChild(div);
        });
      })
      .catch(error => {
        console.error('Error fetching notices:', error);
        noticesContainer.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 1rem 0;">❌ Failed to load notices.</div>`;
      });
  }

  // --- Logout Event Handler ---
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      showToast('🔒 Logged out successfully!', 'info');
      setTimeout(() => {
        window.location.href = 'signin.html';
      }, 1500);
    });
  }

  // --- Route Search Interactivity ---

  // 0. Initialize Flatpickr datepicker with dd/mm/yy format
  if (journeyDateInput && typeof flatpickr !== 'undefined') {
    flatpickr(journeyDateInput, {
      dateFormat: "d/m/y", // dd/mm/yy format (2-digit year)
      allowInput: true,
      placeholder: "dd/mm/yy",
      disableMobile: true
    });
  }

  // 1. Swap destinations
  if (swapBtn && fromInput && toInput) {
    swapBtn.addEventListener('click', () => {
      const temp = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = temp;
      showToast('🔄 Destinations swapped', 'info');
    });
  }

  // 2. Handle Search Button Submit
  if (searchBtn && fromInput && toInput && journeyDateInput) {
    searchBtn.addEventListener('click', () => {
      const fromVal = fromInput.value;
      const toVal = toInput.value;
      const dateVal = journeyDateInput.value.trim();

      if (!fromVal || !toVal) {
        showToast('⚠️ Please select both From and To locations!', 'warning');
        return;
      }

      if (fromVal === toVal) {
        showToast('⚠️ From and To destinations cannot be the same!', 'warning');
        return;
      }

      if (!dateVal) {
        showToast('⚠️ Please enter a journey date!', 'warning');
        return;
      }

      showToast(`🔍 Searching buses from ${fromVal} to ${toVal} on ${dateVal}...`, 'success');
    });
  }

  // --- Toast Notification Display Helper ---
  let toastTimeout;
  function showToast(message, type = 'success') {
    if (!toast || !toastMessage) return;

    clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    
    const toastIcon = toast.querySelector('.toast-icon');
    if (type === 'success') {
      toast.style.borderLeftColor = 'var(--success)';
      if (toastIcon) {
        toastIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--success)" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      }
    } else if (type === 'info') {
      toast.style.borderLeftColor = 'var(--accent-secondary)';
      if (toastIcon) {
        toastIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-secondary)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      }
    } else if (type === 'warning') {
      toast.style.borderLeftColor = 'var(--warning)';
      if (toastIcon) {
        toastIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--warning)" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      }
    } else if (type === 'danger') {
      toast.style.borderLeftColor = 'var(--danger)';
      if (toastIcon) {
        toastIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--danger)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      }
    }
    
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
});
