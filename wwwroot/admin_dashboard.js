document.addEventListener('DOMContentLoaded', () => {
  let bookingToCancel = null;
  let lastCancelledPaymentMethod = "";

  // Search & Journey History DOM Elements
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  const swapBtn = document.getElementById('swapBtn');
  const journeyDateInput = document.getElementById('journeyDateInput');
  const searchBtn = document.getElementById('searchBtn');
  const journeyHistoryContainer = document.getElementById('journeyHistoryContainer');

  // --- DOM Elements ---
  const userTableBody = document.getElementById('userTableBody');
  const adminNoticesContainer = document.getElementById('adminNoticesContainer');
  const noticeForm = document.getElementById('noticeForm');
  const noticeIdInput = document.getElementById('noticeIdInput');
  const noticeNumberInput = document.getElementById('noticeNumberInput');
  const noticeTitleInput = document.getElementById('noticeTitleInput');
  const noticeContentInput = document.getElementById('noticeContentInput');

  // --- Admin Reviews Audit board variables ---
  let reviewCurrentPage = 1;
  const reviewPageSize = 5;
  let allReviews = [];
  let reviewedSet = new Set();

  const viewReviewsBtn = document.getElementById('viewReviewsBtn');
  const adminReviewsContainer = document.getElementById('adminReviewsContainer');
  const reviewsTableBody = document.getElementById('reviewsTableBody');
  const prevReviewsBtn = document.getElementById('prevReviewsBtn');
  const nextReviewsBtn = document.getElementById('nextReviewsBtn');
  const reviewsPageIndicator = document.getElementById('reviewsPageIndicator');
  const noticeSubmitBtn = document.getElementById('noticeSubmitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const busTableBody = document.getElementById('busTableBody');
  const busSearchInput = document.getElementById('busSearchInput');
  const bookingTableBody = document.getElementById('bookingTableBody');
  const adminBusDateFilter = document.getElementById('adminBusDateFilter');
  const busJourneyDateInput = document.getElementById('busJourneyDateInput');
  const clearAdminBusDateBtn = document.getElementById('clearAdminBusDateBtn');
  
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
  const apiBase = (window.location.port === '5080' || window.location.port === '7234')
    ? ''
    : `${window.location.protocol === 'file:' ? 'http:' : window.location.protocol}//${window.location.hostname === 'file:' || !window.location.hostname ? 'localhost' : window.location.hostname}:5080`;

  let currentUser = null;
  let allRegisteredUsers = [];
  let allBuses = [];
  let allBookings = [];
  let activeBuses = [];
  let busCurrentPage = 1;
  const busPageSize = 50;

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
        if (permAddressDisplay) permAddressDisplay.textContent = 'Error loading profile';
        if (genderDisplay) genderDisplay.textContent = 'Error loading profile';
        if (professionDisplay) professionDisplay.textContent = 'Error loading profile';
        if (dateDisplay) dateDisplay.textContent = 'Error loading profile';
      });
  }

  // --- Initial Data Load ---
  loadProfile();
  loadUsers();
  loadNotices();
  loadBookings();
  loadReviews();
  fetchReviewedAndLoadHistory();

  // Initialize datepicker default value and load buses
  if (adminBusDateFilter) {
    setTimeout(() => {
      toggleClearDateBtn();
      loadBuses();
    }, 50);
  } else if (busTableBody) {
    busTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">Please select a date first to view the bus database.</td></tr>';
  }

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
        if (typeof renderReviewsPage === 'function') {
          renderReviewsPage();
        }
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

  // --- Load and Render Bookings ---

  function renderBookings(bookingsList) {
    if (!bookingTableBody) return;
    bookingTableBody.innerHTML = '';

    if (bookingsList.length === 0) {
      bookingTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">No ticket bookings found.</td></tr>`;
      return;
    }

    bookingsList.forEach(booking => {
      const tr = document.createElement('tr');
      
      let statusText = booking.status || 'Upcoming';
      let badgeStyle = '';
      if (statusText === 'Upcoming') {
        badgeStyle = 'background: rgba(6, 182, 212, 0.15); color: var(--accent-secondary); border: 1px solid rgba(6, 182, 212, 0.3);';
      } else if (statusText === 'Cancelled') {
        badgeStyle = 'background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3);';
      } else if (statusText === 'Completed') {
        badgeStyle = 'background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3);';
      }

      let formattedIssueDate = 'N/A';
      if (booking.issueDate) {
        const issueDate = new Date(booking.issueDate);
        formattedIssueDate = issueDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      tr.innerHTML = `
        <td style="color: var(--text-primary); font-weight: 500;">${escapeHtml(booking.username)}</td>
        <td>${escapeHtml(booking.journeyDate)} (${escapeHtml(booking.departureTime)})</td>
        <td>${escapeHtml(formattedIssueDate)}</td>
        <td>${escapeHtml(booking.busName)}</td>
        <td style="color: var(--text-secondary); font-size: 0.82rem;">${escapeHtml(booking.fromDistrict || '')} &rarr; ${escapeHtml(booking.toDistrict || '')}</td>
        <td style="font-weight: 600; color: var(--accent-secondary);">${escapeHtml(booking.seats)}</td>
        <td><span style="font-size: 0.8rem; text-transform: uppercase; font-weight: 600;">${escapeHtml(booking.paymentMethod)}</span></td>
        <td><span class="role-badge" style="${badgeStyle}">${escapeHtml(statusText)}</span></td>
      `;
      bookingTableBody.appendChild(tr);
    });
  }

  function loadBookings() {
    if (!bookingTableBody) return;
    fetch(`${apiBase}/api/booking`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load bookings database.');
        return response.json();
      })
      .then(bookings => {
        allBookings = bookings;
        
        const bookingSearchInput = document.getElementById('bookingSearchInput');
        if (bookingSearchInput) {
          bookingSearchInput.value = '';
        }
        
        renderBookings(bookings);
      })
      .catch(error => {
        console.error(error);
        bookingTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 1.5rem;">❌ Error loading bookings database: ${error.message}</td></tr>`;
      });
  }

  const bookingSearchInput = document.getElementById('bookingSearchInput');
  if (bookingSearchInput) {
    bookingSearchInput.addEventListener('input', () => {
      const query = bookingSearchInput.value.toLowerCase().trim();
      if (!query) {
        renderBookings(allBookings);
        return;
      }

      const filtered = allBookings.filter(booking => {
        const username = (booking.username || '').toLowerCase();
        const busName = (booking.busName || '').toLowerCase();
        const journeyDate = (booking.journeyDate || '').toLowerCase();
        const seats = (booking.seats || '').toLowerCase();
        const paymentMethod = (booking.paymentMethod || '').toLowerCase();
        const status = (booking.status || '').toLowerCase();
        const departureTime = (booking.departureTime || '').toLowerCase();

        const route = ((booking.fromDistrict || '') + ' ' + (booking.toDistrict || '')).toLowerCase();

        return username.includes(query) ||
               busName.includes(query) ||
               journeyDate.includes(query) ||
               route.includes(query) ||
               seats.includes(query) ||
               paymentMethod.includes(query) ||
               status.includes(query) ||
               departureTime.includes(query);
      });

      renderBookings(filtered);
    });
  }

  // --- Load and Render Buses ---

  function renderBuses(busesList) {
    if (!busTableBody) return;
    busTableBody.innerHTML = '';
    
    activeBuses = busesList;
    const totalBuses = activeBuses.length;
    const maxPages = Math.max(1, Math.ceil(totalBuses / busPageSize));
    if (busCurrentPage > maxPages) {
      busCurrentPage = maxPages;
    }
    if (busCurrentPage < 1) {
      busCurrentPage = 1;
    }

    if (totalBuses === 0) {
      busTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No buses found for this date. Click Add New Bus to create one.</td></tr>`;
      updatePaginationControls(0, 0, 0);
      return;
    }

    const startIdx = (busCurrentPage - 1) * busPageSize;
    const endIdx = Math.min(startIdx + busPageSize, totalBuses);
    const paginatedBuses = activeBuses.slice(startIdx, endIdx);

    paginatedBuses.forEach(bus => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: var(--text-primary); font-weight: 500;">${escapeHtml(bus.operator)}</td>
        <td><span class="role-badge user">${escapeHtml(bus.busType)}</span></td>
        <td>${escapeHtml(bus.fromDistrict)} ➔ ${escapeHtml(bus.toDistrict)}</td>
        <td>${escapeHtml(bus.departureTime)}</td>
        <td>৳${bus.fare.toLocaleString()}</td>
        <td><span style="color: ${bus.availableSeats < 10 ? 'var(--danger)' : 'var(--success)'}; font-weight: 600;">${bus.availableSeats}</span></td>
        <td style="text-align: center; white-space: nowrap;">
          <button class="edit-bus-row-btn action-btn btn-secondary" data-id="${bus.id}" style="display: inline-flex; padding: 0.35rem 0.65rem; border-radius: 4px; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: 1px solid rgba(6, 182, 212, 0.3); background: rgba(6, 182, 212, 0.05); color: var(--accent-secondary); transition: all 0.2s; margin-right: 0.35rem; width: auto; height: auto; justify-content: center; line-height: 1;">Edit</button>
          <button class="delete-bus-row-btn action-btn btn-secondary" data-id="${bus.id}" style="display: inline-flex; padding: 0.35rem 0.65rem; border-radius: 4px; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); color: var(--danger); transition: all 0.2s; width: auto; height: auto; justify-content: center; line-height: 1;">Delete</button>
        </td>
      `;
      busTableBody.appendChild(tr);
    });

    updatePaginationControls(startIdx + 1, endIdx, totalBuses);
  }

  function updatePaginationControls(start, end, total) {
    const busPaginationInfo = document.getElementById('busPaginationInfo');
    const busPrevPageBtn = document.getElementById('busPrevPageBtn');
    const busNextPageBtn = document.getElementById('busNextPageBtn');
    const busPaginationControls = document.getElementById('busPaginationControls');

    if (!busPaginationControls) return;

    if (total === 0) {
      if (busPaginationInfo) busPaginationInfo.textContent = 'Showing 0-0 of 0 buses';
      if (busPrevPageBtn) busPrevPageBtn.disabled = true;
      if (busNextPageBtn) busNextPageBtn.disabled = true;
      return;
    }

    if (busPaginationInfo) {
      busPaginationInfo.textContent = `Showing ${start}-${end} of ${total.toLocaleString()} buses`;
    }

    const maxPages = Math.ceil(total / busPageSize);

    if (busPrevPageBtn) {
      busPrevPageBtn.disabled = (busCurrentPage === 1);
      busPrevPageBtn.style.opacity = (busCurrentPage === 1) ? '0.4' : '1';
      busPrevPageBtn.style.cursor = (busCurrentPage === 1) ? 'not-allowed' : 'pointer';
    }

    if (busNextPageBtn) {
      busNextPageBtn.disabled = (busCurrentPage === maxPages);
      busNextPageBtn.style.opacity = (busCurrentPage === maxPages) ? '0.4' : '1';
      busNextPageBtn.style.cursor = (busCurrentPage === maxPages) ? 'not-allowed' : 'pointer';
    }
  }

  // Set up pagination button event listeners
  const busPrevPageBtn = document.getElementById('busPrevPageBtn');
  const busNextPageBtn = document.getElementById('busNextPageBtn');

  if (busPrevPageBtn) {
    busPrevPageBtn.addEventListener('click', () => {
      if (busCurrentPage > 1) {
        busCurrentPage--;
        renderBuses(activeBuses);
      }
    });
  }

  if (busNextPageBtn) {
    busNextPageBtn.addEventListener('click', () => {
      const maxPages = Math.ceil(activeBuses.length / busPageSize);
      if (busCurrentPage < maxPages) {
        busCurrentPage++;
        renderBuses(activeBuses);
      }
    });
  }

  function toggleClearDateBtn() {
    if (!clearAdminBusDateBtn) return;
    if (adminBusDateFilter && adminBusDateFilter.value) {
      clearAdminBusDateBtn.style.display = 'inline-flex';
    } else {
      clearAdminBusDateBtn.style.display = 'none';
    }
  }

  function loadBuses() {
    if (!busTableBody) return;
    const dateVal = adminBusDateFilter ? adminBusDateFilter.value : '';
    if (!dateVal) {
      busTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">Please select a date first to view the bus database.</td></tr>';
      updatePaginationControls(0, 0, 0);
      return;
    }
    
    // Show Loading state while database is prepared
    busTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;"><div class="loading-spinner"></div> Loading, please wait while database is being prepared...</td></tr>';
    updatePaginationControls(0, 0, 0);

    fetch(`${apiBase}/api/bus?date=${encodeURIComponent(dateVal)}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load buses from database.');
        return response.json();
      })
      .then(buses => {
        allBuses = buses;
        busCurrentPage = 1;
        if (busSearchInput) {
          busSearchInput.value = '';
        }
        renderBuses(buses);
      })
      .catch(error => {
        console.error(error);
        busTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">❌ Error loading bus database: ${error.message}</td></tr>`;
      });
  }

  if (busSearchInput) {
    busSearchInput.addEventListener('input', () => {
      const query = busSearchInput.value.toLowerCase().trim();
      busCurrentPage = 1;
      if (!query) {
        renderBuses(allBuses);
        return;
      }

      const filtered = allBuses.filter(bus => {
        const operator = (bus.operator || '').toLowerCase();
        const busType = (bus.busType || '').toLowerCase();
        const fromDistrict = (bus.fromDistrict || '').toLowerCase();
        const toDistrict = (bus.toDistrict || '').toLowerCase();
        const departureTime = (bus.departureTime || '').toLowerCase();
        const fare = String(bus.fare);
        const route = `${fromDistrict} ${toDistrict} ${fromDistrict} to ${toDistrict} ${fromDistrict}➔${toDistrict} ${fromDistrict}->${toDistrict} ${fromDistrict}-${toDistrict}`;

        return operator.includes(query) ||
               busType.includes(query) ||
               route.includes(query) ||
               departureTime.includes(query) ||
               fare.includes(query);
      });

      renderBuses(filtered);
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

  // --- Admin Bus CRUD Modal and Actions ---
  const adminBusModal = document.getElementById('adminBusModal');
  const adminBusForm = document.getElementById('adminBusForm');
  const addBusBtn = document.getElementById('addBusBtn');
  const closeAdminBusModalBtn = document.getElementById('closeAdminBusModalBtn');
  const busIdInput = document.getElementById('busIdInput');
  const busOperatorInput = document.getElementById('busOperatorInput');
  const busTypeInput = document.getElementById('busTypeInput');
  const busFromDistrictInput = document.getElementById('busFromDistrictInput');
  const busToDistrictInput = document.getElementById('busToDistrictInput');
  const busDepartureTimeInput = document.getElementById('busDepartureTimeInput');
  const busAvailableSeatsInput = document.getElementById('busAvailableSeatsInput');
  const busFareInput = document.getElementById('busFareInput');
  const busModalTitleText = document.getElementById('busModalTitleText');

  // Populate From/To dropdowns
  if (busFromDistrictInput && busToDistrictInput) {
    busFromDistrictInput.innerHTML = '<option value="" disabled selected>Select district</option>';
    busToDistrictInput.innerHTML = '<option value="" disabled selected>Select district</option>';
    districts.forEach(d => {
      const opt1 = document.createElement('option');
      opt1.value = d;
      opt1.textContent = d;
      busFromDistrictInput.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = d;
      opt2.textContent = d;
      busToDistrictInput.appendChild(opt2);
    });
  }

  // Coordinate map for all 64 districts in Bangladesh
  const districtCoords = {
    "Bagerhat": [22.6517, 89.7859],
    "Bandarban": [22.1953, 92.2184],
    "Barguna": [22.0953, 90.1121],
    "Barishal": [22.7010, 90.3535],
    "Bhola": [22.6859, 90.6482],
    "Bogura": [24.8465, 89.3778],
    "Brahmanbaria": [23.9575, 91.1158],
    "Chandpur": [23.2323, 90.6550],
    "Chapainawabganj": [24.5965, 88.2775],
    "Chattogram": [22.3569, 91.7832],
    "Chuadanga": [23.6402, 88.8418],
    "Cox's Bazar": [21.4272, 92.0058],
    "Cumilla": [23.4607, 91.1809],
    "Dhaka": [23.8103, 90.4125],
    "Dinajpur": [25.6279, 88.6332],
    "Faridpur": [23.5424, 89.6309],
    "Feni": [23.0159, 91.3976],
    "Gaibandha": [25.3297, 89.5430],
    "Gazipur": [24.0958, 90.4125],
    "Gopalganj": [23.0051, 89.8262],
    "Habiganj": [24.3749, 91.4110],
    "Jamalpur": [24.9376, 89.9377],
    "Jashore": [23.1633, 89.2182],
    "Jhalokathi": [22.6432, 90.1983],
    "Jhenaidah": [23.5450, 89.1725],
    "Joypurhat": [25.0947, 89.0945],
    "Khagrachhari": [23.1333, 91.9833],
    "Khulna": [22.8456, 89.5403],
    "Kishoreganj": [24.4260, 90.9821],
    "Kurigram": [25.8072, 89.6295],
    "Kushtia": [23.9038, 89.1226],
    "Lalmonirhat": [25.9923, 89.2847],
    "Laxmipur": [22.9463, 90.8286],
    "Madaripur": [23.2393, 90.1870],
    "Magura": [23.4873, 89.4187],
    "Manikganj": [23.8617, 90.0003],
    "Meherpur": [23.7712, 88.6366],
    "Moulvibazar": [24.4829, 91.7773],
    "Munshiganj": [23.4981, 90.4127],
    "Mymensingh": [24.7434, 90.3984],
    "Naogaon": [24.9132, 88.7531],
    "Narail": [23.1678, 89.5074],
    "Narayanganj": [23.6226, 90.4998],
    "Narsingdi": [24.1344, 90.7860],
    "Natore": [24.4102, 89.0076],
    "Netrokona": [24.8709, 90.7279],
    "Nilphamari": [25.8483, 88.9414],
    "Noakhali": [22.8222, 91.0970],
    "Pabna": [24.0113, 89.2562],
    "Panchagarh": [26.2709, 88.5952],
    "Patuakhali": [22.3593, 90.3299],
    "Pirojpur": [22.5786, 89.9824],
    "Rajbari": [23.7151, 89.5875],
    "Rajshahi": [24.3636, 88.6241],
    "Rangamati": [22.6556, 92.1754],
    "Rangpur": [25.7439, 89.2752],
    "Satkhira": [22.7185, 89.0705],
    "Shariatpur": [23.2423, 90.4348],
    "Sherpur": [25.0746, 90.1495],
    "Sirajganj": [24.3141, 89.5700],
    "Sunamganj": [25.0711, 91.4013],
    "Sylhet": [24.8949, 91.8687],
    "Tangail": [24.2450, 89.9113],
    "Thakurgaon": [26.0418, 88.4283]
  };

  // Client-side Haversine formula calculation
  function calculateClientFare(from, to, busType) {
    const c1 = districtCoords[from];
    const c2 = districtCoords[to];
    if (!c1 || !c2) return 200;

    const R = 6371; // km
    const dLat = (c2[0] - c1[0]) * Math.PI / 180;
    const dLon = (c2[1] - c1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(c1[0] * Math.PI / 180) * Math.cos(c2[0] * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;
    const roadDistance = straightLineDistance * 1.3;

    let ratePerKm = 2.1;
    let minFare = 50;
    if (busType === 'AC') {
      ratePerKm = 3.8;
      minFare = 100;
    } else if (busType === 'Sleeper Class') {
      ratePerKm = 5.5;
      minFare = 200;
    }

    const fare = Math.max(minFare, roadDistance * ratePerKm);
    return Math.round(fare / 10) * 10;
  }

  // Auto fare calculation trigger
  function triggerAutoFare() {
    const from = busFromDistrictInput ? busFromDistrictInput.value : '';
    const to = busToDistrictInput ? busToDistrictInput.value : '';
    const type = busTypeInput ? busTypeInput.value : '';
    if (from && to && type && from !== to) {
      const calculated = calculateClientFare(from, to, type);
      if (busFareInput) {
        busFareInput.value = calculated;
      }
    }
  }

  if (busFromDistrictInput) busFromDistrictInput.addEventListener('change', triggerAutoFare);
  if (busToDistrictInput) busToDistrictInput.addEventListener('change', triggerAutoFare);
  if (busTypeInput) busTypeInput.addEventListener('change', triggerAutoFare);

  // --- Admin Bus Visual Seat Plan Logic ---
  const adminSeatPlanWrapper = document.getElementById('adminSeatPlanWrapper');
  const adminSeatGrid = document.getElementById('adminSeatGrid');
  let currentAvailableSeatsList = [];

  function getSortedSeatsList(busId) {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = ['1', '2', '3', '4'];
    const allSeats = [];
    
    let seatIdx = 0;
    rows.forEach(r => {
      cols.forEach(c => {
        seatIdx++;
        allSeats.push({
          name: `${r}${c}`,
          index: seatIdx
        });
      });
    });

    const seedStr = `${busId || 0}_2026-06-09`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash * 31) + seedStr.charCodeAt(i);
    }

    function seededRandom(i) {
      const x = Math.sin(hash + i) * 10000;
      return x - Math.floor(x);
    }

    allSeats.forEach(seat => {
      seat.score = seededRandom(seat.index);
    });

    allSeats.sort((a, b) => a.score - b.score);
    return allSeats;
  }

  function initAdminSeatPlan() {
    if (!seatPlanInitialized) {
      const busId = busIdInput ? parseInt(busIdInput.value, 10) : 0;
      const bus = allBuses.find(b => b.id === busId);
      
      const allSeats = ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4','E1','E2','E3','E4','F1','F2','F3','F4','G1','G2','G3','G4','H1','H2','H3','H4','I1','I2','I3','I4','J1','J2','J3','J4'];

      if (bus && bus.bookedSeats !== undefined && bus.bookedSeats !== null && bus.bookedSeats.trim() !== '') {
        const booked = bus.bookedSeats.split(',').map(s => s.trim()).filter(Boolean);
        currentAvailableSeatsList = allSeats.filter(s => !booked.includes(s));
      } else {
        let val = parseInt(busAvailableSeatsInput.value, 10);
        if (isNaN(val)) val = 40;
        if (val < 0) val = 0;
        if (val > 40) val = 40;

        const sorted = getSortedSeatsList(busId);
        const bookedCount = 40 - val;
        currentAvailableSeatsList = sorted.slice(bookedCount).map(s => s.name);
      }
      seatPlanInitialized = true;
    }
    
    drawAdminSeatGrid();
  }

  function drawAdminSeatGrid() {
    if (!adminSeatGrid) return;
    adminSeatGrid.innerHTML = '';

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = ['1', '2', '', '3', '4'];

    rows.forEach(row => {
      cols.forEach(col => {
        if (col === '') {
          const space = document.createElement('div');
          space.style.width = '24px';
          adminSeatGrid.appendChild(space);
        } else {
          const seatName = `${row}${col}`;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'admin-seat-btn';
          btn.textContent = seatName;

          const isAvailable = currentAvailableSeatsList.includes(seatName);
          if (isAvailable) {
            btn.style.background = 'var(--accent-gradient)';
            btn.style.color = '#ffffff';
            btn.style.borderColor = 'transparent';
            btn.style.boxShadow = '0 0 8px var(--accent-glow)';
          } else {
            btn.style.background = 'rgba(255, 255, 255, 0.04)';
            btn.style.color = 'rgba(255, 255, 255, 0.85)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.02)';
          }

          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentAvailableSeatsList.includes(seatName)) {
              currentAvailableSeatsList = currentAvailableSeatsList.filter(s => s !== seatName);
            } else {
              currentAvailableSeatsList.push(seatName);
            }
            busAvailableSeatsInput.value = currentAvailableSeatsList.length;
            drawAdminSeatGrid();
            busAvailableSeatsInput.focus();
          });

          adminSeatGrid.appendChild(btn);
        }
      });
    });
  }

  if (busAvailableSeatsInput) {
    busAvailableSeatsInput.addEventListener('focus', () => {
      if (adminSeatPlanWrapper) adminSeatPlanWrapper.style.display = 'block';
      initAdminSeatPlan();
    });
    busAvailableSeatsInput.addEventListener('click', () => {
      if (adminSeatPlanWrapper) adminSeatPlanWrapper.style.display = 'block';
      initAdminSeatPlan();
    });
  }

  // Close admin seat plan if clicking outside the input and wrapper
  document.addEventListener('click', (e) => {
    if (adminSeatPlanWrapper && adminSeatPlanWrapper.style.display === 'block') {
      if (!adminSeatPlanWrapper.contains(e.target) && e.target !== busAvailableSeatsInput) {
        adminSeatPlanWrapper.style.display = 'none';
      }
    }
  });

  // Close admin seat plan when focus moves to another field (Tab navigation support)
  document.addEventListener('focusin', (e) => {
    if (adminSeatPlanWrapper && adminSeatPlanWrapper.style.display === 'block') {
      if (e.target !== busAvailableSeatsInput && !adminSeatPlanWrapper.contains(e.target)) {
        adminSeatPlanWrapper.style.display = 'none';
      }
    }
  });

  // Open modal in Add mode
  if (addBusBtn) {
    addBusBtn.addEventListener('click', () => {
      if (busIdInput) busIdInput.value = '';
      if (busOperatorInput) busOperatorInput.value = '';
      if (busTypeInput) busTypeInput.value = 'Non-AC';
      if (busFromDistrictInput) busFromDistrictInput.value = '';
      if (busToDistrictInput) busToDistrictInput.value = '';
      if (busDepartureTimeInput) busDepartureTimeInput.value = '';
      if (busAvailableSeatsInput) busAvailableSeatsInput.value = '40';
      if (busFareInput) busFareInput.value = '';
      if (busJourneyDateInput) {
        busJourneyDateInput.value = adminBusDateFilter ? adminBusDateFilter.value : '';
      }
      if (busModalTitleText) busModalTitleText.textContent = 'Add New Bus';
      if (adminSeatPlanWrapper) adminSeatPlanWrapper.style.display = 'none';
      seatPlanInitialized = false;
      if (adminBusModal) adminBusModal.style.display = 'flex';
    });
  }

  // Close modal
  if (closeAdminBusModalBtn && adminBusModal) {
    closeAdminBusModalBtn.addEventListener('click', () => {
      adminBusModal.style.display = 'none';
    });
  }

  // Click delegation for Edit/Delete bus buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-bus-row-btn')) {
      const busId = parseInt(e.target.getAttribute('data-id'), 10);
      const bus = allBuses.find(b => b.id === busId);
      if (!bus) return;

      if (busIdInput) busIdInput.value = bus.id;
      if (busOperatorInput) busOperatorInput.value = bus.operator || '';
      if (busTypeInput) busTypeInput.value = bus.busType || 'Non-AC';
      if (busFromDistrictInput) busFromDistrictInput.value = bus.fromDistrict || '';
      if (busToDistrictInput) busToDistrictInput.value = bus.toDistrict || '';
      if (busDepartureTimeInput) busDepartureTimeInput.value = bus.departureTime || '';
      if (busAvailableSeatsInput) busAvailableSeatsInput.value = bus.availableSeats;
      if (busFareInput) busFareInput.value = bus.fare;
      if (busJourneyDateInput) busJourneyDateInput.value = bus.journeyDate || '';
      if (busModalTitleText) busModalTitleText.textContent = 'Edit Bus Info';
      if (adminSeatPlanWrapper) adminSeatPlanWrapper.style.display = 'none';
      seatPlanInitialized = false;
      if (adminBusModal) adminBusModal.style.display = 'flex';
    }

    if (e.target.classList.contains('delete-bus-row-btn')) {
      const busId = parseInt(e.target.getAttribute('data-id'), 10);
      const bus = allBuses.find(b => b.id === busId);
      if (!bus) return;

      if (confirm(`Are you sure you want to delete this bus: "${bus.operator}" (${bus.fromDistrict} ➔ ${bus.toDistrict})?`)) {
        fetch(`${apiBase}/api/bus/${busId}`, {
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
          showToast(`🎉 Bus deleted successfully.`, 'success');
          loadBuses();
        })
        .catch(error => {
          showToast(`❌ Error deleting bus: ${error.message}`, 'danger');
        });
      }
    }
  });

  // Handle bus form submission
  if (adminBusForm) {
    adminBusForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const id = busIdInput ? busIdInput.value : '';
      const operator = busOperatorInput ? busOperatorInput.value.trim() : '';
      const busType = busTypeInput ? busTypeInput.value : '';
      const fromDistrict = busFromDistrictInput ? busFromDistrictInput.value : '';
      const toDistrict = busToDistrictInput ? busToDistrictInput.value : '';
      const departureTime = busDepartureTimeInput ? busDepartureTimeInput.value.trim() : '';
      const availableSeats = busAvailableSeatsInput ? parseInt(busAvailableSeatsInput.value, 10) : 40;
      const fare = busFareInput ? parseInt(busFareInput.value, 10) : 0;
      const journeyDate = busJourneyDateInput ? busJourneyDateInput.value.trim() : '';

      if (!operator || !busType || !fromDistrict || !toDistrict || !departureTime || !journeyDate || isNaN(availableSeats) || isNaN(fare)) {
        showToast('⚠️ Please fill out all required fields.', 'warning');
        return;
      }

      if (fromDistrict === toDistrict) {
        showToast('⚠️ From and To districts cannot be the same.', 'warning');
        return;
      }

      if (availableSeats < 0 || availableSeats > 40) {
        showToast('⚠️ Available seats must be between 0 and 40.', 'warning');
        return;
      }

      if (fare <= 0) {
        showToast('⚠️ Fare must be a positive amount.', 'warning');
        return;
      }

      let bookedSeats = '';
      if (seatPlanInitialized) {
        const allSeats = ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4','E1','E2','E3','E4','F1','F2','F3','F4','G1','G2','G3','G4','H1','H2','H3','H4','I1','I2','I3','I4','J1','J2','J3','J4'];
        const bookedSeatsList = allSeats.filter(s => !currentAvailableSeatsList.includes(s));
        bookedSeats = bookedSeatsList.join(', ');
      } else if (id) {
        const bus = allBuses.find(b => b.id === parseInt(id, 10));
        bookedSeats = bus ? (bus.bookedSeats || '') : '';
      }

      const busData = {
        operator,
        busType,
        fromDistrict,
        toDistrict,
        departureTime,
        journeyDate,
        availableSeats,
        fare,
        bookedSeats
      };

      if (id) {
        busData.id = parseInt(id, 10);
      }

      const url = id ? `${apiBase}/api/bus/${id}` : `${apiBase}/api/bus`;
      const method = id ? 'PUT' : 'POST';

      fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(busData)
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
        showToast(id ? '🎉 Bus updated successfully!' : '🎉 Bus created successfully!', 'success');
        if (adminBusModal) adminBusModal.style.display = 'none';
        loadBuses();
      })
      .catch(error => {
        showToast(`❌ Error saving bus: ${error.message}`, 'danger');
      });
    });
  }

  // ==========================================
  // --- Admin Ticket Booking & Journey History Integration ---
  // ==========================================

  // --- Searchable Dropdown Helper ---
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
        });

        dropdown.appendChild(option);
      });
    }

    input.addEventListener('focus', () => {
      renderDropdown('');
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
      renderDropdown('');
      dropdown.style.display = 'block';
    });
  }

  // Initialize City Selectors
  initSearchableSelect('fromInput', 'fromDropdown');
  initSearchableSelect('toInput', 'toDropdown');

  // Initialize Flatpickr Datepicker
  if (journeyDateInput && typeof flatpickr !== 'undefined') {
    const maxSelectableDate = new Date();
    maxSelectableDate.setDate(maxSelectableDate.getDate() + 10);
    flatpickr(journeyDateInput, {
      dateFormat: "d/m/y",
      allowInput: true,
      placeholder: "dd/mm/yy",
      disableMobile: true,
      minDate: "today",
      maxDate: maxSelectableDate
    });
  }

  let adminBusDatePicker = null;
  if (adminBusDateFilter && typeof flatpickr !== 'undefined') {
    adminBusDatePicker = flatpickr(adminBusDateFilter, {
      dateFormat: "d/m/y",
      allowInput: true,
      placeholder: "Select date to load database...",
      disableMobile: true,
      defaultDate: "today",
      onChange: (selectedDates, dateStr) => {
        toggleClearDateBtn();
        loadBuses();
      }
    });
  }

  if (clearAdminBusDateBtn) {
    clearAdminBusDateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (adminBusDatePicker) {
        adminBusDatePicker.clear();
      } else if (adminBusDateFilter) {
        adminBusDateFilter.value = '';
      }
      toggleClearDateBtn();
      loadBuses();
    });
  }

  if (busJourneyDateInput && typeof flatpickr !== 'undefined') {
    flatpickr(busJourneyDateInput, {
      dateFormat: "d/m/y",
      allowInput: true,
      placeholder: "Select Journey Date...",
      disableMobile: true
    });
  }

  // Destinations Swapper
  if (swapBtn && fromInput && toInput) {
    swapBtn.addEventListener('click', () => {
      const temp = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = temp;
      showToast('🔄 Destinations swapped', 'info');
    });
  }

  // Route Search Form Handler
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

      // Date Range Validation
      const parts = dateVal.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const yearPart = parts[2];
        const year = yearPart.length === 2 ? 2000 + parseInt(yearPart, 10) : parseInt(yearPart, 10);
        
        const selectedDate = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 10);
        maxDate.setHours(23, 59, 59, 999);
        
        if (selectedDate < today) {
          showToast('⚠️ Cannot select a date in the past!', 'warning');
          return;
        }
        if (selectedDate > maxDate) {
          showToast('⚠️ Date must be within the next 10 days!', 'warning');
          return;
        }
      }

      showToast(`🔍 Searching buses from ${fromVal} to ${toVal} on ${dateVal}...`, 'success');
      setTimeout(() => {
        window.location.href = `search_results.html?from=${encodeURIComponent(fromVal)}&to=${encodeURIComponent(toVal)}&date=${encodeURIComponent(dateVal)}`;
      }, 1000);
    });
  }

  // Date Parsing Helper
  function parseJourneyDateTime(dateStr, timeStr) {
    if (!dateStr) return null;
    const tStr = timeStr || "12:00 PM";
    try {
      const dateParts = dateStr.split('/');
      if (dateParts.length !== 3) return null;
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      let year = parseInt(dateParts[2], 10);
      if (year < 100) year += 2000;

      const timeRegex = /^(\d+):(\d+)\s*(AM|PM)$/i;
      const match = tStr.trim().match(timeRegex);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }

      return new Date(year, month, day, hours, minutes, 0, 0);
    } catch (e) {
      return null;
    }
  }

  // Load Admin's personal bookings
  function loadJourneyHistory() {
    if (!userEmail || !journeyHistoryContainer) return;

    fetch(`${apiBase}/api/booking/user?email=${encodeURIComponent(userEmail)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Could not fetch journey history from database.');
        }
        return response.json();
      })
      .then(bookings => {
        journeyHistoryContainer.innerHTML = '';
        if (bookings.length === 0) {
          journeyHistoryContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1.5rem 0; font-size: 0.9rem;">No journeys booked yet.</div>';
          return;
        }

        bookings.forEach(booking => {
          try {
            const card = document.createElement('div');
            card.style.background = 'rgba(255, 255, 255, 0.02)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderRadius = 'var(--border-radius-sm)';
            card.style.padding = '1rem';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '0.75rem';
            card.style.transition = 'all var(--transition-fast)';

            // Hover effect
            card.addEventListener('mouseenter', () => {
              card.style.borderColor = 'var(--accent-secondary)';
              card.style.background = 'rgba(6, 182, 212, 0.05)';
            });
            card.addEventListener('mouseleave', () => {
              card.style.borderColor = 'var(--border-color)';
              card.style.background = 'rgba(255, 255, 255, 0.02)';
            });

            // Header: Bus Name & Payment Method Badge
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            
            const busNameEl = document.createElement('span');
            busNameEl.style.fontWeight = '700';
            busNameEl.style.color = 'var(--text-primary)';
            busNameEl.style.fontSize = '0.95rem';
            busNameEl.textContent = booking.busName;

            const paymentBadge = document.createElement('span');
            paymentBadge.style.fontSize = '0.75rem';
            paymentBadge.style.fontWeight = '600';
            paymentBadge.style.padding = '0.2rem 0.6rem';
            paymentBadge.style.borderRadius = '4px';
            paymentBadge.style.textTransform = 'uppercase';
            
            const payMethod = (booking.paymentMethod || '').toLowerCase();
            if (payMethod === 'bkash') {
              paymentBadge.style.background = 'rgba(219, 39, 119, 0.15)';
              paymentBadge.style.color = '#db2777';
              paymentBadge.textContent = 'bKash';
            } else if (payMethod === 'nagad') {
              paymentBadge.style.background = 'rgba(249, 115, 22, 0.15)';
              paymentBadge.style.color = '#f97316';
              paymentBadge.textContent = 'Nagad';
            } else if (payMethod === 'rocket') {
              paymentBadge.style.background = 'rgba(147, 51, 234, 0.15)';
              paymentBadge.style.color = '#a855f7';
              paymentBadge.textContent = 'Rocket';
            } else {
              paymentBadge.style.background = 'rgba(59, 130, 246, 0.15)';
              paymentBadge.style.color = '#3b82f6';
              paymentBadge.textContent = booking.paymentMethod || 'Card';
            }

            header.appendChild(busNameEl);
            header.appendChild(paymentBadge);
            card.appendChild(header);

            // Divider
            const hr = document.createElement('div');
            hr.style.height = '1px';
            hr.style.borderBottom = '1px dashed rgba(255, 255, 255, 0.08)';
            card.appendChild(hr);

            // Details grid
            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = '1.2fr 0.8fr';
            grid.style.gap = '0.5rem';
            grid.style.fontSize = '0.82rem';

            // Route
            const routeVal = document.createElement('div');
            routeVal.style.color = 'var(--text-primary)';
            routeVal.style.fontWeight = '500';
            routeVal.innerHTML = `<span style="color: var(--text-secondary);">Route:</span> ${booking.fromDistrict} ➔ ${booking.toDistrict}`;
            grid.appendChild(routeVal);

            // Seats
            const seatsVal = document.createElement('div');
            seatsVal.style.color = 'var(--text-primary)';
            seatsVal.style.fontWeight = '500';
            seatsVal.style.textAlign = 'right';
            seatsVal.innerHTML = `<span style="color: var(--text-secondary);">Seats:</span> <strong style="color: var(--accent-secondary);">${booking.seats}</strong>`;
            grid.appendChild(seatsVal);

            // Journey Date
            const dateVal = document.createElement('div');
            dateVal.style.color = 'var(--text-primary)';
            dateVal.style.fontWeight = '500';
            dateVal.innerHTML = `<span style="color: var(--text-secondary);">Journey Date:</span> ${booking.journeyDate}`;
            grid.appendChild(dateVal);

            // Ticket Issue Time
            const issueTimeVal = document.createElement('div');
            issueTimeVal.style.color = 'var(--text-secondary)';
            issueTimeVal.style.textAlign = 'right';
            issueTimeVal.style.fontSize = '0.78rem';
            
            if (booking.ticketIssuingTime) {
              const issueDate = new Date(booking.ticketIssuingTime);
              const formattedTime = issueDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
              issueTimeVal.innerHTML = `<span style="color: var(--text-muted); font-size: 0.72rem;">Issued:</span> ${formattedTime}`;
            } else {
              issueTimeVal.textContent = '';
            }
            grid.appendChild(issueTimeVal);

            card.appendChild(grid);

            // Cancel Booking Button
            const cancelBtnContainer = document.createElement('div');
            cancelBtnContainer.style.marginTop = '0.75rem';
            cancelBtnContainer.style.display = 'flex';
            cancelBtnContainer.style.justifyContent = 'flex-end';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'action-btn btn-secondary';
            cancelBtn.style.padding = '0.4rem 1.2rem';
            cancelBtn.style.fontSize = '0.8rem';
            cancelBtn.style.height = '34px';
            cancelBtn.style.borderRadius = 'var(--border-radius-sm)';
            cancelBtn.style.background = 'rgba(239, 68, 68, 0.1)';
            cancelBtn.style.color = 'var(--danger)';
            cancelBtn.style.border = '1px solid rgba(239, 68, 68, 0.25)';
            cancelBtn.style.fontWeight = '600';
            cancelBtn.style.cursor = 'pointer';
            cancelBtn.style.transition = 'all var(--transition-fast)';
            cancelBtn.textContent = 'Cancel Booking';

            const depTime = booking.departureTime || '12:00 PM';
            const journeyTime = parseJourneyDateTime(booking.journeyDate, depTime);
            const now = new Date();
            let isJourneyCompleted = false;

            if (booking.status === "Cancelled") {
              cancelBtn.disabled = true;
              cancelBtn.style.opacity = '0.85';
              cancelBtn.style.cursor = 'not-allowed';
              cancelBtn.style.background = 'rgba(239, 68, 68, 0.1)';
              cancelBtn.style.color = 'var(--danger)';
              cancelBtn.style.borderColor = 'rgba(239, 68, 68, 0.25)';
              cancelBtn.textContent = 'Cancelled';
            } else if (journeyTime && journeyTime <= now) {
              isJourneyCompleted = true;
              cancelBtn.disabled = true;
              cancelBtn.style.opacity = '0.85';
              cancelBtn.style.cursor = 'not-allowed';
              cancelBtn.style.background = 'rgba(255, 255, 255, 0.08)';
              cancelBtn.style.color = 'rgba(255, 255, 255, 0.65)';
              cancelBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              cancelBtn.textContent = 'Journey Completed';
            } else {
              cancelBtn.addEventListener('mouseenter', () => {
                cancelBtn.style.background = 'var(--danger)';
                cancelBtn.style.color = '#ffffff';
                cancelBtn.style.borderColor = 'var(--danger)';
                cancelBtn.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.4)';
              });
              cancelBtn.addEventListener('mouseleave', () => {
                cancelBtn.style.background = 'rgba(239, 68, 68, 0.1)';
                cancelBtn.style.color = 'var(--danger)';
                cancelBtn.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                cancelBtn.style.boxShadow = 'none';
              });
            }

            cancelBtn.addEventListener('click', () => {
              const depTime = booking.departureTime || '12:00 PM';
              const journeyTime = parseJourneyDateTime(booking.journeyDate, depTime);
              if (journeyTime) {
                const now = new Date();
                const timeDiffMs = journeyTime - now;
                const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

                if (timeDiffHours < 12) {
                  const cancelWarningModal = document.getElementById('cancelWarningModal');
                  if (cancelWarningModal) {
                    cancelWarningModal.style.display = 'flex';
                  } else {
                    alert("Cancellation is only allowed at least 12 hours before the journey departure time.");
                  }
                  showToast("❌ Cancellation is only allowed at least 12 hours before departure.", "danger");
                  return;
                }
              }

              bookingToCancel = booking;
              const cancelConfirmModal = document.getElementById('cancelConfirmModal');
              const cancelConfirmMessage = document.getElementById('cancelConfirmMessage');
              if (cancelConfirmModal) {
                if (cancelConfirmMessage) {
                  cancelConfirmMessage.textContent = `Are you sure you want to cancel your booking for ${booking.busName} (${booking.seats})?`;
                }
                cancelConfirmModal.style.display = 'flex';
              } else {
                if (confirm(`Are you sure you want to cancel your booking for ${booking.busName} (${booking.seats})?`)) {
                  executeCancellation(booking.id);
                }
              }
            });

            cancelBtnContainer.appendChild(cancelBtn);

            // Add Rate & Review or Reviewed button if completed
            if (isJourneyCompleted) {
              if (reviewedSet.has(booking.id)) {
                // Render "Reviewed" button (clickable)
                const reviewedBtn = document.createElement('button');
                reviewedBtn.type = 'button';
                reviewedBtn.className = 'action-btn btn-secondary';
                reviewedBtn.style.padding = '0.4rem 1.2rem';
                reviewedBtn.style.fontSize = '0.8rem';
                reviewedBtn.style.height = '34px';
                reviewedBtn.style.borderRadius = 'var(--border-radius-sm)';
                reviewedBtn.style.background = 'rgba(16, 185, 129, 0.1)';
                reviewedBtn.style.color = '#10b981';
                reviewedBtn.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                reviewedBtn.style.fontWeight = '600';
                reviewedBtn.style.marginLeft = '0.5rem';
                reviewedBtn.style.cursor = 'pointer';
                reviewedBtn.style.transition = 'all var(--transition-fast)';
                reviewedBtn.textContent = 'Reviewed';

                reviewedBtn.addEventListener('mouseenter', () => {
                  reviewedBtn.style.background = 'rgba(16, 185, 129, 0.2)';
                });
                reviewedBtn.addEventListener('mouseleave', () => {
                  reviewedBtn.style.background = 'rgba(16, 185, 129, 0.1)';
                });

                reviewedBtn.addEventListener('click', () => {
                  openViewReviewModal(booking);
                });

                cancelBtnContainer.appendChild(reviewedBtn);
              } else {
                // Render clickable "Rate & Review" button
                const reviewBtn = document.createElement('button');
                reviewBtn.type = 'button';
                reviewBtn.className = 'action-btn btn-primary';
                reviewBtn.style.padding = '0.4rem 1.2rem';
                reviewBtn.style.fontSize = '0.8rem';
                reviewBtn.style.height = '34px';
                reviewBtn.style.borderRadius = 'var(--border-radius-sm)';
                reviewBtn.style.marginLeft = '0.5rem';
                reviewBtn.style.background = 'rgba(6, 182, 212, 0.1)';
                reviewBtn.style.color = 'var(--accent-secondary)';
                reviewBtn.style.borderColor = 'rgba(6, 182, 212, 0.25)';
                reviewBtn.style.fontWeight = '600';
                reviewBtn.style.cursor = 'pointer';
                reviewBtn.style.transition = 'all var(--transition-fast)';
                reviewBtn.textContent = 'Rate & Review';

                reviewBtn.addEventListener('mouseenter', () => {
                  reviewBtn.style.background = 'var(--accent-secondary)';
                  reviewBtn.style.color = '#0d1224';
                  reviewBtn.style.borderColor = 'var(--accent-secondary)';
                });
                reviewBtn.addEventListener('mouseleave', () => {
                  reviewBtn.style.background = 'rgba(6, 182, 212, 0.1)';
                  reviewBtn.style.color = 'var(--accent-secondary)';
                  reviewBtn.style.borderColor = 'rgba(6, 182, 212, 0.25)';
                });

                reviewBtn.addEventListener('click', () => {
                  openReviewModal(booking);
                });

                cancelBtnContainer.appendChild(reviewBtn);
              }
            }

            card.appendChild(cancelBtnContainer);
            journeyHistoryContainer.appendChild(card);
          } catch (err) {
            console.error('Error rendering journey booking card:', err, booking);
          }
        });
      })
      .catch(error => {
        console.error('Error fetching journey history:', error);
        journeyHistoryContainer.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 1rem 0; font-size: 0.9rem;">❌ Failed to load journey history.</div>`;
      });
  }

  // Execute cancellation request
  function executeCancellation(bookingId) {
    if (!bookingId) return;
    
    fetch(`${apiBase}/api/booking/cancel/${bookingId}`, {
      method: 'POST'
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => { throw new Error(err.message || "Failed to cancel booking."); });
      }
      return res.json();
    })
    .then(data => {
      const cancellationModal = document.getElementById('cancellationModal');
      if (cancellationModal) {
        cancellationModal.style.display = 'flex';
      } else {
        alert("Your Cancellation is Successful ! Your payment for ticket booking will be refunded within 12 hours.");
      }
      loadJourneyHistory();
      loadBookings();
    })
    .catch(err => {
      console.error('Cancellation error:', err);
      showToast(`❌ Cancellation failed: ${err.message}`, 'danger');
    });
  }

  // Wire cancellation modal actions
  const cancellationModal = document.getElementById('cancellationModal');
  const closeCancellationModalBtn = document.getElementById('closeCancellationModalBtn');
  if (closeCancellationModalBtn && cancellationModal) {
    closeCancellationModalBtn.addEventListener('click', () => {
      cancellationModal.style.display = 'none';
      const method = lastCancelledPaymentMethod || "Card";
      showToast(`Your refunded amount is sent to the corresponding account (through which you paid via ${method}).`, 'success');
    });
  }

  const confirmCancellationBtn = document.getElementById('confirmCancellationBtn');
  if (confirmCancellationBtn) {
    confirmCancellationBtn.addEventListener('click', () => {
      const cancelConfirmModal = document.getElementById('cancelConfirmModal');
      if (cancelConfirmModal) {
        cancelConfirmModal.style.display = 'none';
      }
      if (bookingToCancel) {
        lastCancelledPaymentMethod = bookingToCancel.paymentMethod;
        executeCancellation(bookingToCancel.id);
        bookingToCancel = null;
      }
    });
  }

  const closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');
  if (closeConfirmModalBtn) {
    closeConfirmModalBtn.addEventListener('click', () => {
      const cancelConfirmModal = document.getElementById('cancelConfirmModal');
      if (cancelConfirmModal) {
        cancelConfirmModal.style.display = 'none';
      }
      bookingToCancel = null;
    });
  }

  const closeWarningModalBtn = document.getElementById('closeWarningModalBtn');
  if (closeWarningModalBtn) {
    closeWarningModalBtn.addEventListener('click', () => {
      const cancelWarningModal = document.getElementById('cancelWarningModal');
      if (cancelWarningModal) {
        cancelWarningModal.style.display = 'none';
      }
    });
  }

  // Load journey history initially
  loadJourneyHistory();

  // --- Admin Reviews Audit board (Paginated & Username-mapped) ---
  // Expose loadReviews globally so it can be called initially
  window.loadReviews = loadReviews;

  function loadReviews() {
    if (!reviewsTableBody) return;
    reviewsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">Loading journey reviews...</td></tr>';

    fetch(`${apiBase}/api/review`)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load reviews. Status: ${response.status}`);
        return response.json();
      })
      .then(reviews => {
        allReviews = reviews;
        reviewCurrentPage = 1;
        renderReviewsPage();
      })
      .catch(error => {
        console.error('[ReviewsBoard] Load error:', error);
        reviewsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 1.5rem;">❌ Error loading reviews: ${error.message}</td></tr>`;
      });
  }

  function renderReviewsPage() {
    if (!reviewsTableBody) return;

    if (allReviews.length === 0) {
      reviewsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">No reviews submitted yet.</td></tr>';
      if (reviewsPageIndicator) reviewsPageIndicator.textContent = 'Page 1 of 1';
      if (prevReviewsBtn) prevReviewsBtn.disabled = true;
      if (nextReviewsBtn) nextReviewsBtn.disabled = true;
      return;
    }

    const totalPages = Math.ceil(allReviews.length / reviewPageSize);
    if (reviewCurrentPage < 1) reviewCurrentPage = 1;
    if (reviewCurrentPage > totalPages) reviewCurrentPage = totalPages;

    // Update pagination controls
    if (prevReviewsBtn) prevReviewsBtn.disabled = (reviewCurrentPage === 1);
    if (nextReviewsBtn) nextReviewsBtn.disabled = (reviewCurrentPage === totalPages);
    if (reviewsPageIndicator) reviewsPageIndicator.textContent = `Page ${reviewCurrentPage} of ${totalPages}`;

    reviewsTableBody.innerHTML = '';
    const startIndex = (reviewCurrentPage - 1) * reviewPageSize;
    const pageReviews = allReviews.slice(startIndex, startIndex + reviewPageSize);

    pageReviews.forEach((review, idx) => {
      try {
        const tr = document.createElement('tr');
        
        // Map user email to username safely
        let displayUsername = review.userEmail || 'Unknown User';
        if (review.userEmail && allRegisteredUsers && allRegisteredUsers.length > 0) {
          const matchedUser = allRegisteredUsers.find(u => u.email && u.email.toLowerCase() === review.userEmail.toLowerCase());
          if (matchedUser) {
            displayUsername = matchedUser.username;
          }
        }

        // Build rating star string (★★★★★ format)
        const ratingVal = review.rating || 0;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
          if (i <= ratingVal) {
            starsHtml += '<span style="color: #eab308; font-size: 1.1rem; text-shadow: 0 0 5px rgba(234, 179, 8, 0.4);">★</span>';
          } else {
            starsHtml += '<span style="color: rgba(255,255,255,0.15); font-size: 1.1rem;">★</span>';
          }
        }

        // Format timestamp
        let createdDate = 'N/A';
        if (review.createdAt) {
          const d = new Date(review.createdAt);
          createdDate = d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        }

        tr.innerHTML = `
          <td style="color: var(--text-primary); font-weight: 500;">${escapeHtml(displayUsername)}</td>
          <td><span class="role-badge user">${escapeHtml(review.busOperator)}</span></td>
          <td>${escapeHtml(review.route)}</td>
          <td>${escapeHtml(review.journeyDate)}</td>
          <td style="white-space: nowrap;">${starsHtml}</td>
          <td style="max-width: 280px; word-wrap: break-word; white-space: normal; color: var(--text-primary);">${escapeHtml(review.comment)}</td>
          <td>${createdDate}</td>
        `;
        reviewsTableBody.appendChild(tr);
      } catch (err) {
        console.error(`[ReviewsBoard] Error rendering review index ${startIndex + idx}:`, err, review);
      }
    });
  }

  // Bind pagination buttons
  if (prevReviewsBtn) {
    prevReviewsBtn.addEventListener('click', () => {
      if (reviewCurrentPage > 1) {
        reviewCurrentPage--;
        renderReviewsPage();
      }
    });
  }

  if (nextReviewsBtn) {
    nextReviewsBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allReviews.length / reviewPageSize);
      if (reviewCurrentPage < totalPages) {
        reviewCurrentPage++;
        renderReviewsPage();
      }
    });
  }

  // Bind Toggle Display Button
  if (viewReviewsBtn && adminReviewsContainer) {
    viewReviewsBtn.addEventListener('click', () => {
      if (adminReviewsContainer.style.display === 'none') {
        adminReviewsContainer.style.display = 'block';
        viewReviewsBtn.textContent = 'Hide Reviews';
      } else {
        adminReviewsContainer.style.display = 'none';
        viewReviewsBtn.textContent = 'View Reviews';
      }
    });
  }

  // Fetch reviewed booking IDs for the current user, then load journey history
  function fetchReviewedAndLoadHistory() {
    if (!userEmail) return;
    fetch(`${apiBase}/api/review/user/reviewed?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.ok ? res.json() : [])
      .then(reviewedBookingIds => {
        reviewedSet = new Set(reviewedBookingIds);
        loadJourneyHistory();
      })
      .catch(err => {
        console.error('Error fetching reviewed booking IDs:', err);
        loadJourneyHistory();
      });
  }
  window.fetchReviewedAndLoadHistory = fetchReviewedAndLoadHistory;

  // --- Rating & Review Modal Interactivity ---
  const reviewModal = document.getElementById('reviewModal');
  const reviewBusDetails = document.getElementById('reviewBusDetails');
  const reviewCommentInput = document.getElementById('reviewCommentInput');
  const submitReviewBtn = document.getElementById('submitReviewBtn');
  const closeReviewModalBtn = document.getElementById('closeReviewModalBtn');
  const starContainer = document.getElementById('starContainer');
  let selectedRating = 0;
  let activeReviewBooking = null;

  // Star hover and click handlers
  if (starContainer) {
    const stars = starContainer.querySelectorAll('.star-rating');
    
    stars.forEach(star => {
      // Hover highlight
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.getAttribute('data-value'), 10);
        highlightStars(val);
      });

      // Mouse leave (restore selected rating)
      star.addEventListener('mouseleave', () => {
        highlightStars(selectedRating);
      });

      // Click to select
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.getAttribute('data-value'), 10);
        highlightStars(selectedRating);
      });
    });

    function highlightStars(count) {
      stars.forEach(s => {
        const val = parseInt(s.getAttribute('data-value'), 10);
        if (val <= count) {
          s.style.color = '#eab308'; // Gold star color
        } else {
          s.style.color = 'rgba(255, 255, 255, 0.15)'; // Grey star color
        }
      });
    }
  }

  function openReviewModal(booking) {
    if (!reviewModal) return;
    activeReviewBooking = booking;
    selectedRating = 0;
    if (reviewCommentInput) reviewCommentInput.value = '';
    
    if (reviewBusDetails) {
      reviewBusDetails.innerHTML = `<strong style="color: var(--accent-secondary);">${booking.busName}</strong><br>Route: ${booking.fromDistrict} ➔ ${booking.toDistrict}<br>Journey Date: ${booking.journeyDate}`;
    }
    
    // Reset stars
    if (starContainer) {
      const stars = starContainer.querySelectorAll('.star-rating');
      stars.forEach(s => s.style.color = 'rgba(255, 255, 255, 0.15)');
    }
    
    reviewModal.style.display = 'flex';
  }

  if (closeReviewModalBtn && reviewModal) {
    closeReviewModalBtn.addEventListener('click', () => {
      reviewModal.style.display = 'none';
      activeReviewBooking = null;
    });
  }

  if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', () => {
      if (!activeReviewBooking) return;
      
      const rating = selectedRating;
      const comment = reviewCommentInput ? reviewCommentInput.value.trim() : '';
      
      if (rating === 0) {
        showToast('⚠️ Please select a rating (1 to 5 stars).', 'warning');
        return;
      }
      
      if (!comment) {
        showToast('⚠️ Please write a review comment.', 'warning');
        return;
      }

      const reviewData = {
        bookingId: activeReviewBooking.id,
        rating: rating,
        comment: comment
      };

      submitReviewBtn.disabled = true;
      submitReviewBtn.textContent = 'Submitting...';

      fetch(`${apiBase}/api/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
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
        showToast('🎉 Thank you! Your review has been submitted successfully.', 'success');
        if (reviewModal) reviewModal.style.display = 'none';
        
        // Refresh reviewed booking list and reload history & reviews board
        fetchReviewedAndLoadHistory();
        if (typeof loadReviews === 'function') {
          loadReviews();
        }
      })
      .catch(error => {
        showToast(`❌ Error: ${error.message}`, 'danger');
      })
      .finally(() => {
        submitReviewBtn.disabled = false;
        submitReviewBtn.textContent = 'Submit Review';
        activeReviewBooking = null;
      });
    });
  }

  // --- Read-Only View Review Modal ---
  const viewReviewModal = document.getElementById('viewReviewModal');
  const viewReviewBusDetails = document.getElementById('viewReviewBusDetails');
  const viewReviewCommentInput = document.getElementById('viewReviewCommentInput');
  const closeViewReviewModalBtn = document.getElementById('closeViewReviewModalBtn');
  const viewStarContainer = document.getElementById('viewStarContainer');

  function openViewReviewModal(booking) {
    if (!viewReviewModal) return;
    
    if (viewReviewBusDetails) {
      viewReviewBusDetails.innerHTML = `<strong style="color: var(--accent-secondary);">${booking.busName}</strong><br>Route: ${booking.fromDistrict} ➔ ${booking.toDistrict}<br>Journey Date: ${booking.journeyDate}`;
    }
    
    if (viewReviewCommentInput) {
      viewReviewCommentInput.value = 'Loading review details...';
    }
    
    // Reset stars
    if (viewStarContainer) {
      const stars = viewStarContainer.querySelectorAll('.view-star');
      stars.forEach(s => s.style.color = 'rgba(255, 255, 255, 0.15)');
    }
    
    viewReviewModal.style.display = 'flex';
    
    fetch(`${apiBase}/api/review/booking/${booking.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Could not fetch review details.');
        return res.json();
      })
      .then(review => {
        if (viewReviewCommentInput) {
          viewReviewCommentInput.value = review.comment || '';
        }
        if (viewStarContainer) {
          const stars = viewStarContainer.querySelectorAll('.view-star');
          const ratingVal = review.rating || 0;
          stars.forEach(s => {
            const val = parseInt(s.getAttribute('data-value'), 10);
            if (val <= ratingVal) {
              s.style.color = '#eab308'; // Gold star color
            } else {
              s.style.color = 'rgba(255, 255, 255, 0.15)'; // Grey star color
            }
          });
        }
      })
      .catch(err => {
        console.error('Error fetching review:', err);
        if (viewReviewCommentInput) {
          viewReviewCommentInput.value = 'Failed to load review: ' + err.message;
        }
      });
  }

  if (closeViewReviewModalBtn && viewReviewModal) {
    closeViewReviewModalBtn.addEventListener('click', () => {
      viewReviewModal.style.display = 'none';
    });
  }
});

