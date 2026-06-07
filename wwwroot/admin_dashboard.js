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

  // Profile DOM Elements
  const nameDisplay = document.getElementById('nameDisplay');
  const emailDisplay = document.getElementById('emailDisplay');
  const phoneDisplay = document.getElementById('phoneDisplay');
  const presAddressDisplay = document.getElementById('presAddressDisplay');
  const permAddressDisplay = document.getElementById('permAddressDisplay');
  const genderDisplay = document.getElementById('genderDisplay');
  const professionDisplay = document.getElementById('professionDisplay');
  const dateDisplay = document.getElementById('dateDisplay');

  // 64 Districts List
  const districts = [
    "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria", 
    "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla", 
    "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", 
    "Habiganj", "Jamalpur", "Jashore", "Jhalokathi", "Jhenaidah", "Joypurhat", 
    "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lalmonirhat", 
    "Laxmipur", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", 
    "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", 
    "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", 
    "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", 
    "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", 
    "Tangail", "Thakurgaon"
  ];

  function initSearchableSelect(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    function renderDropdown(filterText = '') {
      dropdown.innerHTML = '';
      const filtered = districts.filter(d => 
        d.toLowerCase().includes(filterText.toLowerCase())
      );

      if (filtered.length === 0) {
        const noResult = document.createElement('div');
        noResult.style.padding = '0.75rem 1rem';
        noResult.style.color = 'var(--text-muted)';
        noResult.style.fontSize = '0.85rem';
        noResult.textContent = 'No district found';
        dropdown.appendChild(noResult);
        return;
      }

      filtered.forEach(district => {
        const option = document.createElement('div');
        option.style.padding = '0.65rem 1rem';
        option.style.color = 'var(--text-secondary)';
        option.style.cursor = 'pointer';
        option.style.fontSize = '0.88rem';
        option.style.transition = 'all var(--transition-fast)';
        option.style.textAlign = 'left';
        option.textContent = district;

        option.addEventListener('mouseenter', () => {
          option.style.background = 'rgba(6, 182, 212, 0.15)';
          option.style.color = 'var(--text-primary)';
          option.style.paddingLeft = '1.25rem';
        });

        option.addEventListener('mouseleave', () => {
          option.style.background = 'transparent';
          option.style.color = 'var(--text-secondary)';
          option.style.paddingLeft = '1rem';
        });

        option.addEventListener('click', (e) => {
          input.value = district;
          dropdown.style.display = 'none';
          input.dispatchEvent(new Event('input'));
          e.stopPropagation();
        });

        dropdown.appendChild(option);
      });
    }

    input.addEventListener('focus', () => {
      renderDropdown(input.value);
      dropdown.style.display = 'block';
    });

    input.addEventListener('input', () => {
      renderDropdown(input.value);
      dropdown.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    input.addEventListener('click', (e) => {
      dropdown.style.display = 'block';
      e.stopPropagation();
    });
  }

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

  let currentUser = null;

  function loadProfile() {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    fetch(`${apiBase}/api/auth/profile?email=${encodeURIComponent(email)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Could not fetch admin profile details from database.');
        }
        return response.json();
      })
      .then(user => {
        currentUser = user;
        // Display user data
        if (nameDisplay) nameDisplay.textContent = user.name;
        if (emailDisplay) emailDisplay.textContent = user.email;
        if (phoneDisplay) phoneDisplay.textContent = user.phone || 'N/A';
        
        if (presAddressDisplay) {
          const area = user.presArea || '';
          const upazilla = user.presUpazilla || '';
          const district = user.presDistrict || '';
          const division = user.presDivision || '';
          presAddressDisplay.textContent = [area, upazilla, district, division].filter(Boolean).join(', ') || 'N/A';
        }

        if (permAddressDisplay) {
          const area = user.permArea || '';
          const upazilla = user.permUpazilla || '';
          const district = user.permanentDistrict || user.permDistrict || '';
          const division = user.permDivision || '';
          permAddressDisplay.textContent = [area, upazilla, district, division].filter(Boolean).join(', ') || 'N/A';
        }

        if (genderDisplay) genderDisplay.textContent = user.gender || 'N/A';
        if (professionDisplay) professionDisplay.textContent = user.profession || 'N/A';
        
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
        if (permDistrictDisplay) permDistrictDisplay.textContent = 'Error loading profile';
        if (genderDisplay) genderDisplay.textContent = 'Error loading profile';
        if (professionDisplay) professionDisplay.textContent = 'Error loading profile';
        if (dateDisplay) dateDisplay.textContent = 'Error loading profile';
      });
  }

  // --- Initial Data Load ---
  loadProfile();
  loadUsers();
  loadNotices();

  // --- Profile Update Dialog ---
  const updateProfileBtn = document.getElementById('updateProfileBtn');
  const profileModal = document.getElementById('profileModal');
  const profileUpdateForm = document.getElementById('profileUpdateForm');
  const editNameInput = document.getElementById('editNameInput');
  const editUsernameInput = document.getElementById('editUsernameInput');
  const editEmailInput = document.getElementById('editEmailInput');
  const editPhoneInput = document.getElementById('editPhoneInput');
  const editPermDistrictInput = document.getElementById('editPermDistrictInput');
  const editPermDistrictDropdown = document.getElementById('editPermDistrictDropdown');
  const editGenderInput = document.getElementById('editGenderInput');
  const editProfessionInput = document.getElementById('editProfessionInput');
  const editNewPasswordInput = document.getElementById('editNewPasswordInput');
  const editConfirmPasswordInput = document.getElementById('editConfirmPasswordInput');
  const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');

  if (updateProfileBtn && profileModal) {
    updateProfileBtn.addEventListener('click', () => {
      if (!currentUser) {
        showToast('⚠️ Profile is still loading.', 'warning');
        return;
      }
      
      // Populate fields
      if (editNameInput) editNameInput.value = currentUser.name || '';
      if (editUsernameInput) editUsernameInput.value = currentUser.username || '';
      if (editEmailInput) editEmailInput.value = currentUser.email || '';
      if (editPhoneInput) editPhoneInput.value = currentUser.phone || '';
      
      if (document.getElementById('editPresAreaInput')) document.getElementById('editPresAreaInput').value = currentUser.presArea || '';
      if (document.getElementById('editPresUpazillaInput')) document.getElementById('editPresUpazillaInput').value = currentUser.presUpazilla || '';
      if (document.getElementById('editPresDistrictInput')) document.getElementById('editPresDistrictInput').value = currentUser.presDistrict || '';
      if (document.getElementById('editPresDivisionInput')) document.getElementById('editPresDivisionInput').value = currentUser.presDivision || '';

      if (document.getElementById('editPermAreaInput')) document.getElementById('editPermAreaInput').value = currentUser.permArea || '';
      if (document.getElementById('editPermUpazillaInput')) document.getElementById('editPermUpazillaInput').value = currentUser.permUpazilla || '';
      if (document.getElementById('editPermDistrictInput')) document.getElementById('editPermDistrictInput').value = currentUser.permanentDistrict || '';
      if (document.getElementById('editPermDivisionInput')) document.getElementById('editPermDivisionInput').value = currentUser.permDivision || '';

      if (editGenderInput) editGenderInput.value = currentUser.gender || 'Male';
      if (editProfessionInput) editProfessionInput.value = currentUser.profession || '';
      
      // Clear password fields
      if (editNewPasswordInput) editNewPasswordInput.value = '';
      if (editConfirmPasswordInput) editConfirmPasswordInput.value = '';
      
      checkChanges();
      
      profileModal.style.display = 'flex';
    });
  }

  if (closeProfileModalBtn && profileModal) {
    closeProfileModalBtn.addEventListener('click', () => {
      profileModal.style.display = 'none';
    });
  }

  const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn');

  function checkChanges() {
    if (!currentUser || !saveProfileChangesBtn) return;

    const nameVal = editNameInput ? editNameInput.value.trim() : '';
    const emailVal = editEmailInput ? editEmailInput.value.trim() : '';
    const phoneVal = editPhoneInput ? editPhoneInput.value.trim() : '';
    const genderVal = editGenderInput ? editGenderInput.value : 'Male';
    const professionVal = editProfessionInput ? editProfessionInput.value.trim() : '';
    const newPasswordVal = editNewPasswordInput ? editNewPasswordInput.value : '';
    const confirmPasswordVal = editConfirmPasswordInput ? editConfirmPasswordInput.value : '';

    const presAreaEl = document.getElementById('editPresAreaInput');
    const presUpazillaEl = document.getElementById('editPresUpazillaInput');
    const presDistrictEl = document.getElementById('editPresDistrictInput');
    const presDivisionEl = document.getElementById('editPresDivisionInput');
    const presAreaVal = presAreaEl ? presAreaEl.value.trim() : '';
    const presUpazillaVal = presUpazillaEl ? presUpazillaEl.value.trim() : '';
    const presDistrictVal = presDistrictEl ? presDistrictEl.value.trim() : '';
    const presDivisionVal = presDivisionEl ? presDivisionEl.value.trim() : '';

    const permAreaEl = document.getElementById('editPermAreaInput');
    const permUpazillaEl = document.getElementById('editPermUpazillaInput');
    const permDistrictEl = document.getElementById('editPermDistrictInput');
    const permDivisionEl = document.getElementById('editPermDivisionInput');
    const permAreaVal = permAreaEl ? permAreaEl.value.trim() : '';
    const permUpazillaVal = permUpazillaEl ? permUpazillaEl.value.trim() : '';
    const permDistrictVal = permDistrictEl ? permDistrictEl.value.trim() : '';
    const permDivisionVal = permDivisionEl ? permDivisionEl.value.trim() : '';

    const nameChanged = nameVal !== (currentUser.name || '').trim();
    const emailChanged = emailVal !== (currentUser.email || '').trim();
    const phoneChanged = phoneVal !== (currentUser.phone || '').trim();
    const genderChanged = genderVal !== (currentUser.gender || 'Male');
    const professionChanged = professionVal !== (currentUser.profession || '').trim();
    const passwordChanged = newPasswordVal !== '' || confirmPasswordVal !== '';

    const presAddressChanged = presAreaVal !== (currentUser.presArea || '').trim() ||
                              presUpazillaVal !== (currentUser.presUpazilla || '').trim() ||
                              presDistrictVal !== (currentUser.presDistrict || '').trim() ||
                              presDivisionVal !== (currentUser.presDivision || '').trim();

    const permAddressChanged = permAreaVal !== (currentUser.permArea || '').trim() ||
                              permUpazillaVal !== (currentUser.permUpazilla || '').trim() ||
                              permDistrictVal !== (currentUser.permanentDistrict || '').trim() ||
                              permDivisionVal !== (currentUser.permDivision || '').trim();

    const hasChanges = nameChanged || emailChanged || phoneChanged || genderChanged || professionChanged || passwordChanged || presAddressChanged || permAddressChanged;
    saveProfileChangesBtn.disabled = !hasChanges;
  }

  const profileFields = [
    editNameInput, editEmailInput, editPhoneInput, 
    editNewPasswordInput, editConfirmPasswordInput,
    document.getElementById('editPresAreaInput'),
    document.getElementById('editPresUpazillaInput'),
    document.getElementById('editPresDistrictInput'),
    document.getElementById('editPresDivisionInput'),
    document.getElementById('editPermAreaInput'),
    document.getElementById('editPermUpazillaInput'),
    document.getElementById('editPermDistrictInput'),
    document.getElementById('editPermDivisionInput')
  ];
  profileFields.forEach(input => {
    if (input) {
      input.addEventListener('input', checkChanges);
    }
  });
  if (editGenderInput) {
    editGenderInput.addEventListener('change', checkChanges);
  }

  if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const currentEmail = localStorage.getItem('userEmail');
      const name = editNameInput ? editNameInput.value.trim() : '';
      const email = editEmailInput ? editEmailInput.value.trim() : '';
      const phone = editPhoneInput ? editPhoneInput.value.trim() : '';
      
      const presArea = document.getElementById('editPresAreaInput') ? document.getElementById('editPresAreaInput').value.trim() : '';
      const presUpazilla = document.getElementById('editPresUpazillaInput') ? document.getElementById('editPresUpazillaInput').value.trim() : '';
      const presDistrict = document.getElementById('editPresDistrictInput') ? document.getElementById('editPresDistrictInput').value.trim() : '';
      const presDivision = document.getElementById('editPresDivisionInput') ? document.getElementById('editPresDivisionInput').value.trim() : '';

      const permArea = document.getElementById('editPermAreaInput') ? document.getElementById('editPermAreaInput').value.trim() : '';
      const permUpazilla = document.getElementById('editPermUpazillaInput') ? document.getElementById('editPermUpazillaInput').value.trim() : '';
      const permDistrict = document.getElementById('editPermDistrictInput') ? document.getElementById('editPermDistrictInput').value.trim() : '';
      const permDivision = document.getElementById('editPermDivisionInput') ? document.getElementById('editPermDivisionInput').value.trim() : '';

      const gender = editGenderInput ? editGenderInput.value : '';
      const profession = editProfessionInput ? editProfessionInput.value.trim() : '';
      const newPassword = editNewPasswordInput ? editNewPasswordInput.value : '';
      const confirmPassword = editConfirmPasswordInput ? editConfirmPasswordInput.value : '';
      
      if (!name || !email || !phone || !profession ||
          !presArea || !presUpazilla || !presDistrict || !presDivision ||
          !permArea || !permUpazilla || !permDistrict || !permDivision) {
        showToast('⚠️ Please fill out all required fields.', 'warning');
        return;
      }
      
      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('⚠️ Please enter a valid email address.', 'warning');
        return;
      }
      
      // Phone format check
      if (phone.length < 7 || isNaN(phone.replace(/[+\-\s()]/g, ''))) {
        showToast('⚠️ Please enter a valid phone number.', 'warning');
        return;
      }

      // Password Complexity Validation if entered
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          showToast('⚠️ Passwords do not match.', 'danger');
          return;
        }
        
        const hasMinLength = newPassword.length >= 8;
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        
        if (!hasMinLength || !hasNumber || !hasSpecial || !hasUpper || !hasLower) {
          showToast('⚠️ Password must be at least 8 characters long, containing a number, a special character, a capital letter, and a small letter.', 'danger');
          return;
        }
      }

      const updateData = {
        currentEmail: currentEmail,
        name: name,
        email: email,
        phone: phone,
        permanentDistrict: permDistrict,
        presArea: presArea,
        presUpazilla: presUpazilla,
        presDistrict: presDistrict,
        presDivision: presDivision,
        permArea: permArea,
        permUpazilla: permUpazilla,
        permDivision: permDivision,
        gender: gender,
        profession: profession,
        newPassword: newPassword || ''
      };

      fetch(`${apiBase}/api/auth/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
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
        showToast('🎉 Profile updated successfully!', 'success');
        localStorage.setItem('userEmail', data.email); // update local storage if email changed
        profileModal.style.display = 'none';
        loadProfile();
      })
      .catch(error => {
        showToast(`❌ Error: ${error.message}`, 'danger');
      });
    });
  }

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
