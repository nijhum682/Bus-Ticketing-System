document.addEventListener('DOMContentLoaded', () => {
  let bookingToCancel = null;
  let lastCancelledPaymentMethod = "";
  // --- DOM Elements ---
  const nameDisplay = document.getElementById('nameDisplay');
  const emailDisplay = document.getElementById('emailDisplay');
  const phoneDisplay = document.getElementById('phoneDisplay');
  const presAddressDisplay = document.getElementById('presAddressDisplay');
  const permAddressDisplay = document.getElementById('permAddressDisplay');
  const genderDisplay = document.getElementById('genderDisplay');
  const professionDisplay = document.getElementById('professionDisplay');
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

  // --- API Setup & Fetch Profile ---
  const apiBase = (window.location.port === '5080' || window.location.port === '7234')
    ? ''
    : `${window.location.protocol === 'file:' ? 'http:' : window.location.protocol}//${window.location.hostname === 'file:' || !window.location.hostname ? 'localhost' : window.location.hostname}:5080`;

  let currentUser = null;

  function loadProfile() {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    fetch(`${apiBase}/api/auth/profile?email=${encodeURIComponent(email)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Could not fetch user profile details from database.');
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

  loadProfile();

  // --- Journey History ---
  const journeyHistoryContainer = document.getElementById('journeyHistoryContainer');

  function loadJourneyHistory() {
    if (!userEmail || !journeyHistoryContainer) return;

    fetch(`${apiBase}/api/review/user/reviewed?email=${encodeURIComponent(userEmail)}`)
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(reviewedBookingIds => {
        const reviewedSet = new Set(reviewedBookingIds);

        return fetch(`${apiBase}/api/booking/user?email=${encodeURIComponent(userEmail)}`)
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
                  paymentBadge.style.color = '#db2777'; // Pink Bkash color
                  paymentBadge.textContent = 'bKash';
                } else if (payMethod === 'nagad') {
                  paymentBadge.style.background = 'rgba(249, 115, 22, 0.15)';
                  paymentBadge.style.color = '#f97316'; // Orange Nagad color
                  paymentBadge.textContent = 'Nagad';
                } else if (payMethod === 'rocket') {
                  paymentBadge.style.background = 'rgba(147, 51, 234, 0.15)';
                  paymentBadge.style.color = '#a855f7'; // Purple Rocket color
                  paymentBadge.textContent = 'Rocket';
                } else {
                  paymentBadge.style.background = 'rgba(59, 130, 246, 0.15)';
                  paymentBadge.style.color = '#3b82f6'; // Blue Card color
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
                  // Format nice short date & time
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

                // Buttons Container
                const cancelBtnContainer = document.createElement('div');
                cancelBtnContainer.style.marginTop = '0.75rem';
                cancelBtnContainer.style.display = 'flex';
                cancelBtnContainer.style.justifyContent = 'flex-end';
                cancelBtnContainer.style.alignItems = 'center';

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
                } else if (booking.status === "Completed" || (journeyTime && journeyTime <= now)) {
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
                  // Client-side 12-hour limit check
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

                  // Custom Confirm Dialog
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
          });
      })
      .catch(error => {
        console.error('Error fetching journey history:', error);
        journeyHistoryContainer.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 1rem 0; font-size: 0.9rem;">❌ Failed to load journey history.</div>`;
      });
  }

  loadJourneyHistory();

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

  // --- Searchable Select Dropdown with 64 Districts ---
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

    // Close dropdown on click outside
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

  initSearchableSelect('fromInput', 'fromDropdown');
  initSearchableSelect('toInput', 'toDropdown');

  // 0. Initialize Flatpickr datepicker with dd/mm/yy format
  if (journeyDateInput && typeof flatpickr !== 'undefined') {
    const maxSelectableDate = new Date();
    maxSelectableDate.setDate(maxSelectableDate.getDate() + 10);
    flatpickr(journeyDateInput, {
      dateFormat: "d/m/y", // dd/mm/yy format (2-digit year)
      allowInput: true,
      placeholder: "dd/mm/yy",
      disableMobile: true,
      minDate: "today",
      maxDate: maxSelectableDate
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

      // Validate date is not in the past and not more than 10 days in the future
      const parts = dateVal.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-based month
        const yearPart = parts[2];
        const year = yearPart.length === 2 ? 2000 + parseInt(yearPart, 10) : parseInt(yearPart, 10);
        
        const selectedDate = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // start of today
        
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
      
      // Redirect to separate search results page
      setTimeout(() => {
        window.location.href = `search_results.html?from=${encodeURIComponent(fromVal)}&to=${encodeURIComponent(toVal)}&date=${encodeURIComponent(dateVal)}`;
      }, 1000);
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

  // --- Cancellation Modal Close ---
  const cancellationModal = document.getElementById('cancellationModal');
  const closeCancellationModalBtn = document.getElementById('closeCancellationModalBtn');
  if (closeCancellationModalBtn && cancellationModal) {
    closeCancellationModalBtn.addEventListener('click', () => {
      cancellationModal.style.display = 'none';
      const method = lastCancelledPaymentMethod || "Card";
      showToast(`Your refunded amount is sent to the corresponding account (through which you paid via ${method}).`, 'success');
    });
  }

  // --- Cancellation Helpers & Event Handlers ---
  function executeCancellation(bookingId) {
    if (!bookingId) return;
    
    // Call backend API to cancel
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
    })
    .catch(err => {
      console.error('Cancellation error:', err);
      showToast(`❌ Cancellation failed: ${err.message}`, 'danger');
    });
  }

  // Yes, Confirm Cancellation
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

  // No, Keep Booking
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

  // Close Warning Modal
  const closeWarningModalBtn = document.getElementById('closeWarningModalBtn');
  if (closeWarningModalBtn) {
    closeWarningModalBtn.addEventListener('click', () => {
      const cancelWarningModal = document.getElementById('cancelWarningModal');
      if (cancelWarningModal) {
        cancelWarningModal.style.display = 'none';
      }
    });
  }

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
        loadJourneyHistory(); // Reload journey history to show the "Reviewed" label
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

