document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const userTableBody = document.getElementById('userTableBody');
  const adminNoticesContainer = document.getElementById('adminNoticesContainer');
  const noticeForm = document.getElementById('noticeForm');
  const noticeIdInput = document.getElementById('noticeIdInput');
  const noticeNumberInput = document.getElementById('noticeNumberInput');
  const noticeTitleInput = document.getElementById('noticeTitleInput');
  const noticeContentInput = document.getElementById('noticeContentInput');
  const noticeSubmitBtn = document.getElementById('noticeSubmitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // --- Session Verification ---
  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');

  if (!userEmail) {
    window.location.href = 'signin.html';
    return;
  }

  if (userRole !== 'Admin') {
    window.location.href = 'dashboard.html';
    return;
  }

  // --- API Setup ---
  const apiBase = (window.location.host === 'localhost:5080' || window.location.host === '127.0.0.1:5080') 
    ? '' 
    : 'http://localhost:5080';

  // --- Initial Data Load ---
  loadUsers();
  loadNotices();

  // --- Load Registered Users ---
  function loadUsers() {
    fetch(`${apiBase}/api/auth/users`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load registered database users.');
        return response.json();
      })
      .then(users => {
        userTableBody.innerHTML = '';
        if (users.length === 0) {
          userTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No registered users found.</td></tr>`;
          return;
        }

        users.forEach(user => {
          const tr = document.createElement('tr');
          const isUserAdmin = user.role === 'Admin';
          tr.innerHTML = `
            <td style="color: var(--text-primary); font-weight: 500;">${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.phone || 'N/A')}</td>
            <td><span class="role-badge ${isUserAdmin ? 'admin' : 'user'}">${isUserAdmin ? 'Admin' : 'User'}</span></td>
          `;
          userTableBody.appendChild(tr);
        });
      })
      .catch(error => {
        console.error(error);
        userTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">❌ Error loading users database: ${error.message}</td></tr>`;
      });
  }

  // --- Load Notice Board List ---
  function loadNotices() {
    fetch(`${apiBase}/api/notice`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load notice list from database.');
        return response.json();
      })
      .then(notices => {
        adminNoticesContainer.innerHTML = '';
        if (notices.length === 0) {
          adminNoticesContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1.5rem 0;">No notices published yet.</div>';
          return;
        }

        notices.forEach(notice => {
          const div = document.createElement('div');
          div.className = 'admin-notice-item';
          div.innerHTML = `
            <div class="admin-notice-content">
              <strong>${escapeHtml(notice.noticeNumber)}. ${escapeHtml(notice.title)}:</strong>
              <div>${escapeHtml(notice.content)}</div>
            </div>
            <div class="notice-actions">
              <button class="mini-btn edit" data-id="${notice.id}">✏️ Edit</button>
              <button class="mini-btn delete" data-id="${notice.id}">🗑️ Del</button>
            </div>
          `;
          
          // Bind Edit button click handler
          div.querySelector('.edit').addEventListener('click', () => {
            enterEditMode(notice);
          });

          // Bind Delete button click handler
          div.querySelector('.delete').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete notice "${notice.title}"?`)) {
              deleteNotice(notice.id);
            }
          });

          adminNoticesContainer.appendChild(div);
        });
      })
      .catch(error => {
        console.error(error);
        adminNoticesContainer.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 1.5rem 0;">❌ Failed to load notices: ${error.message}</div>`;
      });
  }

  // --- Notice Form Submit (Create or Update) ---
  if (noticeForm) {
    noticeForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const noticeId = noticeIdInput.value;
      const noticeNumber = noticeNumberInput.value.trim();
      const title = noticeTitleInput.value.trim();
      const content = noticeContentInput.value.trim();

      if (!noticeNumber || !title || !content) {
        showToast('⚠️ Please fill in all notice fields.', 'warning');
        return;
      }

      const noticeData = {
        noticeNumber,
        title,
        content
      };

      if (noticeId) {
        noticeData.id = parseInt(noticeId, 10);
        
        // Put (Update) Call
        fetch(`${apiBase}/api/notice/${noticeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(noticeData)
        })
        .then(async response => {
          const isJson = response.headers.get('content-type')?.includes('application/json');
          const data = isJson ? await response.json() : null;
          if (response.ok) {
            return data;
          } else {
            const errMsg = (data && data.message) ? data.message : `Server error (${response.status})`;
            throw new Error(errMsg);
          }
        })
        .then(data => {
          showToast('🎉 Notice updated successfully!', 'success');
          resetNoticeForm();
          loadNotices();
        })
        .catch(error => {
          showToast(`❌ Error: ${error.message}`, 'danger');
        });
      } else {
        // Post (Create) Call
        fetch(`${apiBase}/api/notice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(noticeData)
        })
        .then(async response => {
          const isJson = response.headers.get('content-type')?.includes('application/json');
          const data = isJson ? await response.json() : null;
          if (response.ok) {
            return data;
          } else {
            const errMsg = (data && data.message) ? data.message : `Server error (${response.status})`;
            throw new Error(errMsg);
          }
        })
        .then(data => {
          showToast('🎉 Notice created successfully!', 'success');
          resetNoticeForm();
          loadNotices();
        })
        .catch(error => {
          showToast(`❌ Error: ${error.message}`, 'danger');
        });
      }
    });
  }

  // --- Edit Mode Mode Configuration ---
  function enterEditMode(notice) {
    noticeIdInput.value = notice.id;
    noticeNumberInput.value = notice.noticeNumber;
    noticeTitleInput.value = notice.title;
    noticeContentInput.value = notice.content;
    
    submitBtnText.textContent = 'Update Notice';
    cancelEditBtn.style.display = 'inline-flex';
    noticeNumberInput.focus();
    
    // Smooth scroll form into view
    noticeForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', resetNoticeForm);
  }

  function resetNoticeForm() {
    noticeIdInput.value = '';
    noticeForm.reset();
    submitBtnText.textContent = 'Add Notice';
    cancelEditBtn.style.display = 'none';
  }

  // --- Delete Notice Action ---
  function deleteNotice(id) {
    fetch(`${apiBase}/api/notice/${id}`, {
      method: 'DELETE'
    })
    .then(async response => {
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;
      if (response.ok) {
        return data;
      } else {
        const errMsg = (data && data.message) ? data.message : `Server error (${response.status})`;
        throw new Error(errMsg);
      }
    })
    .then(data => {
      showToast('🗑️ Notice deleted successfully!', 'success');
      loadNotices();
      // If we were editing that notice, cancel edit mode
      if (noticeIdInput.value === String(id)) {
        resetNoticeForm();
      }
    })
    .catch(error => {
      showToast(`❌ Error: ${error.message}`, 'danger');
    });
  }

  // --- Logout Click Handler ---
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

  // --- Utility: Safe Escape HTML ---
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- Toast Notification Helper ---
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
