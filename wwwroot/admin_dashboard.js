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
  let allRegisteredUsers = [];

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

  function renderUsers(users) {
    userTableBody.innerHTML = '';
    if (users.length === 0) {
      userTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-secondary);">No registered users found.</td></tr>`;
      return;
    }

    users.forEach(user => {
      const tr = document.createElement('tr');
      const isUserAdmin = user.role === 'Admin';
      
      const permanentDistrict = user.permanentDistrict || 'N/A';

      tr.innerHTML = `
        <td style="color: var(--text-primary); font-weight: 500;">${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.phone || 'N/A')}</td>
        <td>${escapeHtml(user.gender || 'N/A')}</td>
        <td>${escapeHtml(permanentDistrict)}</td>
        <td>${escapeHtml(user.profession || 'N/A')}</td>
        <td><span class="role-badge ${isUserAdmin ? 'admin' : 'user'}">${isUserAdmin ? 'Admin' : 'User'}</span></td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="action-btn btn-secondary edit-user-row-btn" data-username="${escapeHtml(user.username)}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; height: 32px; flex: none;">Edit</button>
            <button class="action-btn btn-secondary delete-user-row-btn" data-username="${escapeHtml(user.username)}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; height: 32px; flex: none; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Delete</button>
          </div>
        </td>
      `;
      userTableBody.appendChild(tr);
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
        allRegisteredUsers = users;
        
        // Reset search input value when reloading
        const userSearchInput = document.getElementById('userSearchInput');
        if (userSearchInput) {
          userSearchInput.value = '';
        }
        
        renderUsers(users);
      })
      .catch(error => {
        console.error(error);
        userTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--danger);">❌ Error loading users database: ${error.message}</td></tr>`;
      });
  }

  // --- Search Users Event Listener ---
  const userSearchInput = document.getElementById('userSearchInput');
  if (userSearchInput) {
    userSearchInput.addEventListener('input', () => {
      const query = userSearchInput.value.toLowerCase().trim();
      if (!query) {
        renderUsers(allRegisteredUsers);
        return;
      }

      const filtered = allRegisteredUsers.filter(user => {
        const name = (user.name || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const gender = (user.gender || '').toLowerCase();
        const district = (user.permanentDistrict || '').toLowerCase();
        const profession = (user.profession || '').toLowerCase();
        const role = (user.role || '').toLowerCase();

        return name.includes(query) ||
               username.includes(query) ||
               email.includes(query) ||
               phone.includes(query) ||
               gender.includes(query) ||
               district.includes(query) ||
               profession.includes(query) ||
               role.includes(query);
      });

      renderUsers(filtered);
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

  // --- Admin User CRUD Modal and Actions ---
  const adminEditUserModal = document.getElementById('adminEditUserModal');
  const adminEditUserForm = document.getElementById('adminEditUserForm');
  const adminEditUserNameInput = document.getElementById('adminEditUserNameInput');
  const adminEditUserUsernameInput = document.getElementById('adminEditUserUsernameInput');
  const adminEditUserEmailInput = document.getElementById('adminEditUserEmailInput');
  const adminEditUserPhoneInput = document.getElementById('adminEditUserPhoneInput');
  const adminEditUserPresAreaInput = document.getElementById('adminEditUserPresAreaInput');
  const adminEditUserPresUpazillaInput = document.getElementById('adminEditUserPresUpazillaInput');
  const adminEditUserPresDistrictInput = document.getElementById('adminEditUserPresDistrictInput');
  const adminEditUserPresDivisionInput = document.getElementById('adminEditUserPresDivisionInput');
  const adminEditUserPermAreaInput = document.getElementById('adminEditUserPermAreaInput');
  const adminEditUserPermUpazillaInput = document.getElementById('adminEditUserPermUpazillaInput');
  const adminEditUserPermDistrictInput = document.getElementById('adminEditUserPermDistrictInput');
  const adminEditUserPermDivisionInput = document.getElementById('adminEditUserPermDivisionInput');
  const adminEditUserGenderInput = document.getElementById('adminEditUserGenderInput');
  const adminEditUserProfessionInput = document.getElementById('adminEditUserProfessionInput');
  const adminEditUserRoleInput = document.getElementById('adminEditUserRoleInput');
  const closeAdminEditUserModalBtn = document.getElementById('closeAdminEditUserModalBtn');
  const adminSaveUserChangesBtn = document.getElementById('adminSaveUserChangesBtn');

  let editingUserObject = null;

  function checkAdminEditUserChanges() {
    if (!editingUserObject || !adminSaveUserChangesBtn) return;

    const nameVal = adminEditUserNameInput ? adminEditUserNameInput.value.trim() : '';
    const emailVal = adminEditUserEmailInput ? adminEditUserEmailInput.value.trim() : '';
    const phoneVal = adminEditUserPhoneInput ? adminEditUserPhoneInput.value.trim() : '';
    const genderVal = adminEditUserGenderInput ? adminEditUserGenderInput.value : 'Male';
    const professionVal = adminEditUserProfessionInput ? adminEditUserProfessionInput.value.trim() : '';
    const roleVal = adminEditUserRoleInput ? adminEditUserRoleInput.value : 'User';

    const presAreaVal = adminEditUserPresAreaInput ? adminEditUserPresAreaInput.value.trim() : '';
    const presUpazillaVal = adminEditUserPresUpazillaInput ? adminEditUserPresUpazillaInput.value.trim() : '';
    const presDistrictVal = adminEditUserPresDistrictInput ? adminEditUserPresDistrictInput.value.trim() : '';
    const presDivisionVal = adminEditUserPresDivisionInput ? adminEditUserPresDivisionInput.value.trim() : '';

    const permAreaVal = adminEditUserPermAreaInput ? adminEditUserPermAreaInput.value.trim() : '';
    const permUpazillaVal = adminEditUserPermUpazillaInput ? adminEditUserPermUpazillaInput.value.trim() : '';
    const permDistrictVal = adminEditUserPermDistrictInput ? adminEditUserPermDistrictInput.value.trim() : '';
    const permDivisionVal = adminEditUserPermDivisionInput ? adminEditUserPermDivisionInput.value.trim() : '';

    const nameChanged = nameVal !== (editingUserObject.name || '').trim();
    const emailChanged = emailVal !== (editingUserObject.email || '').trim();
    const phoneChanged = phoneVal !== (editingUserObject.phone || '').trim();
    const genderChanged = genderVal !== (editingUserObject.gender || 'Male');
    const professionChanged = professionVal !== (editingUserObject.profession || '').trim();
    const roleChanged = roleVal !== (editingUserObject.role || 'User');

    const presAddressChanged = presAreaVal !== (editingUserObject.presArea || '').trim() ||
                              presUpazillaVal !== (editingUserObject.presUpazilla || '').trim() ||
                              presDistrictVal !== (editingUserObject.presDistrict || '').trim() ||
                              presDivisionVal !== (editingUserObject.presDivision || '').trim();

    const permAddressChanged = permAreaVal !== (editingUserObject.permArea || '').trim() ||
                              permUpazillaVal !== (editingUserObject.permUpazilla || '').trim() ||
                              permDistrictVal !== (editingUserObject.permanentDistrict || editingUserObject.permDistrict || '').trim() ||
                              permDivisionVal !== (editingUserObject.permDivision || '').trim();

    const hasChanges = nameChanged || emailChanged || phoneChanged || genderChanged || professionChanged || roleChanged || presAddressChanged || permAddressChanged;
    adminSaveUserChangesBtn.disabled = !hasChanges;
  }

  const adminEditFields = [
    adminEditUserNameInput, adminEditUserEmailInput, adminEditUserPhoneInput,
    adminEditUserPresAreaInput, adminEditUserPresUpazillaInput, adminEditUserPresDistrictInput, adminEditUserPresDivisionInput,
    adminEditUserPermAreaInput, adminEditUserPermUpazillaInput, adminEditUserPermDistrictInput, adminEditUserPermDivisionInput,
    adminEditUserProfessionInput
  ];
  adminEditFields.forEach(input => {
    if (input) {
      input.addEventListener('input', checkAdminEditUserChanges);
    }
  });
  if (adminEditUserGenderInput) adminEditUserGenderInput.addEventListener('change', checkAdminEditUserChanges);
  if (adminEditUserRoleInput) adminEditUserRoleInput.addEventListener('change', checkAdminEditUserChanges);

  if (closeAdminEditUserModalBtn && adminEditUserModal) {
    closeAdminEditUserModalBtn.addEventListener('click', () => {
      adminEditUserModal.style.display = 'none';
    });
  }

  // Row actions delegation click handler
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-user-row-btn')) {
      const username = e.target.getAttribute('data-username');
      const user = allRegisteredUsers.find(u => u.username === username);
      if (!user) return;

      editingUserObject = user;

      // Populate edit modal fields
      if (adminEditUserNameInput) adminEditUserNameInput.value = user.name || '';
      if (adminEditUserUsernameInput) adminEditUserUsernameInput.value = user.username || '';
      if (adminEditUserEmailInput) adminEditUserEmailInput.value = user.email || '';
      if (adminEditUserPhoneInput) adminEditUserPhoneInput.value = user.phone || '';
      if (adminEditUserPresAreaInput) adminEditUserPresAreaInput.value = user.presArea || '';
      if (adminEditUserPresUpazillaInput) adminEditUserPresUpazillaInput.value = user.presUpazilla || '';
      if (adminEditUserPresDistrictInput) adminEditUserPresDistrictInput.value = user.presDistrict || '';
      if (adminEditUserPresDivisionInput) adminEditUserPresDivisionInput.value = user.presDivision || '';
      if (adminEditUserPermAreaInput) adminEditUserPermAreaInput.value = user.permArea || '';
      if (adminEditUserPermUpazillaInput) adminEditUserPermUpazillaInput.value = user.permUpazilla || '';
      if (adminEditUserPermDistrictInput) adminEditUserPermDistrictInput.value = user.permanentDistrict || user.permDistrict || '';
      if (adminEditUserPermDivisionInput) adminEditUserPermDivisionInput.value = user.permDivision || '';
      if (adminEditUserGenderInput) adminEditUserGenderInput.value = user.gender || 'Male';
      if (adminEditUserProfessionInput) adminEditUserProfessionInput.value = user.profession || '';
      if (adminEditUserRoleInput) adminEditUserRoleInput.value = user.role || 'User';

      checkAdminEditUserChanges();

      if (adminEditUserModal) adminEditUserModal.style.display = 'flex';
    }

    if (e.target.classList.contains('delete-user-row-btn')) {
      const username = e.target.getAttribute('data-username');
      
      // Prevent deleting themselves!
      if (username === currentUser.username) {
        showToast('⚠️ You cannot delete your own admin account!', 'warning');
        return;
      }

      if (confirm(`Are you sure you want to permanently delete user "${username}" from the database registry?`)) {
        fetch(`${apiBase}/api/auth/users/${encodeURIComponent(username)}`, {
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
        .then(() => {
          showToast(`🎉 User "${username}" deleted successfully.`, 'success');
          loadUsers();
        })
        .catch(error => {
          showToast(`❌ Error: ${error.message}`, 'danger');
        });
      }
    }
  });

  if (adminEditUserForm) {
    adminEditUserForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!editingUserObject) return;

      const name = adminEditUserNameInput ? adminEditUserNameInput.value.trim() : '';
      const email = adminEditUserEmailInput ? adminEditUserEmailInput.value.trim() : '';
      const phone = adminEditUserPhoneInput ? adminEditUserPhoneInput.value.trim() : '';
      const gender = adminEditUserGenderInput ? adminEditUserGenderInput.value : '';
      const profession = adminEditUserProfessionInput ? adminEditUserProfessionInput.value.trim() : '';
      const role = adminEditUserRoleInput ? adminEditUserRoleInput.value : 'User';

      const presArea = adminEditUserPresAreaInput ? adminEditUserPresAreaInput.value.trim() : '';
      const presUpazilla = adminEditUserPresUpazillaInput ? adminEditUserPresUpazillaInput.value.trim() : '';
      const presDistrict = adminEditUserPresDistrictInput ? adminEditUserPresDistrictInput.value.trim() : '';
      const presDivision = adminEditUserPresDivisionInput ? adminEditUserPresDivisionInput.value.trim() : '';

      const permArea = adminEditUserPermAreaInput ? adminEditUserPermAreaInput.value.trim() : '';
      const permUpazilla = adminEditUserPermUpazillaInput ? adminEditUserPermUpazillaInput.value.trim() : '';
      const permDistrict = adminEditUserPermDistrictInput ? adminEditUserPermDistrictInput.value.trim() : '';
      const permDivision = adminEditUserPermDivisionInput ? adminEditUserPermDivisionInput.value.trim() : '';

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

      const updateData = {
        username: editingUserObject.username,
        name: name,
        email: email,
        phone: phone,
        permanentDistrict: permDistrict,
        gender: gender,
        profession: profession,
        presArea: presArea,
        presUpazilla: presUpazilla,
        presDistrict: presDistrict,
        presDivision: presDivision,
        permArea: permArea,
        permUpazilla: permUpazilla,
        permDivision: permDivision,
        role: role
      };

      fetch(`${apiBase}/api/auth/users/update`, {
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
        showToast('🎉 User updated successfully by admin!', 'success');
        adminEditUserModal.style.display = 'none';
        
        // If the admin edited their own profile, we should reload it
        if (editingUserObject.email === localStorage.getItem('userEmail')) {
          localStorage.setItem('userEmail', email); // in case they changed email
          loadProfile();
        }
        
        loadUsers();
      })
      .catch(error => {
        showToast(`❌ Error: ${error.message}`, 'danger');
      });
    });
  }
});
