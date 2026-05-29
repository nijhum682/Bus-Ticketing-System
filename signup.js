document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const signupForm = document.getElementById('signupForm');
  const passwordInput = document.getElementById('passwordInput');
  const passwordToggleBtn = document.getElementById('passwordToggleBtn');
  const eyeIcon = document.getElementById('eyeIcon');
  const signInRedirectBtn = document.getElementById('signInRedirectBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // --- Password Visibility Toggle ---
  if (passwordToggleBtn && passwordInput && eyeIcon) {
    passwordToggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      
      // Update SVG path for Eye Icon based on visibility state
      if (isPassword) {
        // Change to Eye Off (Slashed) SVG
        eyeIcon.innerHTML = `
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
        passwordToggleBtn.setAttribute('aria-label', 'Hide password');
      } else {
        // Change to Eye On SVG
        eyeIcon.innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        `;
        passwordToggleBtn.setAttribute('aria-label', 'Show password');
      }
    });
  }

  // --- Redirect Handlers ---
  if (signInRedirectBtn) {
    signInRedirectBtn.addEventListener('click', () => {
      showToast('🔑 Sign In portal is coming in the next development phase!', 'info');
    });
  }

  // --- Form Validation and Submission ---
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Retrieve field values
      const name = document.getElementById('nameInput').value.trim();
      const username = document.getElementById('usernameInput').value.trim();
      const password = document.getElementById('passwordInput').value.trim();
      const email = document.getElementById('emailInput').value.trim();
      const roll = document.getElementById('rollInput').value.trim();
      const batch = document.getElementById('batchInput').value.trim();
      const department = document.getElementById('deptInput').value.trim();
      const university = document.getElementById('uniInput').value.trim();
      const phone = document.getElementById('phoneInput').value.trim();

      // Basic empty field verification
      if (!name || !username || !password || !email || !roll || !batch || !department || !university || !phone) {
        showToast('⚠️ Please fill out all registry fields.', 'warning');
        return;
      }

      // Email Format Check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('⚠️ Please enter a valid email address.', 'warning');
        return;
      }

      // Phone Number Format Check (Basic length check)
      if (phone.length < 7 || isNaN(phone.replace(/[+\-\s()]/g, ''))) {
        showToast('⚠️ Please enter a valid database contact phone number.', 'warning');
        return;
      }

      // Success Scenario
      showToast(`🎉 Registration successful! Welcome to SmartTransit database system, ${name}!`, 'success');
      
      // Reset form
      signupForm.reset();

      // Redirect back to Landing/Home page after toast notification display
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2500);
    });
  }

  // --- Toast Notification Helper ---
  let toastTimeout;
  function showToast(message, type = 'success') {
    if (!toast || !toastMessage) return;

    clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    
    const toastIcon = toast.querySelector('.toast-icon');
    
    // Set color parameters and icons based on alert level
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
