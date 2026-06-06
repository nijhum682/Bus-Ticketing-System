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
      window.location.href = 'signin.html';
    });
  }

  // --- Form Validation and Submission ---
  if (signupForm) {
    // Clear error highlights on input
    const inputs = signupForm.querySelectorAll('.form-input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('error-field');
      });
    });

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Reset all error states
      inputs.forEach(input => input.classList.remove('error-field'));

      // Retrieve values
      const name = document.getElementById('nameInput').value.trim();
      const username = document.getElementById('usernameInput').value.trim();
      const passwordInputEl = document.getElementById('passwordInput');
      const password = passwordInputEl.value;
      const emailInputEl = document.getElementById('emailInput');
      const email = emailInputEl.value.trim();
      const phoneInputEl = document.getElementById('phoneInput');
      const phone = phoneInputEl.value.trim();
      
      const presArea = document.getElementById('presAreaInput').value.trim();
      const presUpazilla = document.getElementById('presUpazillaInput').value.trim();
      const presDistrict = document.getElementById('presDistrictInput').value.trim();
      const presDivision = document.getElementById('presDivisionInput').value.trim();
      
      const permArea = document.getElementById('permAreaInput').value.trim();
      const permUpazilla = document.getElementById('permUpazillaInput').value.trim();
      const permDistrict = document.getElementById('permDistrictInput').value.trim();
      const permDivision = document.getElementById('permDivisionInput').value.trim();
      
      const genderChecked = signupForm.querySelector('input[name="gender"]:checked');
      const professionInputEl = document.getElementById('professionInput');
      const profession = professionInputEl.value.trim();

      // Basic empty field verification
      let hasEmpty = false;
      inputs.forEach(input => {
        if (!input.value.trim() && input.type !== 'radio') {
          input.classList.add('error-field');
          hasEmpty = true;
        }
      });
      
      if (hasEmpty) {
        showToast('⚠️ Please fill out all registry fields.', 'warning');
        return;
      }

      if (!genderChecked) {
        showToast('⚠️ Please select your Gender.', 'warning');
        return;
      }

      // Password Complexity Validation (At least 8 chars, 1 number, 1 special char, 1 uppercase, 1 lowercase)
      const hasMinLength = password.length >= 8;
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);

      if (!hasMinLength || !hasNumber || !hasSpecial || !hasUpper || !hasLower) {
        passwordInputEl.classList.add('error-field');
        showToast('⚠️ Password must be at least 8 characters long, containing a number, a special character, a capital letter, and a small letter.', 'danger');
        return;
      }

      // Email Format Check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailInputEl.classList.add('error-field');
        showToast('⚠️ Please enter a valid email address.', 'warning');
        return;
      }

      // Phone Number Format Check
      if (phone.length < 7 || isNaN(phone.replace(/[+\-\s()]/g, ''))) {
        phoneInputEl.classList.add('error-field');
        showToast('⚠️ Please enter a valid database contact phone number.', 'warning');
        return;
      }

      const userTypeChecked = signupForm.querySelector('input[name="userType"]:checked');
      const role = userTypeChecked ? userTypeChecked.value : 'User';

      // Success Scenario - Call Backend API
      const userData = {
        name: name,
        username: username,
        email: email,
        password: password,
        phone: phone,
        permanentDistrict: permDistrict,
        gender: genderChecked ? genderChecked.value : 'Male',
        profession: profession,
        role: role
      };

      const apiBase = (window.location.host === 'localhost:5080' || window.location.host === '127.0.0.1:5080') 
        ? '' 
        : 'http://localhost:5080';

      fetch(`${apiBase}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
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
        showToast(`🎉 Registration successful! Welcome, ${name}!`, 'success');
        signupForm.reset();
        setTimeout(() => {
          window.location.href = 'signin.html';
        }, 2500);
      })
      .catch(error => {
        showToast(`❌ Error: ${error.message}`, 'danger');
      });
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
        toastIcon.innerHTML = '';
      }
    }
    
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  // --- Interactive Mouse Tracker for Right Pane ---
  const rightPane = document.querySelector('.auth-right-pane');
  if (rightPane) {
    rightPane.addEventListener('mousemove', (e) => {
      const rect = rightPane.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      rightPane.style.setProperty('--mouse-x', `${x}%`);
      rightPane.style.setProperty('--mouse-y', `${y}%`);
    });
  }
});
