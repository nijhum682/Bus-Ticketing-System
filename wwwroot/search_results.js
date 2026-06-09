document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const resultsCount = document.getElementById('resultsCount');
  const searchParamsLabel = document.getElementById('searchParamsLabel');
  const busListingsContainer = document.getElementById('busListingsContainer');
  const backBtn = document.getElementById('backBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Booking Modal Elements
  const bookingModal = document.getElementById('bookingModal');
  const bookingBusOperator = document.getElementById('bookingBusOperator');
  const bookingBusType = document.getElementById('bookingBusType');
  const bookingBusRoute = document.getElementById('bookingBusRoute');
  const bookingBusTime = document.getElementById('bookingBusTime');
  const seatsGrid = document.getElementById('seatsGrid');
  const selectedSeatLabel = document.getElementById('selectedSeatLabel');
  const totalPriceLabel = document.getElementById('totalPriceLabel');
  const confirmBookingBtn = document.getElementById('confirmBookingBtn');
  const closeBookingModalBtn = document.getElementById('closeBookingModalBtn');

  // Step Containers
  const bookingSeatStep = document.getElementById('bookingSeatStep');
  const bookingPaymentMethodStep = document.getElementById('bookingPaymentMethodStep');
  const bookingAccountStep = document.getElementById('bookingAccountStep');
  const bookingOtpStep = document.getElementById('bookingOtpStep');
  const bookingPinStep = document.getElementById('bookingPinStep');
  const bookingSuccessStep = document.getElementById('bookingSuccessStep');

  // Input & Button Elements
  const bookingModalTitleText = document.getElementById('bookingModalTitleText');
  const payMethodNextBtn = document.getElementById('payMethodNextBtn');
  const payMethodPrevBtn = document.getElementById('payMethodPrevBtn');
  const accountNextBtn = document.getElementById('accountNextBtn');
  const accountPrevBtn = document.getElementById('accountPrevBtn');
  const bookingAccountInput = document.getElementById('bookingAccountInput');
  const accountInputLabel = document.getElementById('accountInputLabel');
  const otpNextBtn = document.getElementById('otpNextBtn');
  const otpPrevBtn = document.getElementById('otpPrevBtn');
  const bookingOtpInput = document.getElementById('bookingOtpInput');
  const otpAlertMessage = document.getElementById('otpAlertMessage');
  const otpDummyContainer = document.getElementById('otpDummyContainer');
  const otpDummyValue = document.getElementById('otpDummyValue');
  const pinNextBtn = document.getElementById('pinNextBtn');
  const pinPrevBtn = document.getElementById('pinPrevBtn');
  const bookingPinInput = document.getElementById('bookingPinInput');
  const pinAlertMessage = document.getElementById('pinAlertMessage');
  const pinDummyContainer = document.getElementById('pinDummyContainer');
  const pinDummyValue = document.getElementById('pinDummyValue');
  const pinInputLabel = document.getElementById('pinInputLabel');
  const successCloseBtn = document.getElementById('successCloseBtn');

  // Parse Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const fromVal = urlParams.get('from') || '';
  const toVal = urlParams.get('to') || '';
  const dateVal = urlParams.get('date') || '';

  // API Setup
  const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? (['5080', '7234'].includes(window.location.port) ? '' : 'http://localhost:5080')
    : '';

  let currentBuses = [];
  let selectedBus = null;
  let selectedSeats = [];

  function getBookedSeatsList(bus) {
    if (bus.bookedSeats !== undefined && bus.bookedSeats !== null && bus.bookedSeats.trim() !== '') {
      return bus.bookedSeats.split(',').map(s => s.trim()).filter(Boolean);
    }

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

    const seedStr = `${bus.id}_${dateVal}`;
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

    const dbAvailable = bus.dbAvailableSeats !== undefined ? bus.dbAvailableSeats : bus.availableSeats;
    const bookedCount = Math.max(0, 40 - dbAvailable);
    return allSeats.slice(0, bookedCount).map(s => s.name);
  }

  function getAvailableSeatsCount(bus) {
    if (bus.dbAvailableSeats === undefined) {
      bus.dbAvailableSeats = bus.availableSeats;
    }
    const bookedCount = bus.userBookedSeats ? bus.userBookedSeats.length : 0;
    return bus.dbAvailableSeats - bookedCount;
  }

  if (searchParamsLabel) {
    searchParamsLabel.textContent = `${fromVal} ➔ ${toVal} | ${dateVal}`;
  }

  // Back Button click
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }

  // Load Bus Data
  if (fromVal && toVal) {
    fetchBuses();
  } else {
    showToast('⚠️ Missing search parameters. Redirecting...', 'warning');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  }

  function fetchBuses() {
    if (!busListingsContainer) return;
    busListingsContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">Searching for available buses...</div>';

    fetch(`${apiBase}/api/bus/search?from=${encodeURIComponent(fromVal)}&to=${encodeURIComponent(toVal)}&date=${encodeURIComponent(dateVal)}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to search buses.');
        return response.json();
      })
      .then(buses => {
        buses.forEach(bus => {
          bus.userBookedSeats = [];
          bus.availableSeats = getAvailableSeatsCount(bus);
        });
        currentBuses = buses;
        renderBuses(buses);
      })
      .catch(error => {
        console.error(error);
        showToast('❌ Error occurred while searching for buses.', 'danger');
        busListingsContainer.innerHTML = '<div style="text-align: center; color: var(--danger); padding: 2rem 0;">❌ Failed to load buses.</div>';
      });
  }

  function renderBuses(buses) {
    if (!busListingsContainer || !resultsCount) return;

    resultsCount.textContent = buses.length;
    busListingsContainer.innerHTML = '';

    if (buses.length === 0) {
      busListingsContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem 0; font-size: 0.95rem;">
          No buses available for this route on the selected date.
        </div>
      `;
      return;
    }

    buses.forEach(bus => {
      const card = document.createElement('div');
      card.className = 'bus-listing-card';
      
      // Setup styles matching target image
      card.style.background = 'rgba(20, 27, 47, 0.08)';
      card.style.backdropFilter = 'blur(10px)';
      card.style.webkitBackdropFilter = 'blur(10px)';
      card.style.border = '1px solid var(--border-color)';
      card.style.borderRadius = '12px';
      card.style.padding = '1.25rem 1.15rem';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '0.75rem';
      card.style.transition = 'all var(--transition-fast)';

      // Hover effect
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = 'var(--border-color-active)';
        card.style.background = 'rgba(29, 38, 64, 0.15)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'var(--border-color)';
        card.style.background = 'rgba(20, 27, 47, 0.08)';
      });

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; text-align: left;">
          <div>
            <h4 style="font-family: var(--font-header); font-weight: 700; font-size: 1.15rem; color: #ffffff; margin-bottom: 0.2rem;">${bus.operator}</h4>
            <div style="display: flex;">
              <span style="font-size: 0.75rem; background: rgba(6, 182, 212, 0.12); color: var(--accent-secondary); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600;">${bus.busType}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 1.35rem; font-weight: 800; color: #ffffff; font-family: var(--font-header);">৳${bus.fare.toLocaleString()}</span>
          </div>
        </div>
        
        <div style="border-top: 1px dashed var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-secondary);">
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="var(--warning)" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Departs: <strong style="color: var(--text-primary); font-weight: 600;">${bus.departureTime}</strong></span>
          </div>
          <span style="color: ${bus.availableSeats < 10 ? 'var(--danger)' : 'var(--success)'}; font-weight: 600; text-shadow: 0 0 10px ${bus.availableSeats < 10 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'};">
            ${bus.availableSeats} Seats Left
          </span>
        </div>

        <button type="button" class="action-btn btn-primary book-btn" data-id="${bus.id}" style="height: 48px; padding: 0; font-size: 0.95rem; font-weight: 700; width: 250px; margin: 0.75rem auto 0 auto; justify-content: center; letter-spacing: 0.3px;">Book Ticket</button>
      `;

      card.querySelector('.book-btn').addEventListener('click', () => {
        openBookingModal(bus);
      });

      busListingsContainer.appendChild(card);
    });
  }

  function openBookingModal(bus) {
    if (!bookingModal || !bookingBusOperator || !bookingBusType || !bookingBusRoute || !bookingBusTime) return;

    selectedBus = bus;
    selectedSeats = [];

    bookingBusOperator.textContent = bus.operator;
    bookingBusType.textContent = bus.busType;
    bookingBusRoute.textContent = `${bus.fromDistrict} ➔ ${bus.toDistrict}`;
    bookingBusTime.textContent = bus.departureTime;

    selectedSeatLabel.textContent = 'None';
    selectedSeatLabel.style.color = 'var(--success)';
    totalPriceLabel.textContent = '৳0';
    if (confirmBookingBtn) confirmBookingBtn.disabled = true;

    // Reset inputs and error messages
    if (bookingAccountInput) bookingAccountInput.value = '';
    if (bookingOtpInput) bookingOtpInput.value = '';
    if (bookingPinInput) bookingPinInput.value = '';
    if (otpAlertMessage) otpAlertMessage.style.display = 'none';
    if (pinAlertMessage) pinAlertMessage.style.display = 'none';

    // Deselect radio buttons
    document.querySelectorAll('.payment-radio').forEach(radio => {
      radio.checked = false;
    });

    // Reset wizard view back to step 1
    showStep(1);

    generateSeatsGrid(bus);
    bookingModal.style.display = 'flex';
  }

  function generateSeatsGrid(bus) {
    if (!seatsGrid) return;
    seatsGrid.innerHTML = '';

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = ['1', '2', '', '3', '4']; // Corridor represents empty space

    const bookedSeats = getBookedSeatsList(bus);
    rows.forEach(row => {
      cols.forEach(col => {
        if (col === '') {
          // Corridor
          const space = document.createElement('div');
          space.style.width = '24px';
          seatsGrid.appendChild(space);
        } else {
          const seatName = `${row}${col}`;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'seat-btn';
          btn.textContent = seatName;

          // Booked if in list OR booked by current user in this session
          const isBooked = bookedSeats.includes(seatName) || (bus.userBookedSeats && bus.userBookedSeats.includes(seatName));
          if (isBooked) {
            btn.style.background = 'rgba(255, 255, 255, 0.04)';
            btn.style.color = 'rgba(255, 255, 255, 0.85)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.02)';
            btn.style.cursor = 'not-allowed';
            btn.disabled = true;
          } else {
            // Check if selected
            const isSelected = selectedSeats.includes(seatName);
            if (isSelected) {
              btn.style.background = 'var(--accent-gradient)';
              btn.style.color = '#ffffff';
              btn.style.borderColor = 'transparent';
              btn.style.boxShadow = '0 0 10px var(--accent-glow)';
            } else {
              btn.style.background = 'rgba(16, 185, 129, 0.15)';
              btn.style.color = '#34d399';
              btn.style.borderColor = 'rgba(52, 211, 153, 0.5)';
            }

            btn.addEventListener('mouseenter', () => {
              if (!selectedSeats.includes(seatName)) {
                btn.style.background = 'rgba(16, 185, 129, 0.28)';
                btn.style.color = '#ffffff';
              }
            });
            btn.addEventListener('mouseleave', () => {
              if (!selectedSeats.includes(seatName)) {
                btn.style.background = 'rgba(16, 185, 129, 0.15)';
                btn.style.color = '#34d399';
              }
            });

            btn.addEventListener('click', () => {
              selectSeat(seatName, btn);
            });
          }
          seatsGrid.appendChild(btn);
        }
      });
    });
  }

  function selectSeat(seatName, btnElement) {
    const idx = selectedSeats.indexOf(seatName);
    if (idx > -1) {
      // Deselect seat
      selectedSeats.splice(idx, 1);
      btnElement.style.background = 'rgba(16, 185, 129, 0.15)';
      btnElement.style.color = '#34d399';
      btnElement.style.borderColor = 'rgba(52, 211, 153, 0.5)';
      btnElement.style.boxShadow = 'none';
    } else {
      // Select seat
      selectedSeats.push(seatName);
      btnElement.style.background = 'var(--accent-gradient)';
      btnElement.style.color = '#ffffff';
      btnElement.style.borderColor = 'transparent';
      btnElement.style.boxShadow = '0 0 10px var(--accent-glow)';
    }

    if (selectedSeats.length === 0) {
      selectedSeatLabel.textContent = 'None';
      totalPriceLabel.textContent = '৳0';
      if (confirmBookingBtn) confirmBookingBtn.disabled = true;
    } else {
      selectedSeatLabel.textContent = selectedSeats.join(', ');
      const totalFare = selectedBus.fare * selectedSeats.length;
      totalPriceLabel.textContent = `৳${totalFare.toLocaleString()}`;
      if (confirmBookingBtn) confirmBookingBtn.disabled = false;
    }
  }

  let currentStep = 1;
  let selectedPaymentMethod = '';
  let generatedOtp = '';
  let generatedPin = '';
  let otpTimeout = null;
  let pinTimeout = null;

  function showStep(stepNumber) {
    currentStep = stepNumber;
    
    // Hide all step containers
    if (bookingSeatStep) bookingSeatStep.style.display = 'none';
    if (bookingPaymentMethodStep) bookingPaymentMethodStep.style.display = 'none';
    if (bookingAccountStep) bookingAccountStep.style.display = 'none';
    if (bookingOtpStep) bookingOtpStep.style.display = 'none';
    if (bookingPinStep) bookingPinStep.style.display = 'none';
    if (bookingSuccessStep) bookingSuccessStep.style.display = 'none';

    // Hide fixed banners by default and clear active timeouts
    clearTimeout(otpTimeout);
    clearTimeout(pinTimeout);
    if (otpDummyContainer) {
      otpDummyContainer.style.opacity = '0';
      otpDummyContainer.style.display = 'none';
    }
    if (pinDummyContainer) {
      pinDummyContainer.style.opacity = '0';
      pinDummyContainer.style.display = 'none';
    }

    // Show active step container
    if (stepNumber === 1) {
      if (bookingSeatStep) bookingSeatStep.style.display = 'flex';
      if (bookingModalTitleText) bookingModalTitleText.textContent = 'Select Seat & Book';
    } else if (stepNumber === 2) {
      if (bookingPaymentMethodStep) bookingPaymentMethodStep.style.display = 'flex';
      if (bookingModalTitleText) bookingModalTitleText.textContent = 'Payment Method';
      const selectedRadio = document.querySelector('.payment-radio:checked');
      if (payMethodNextBtn) payMethodNextBtn.disabled = !selectedRadio;
    } else if (stepNumber === 3) {
      if (bookingAccountStep) bookingAccountStep.style.display = 'flex';
      if (bookingModalTitleText) bookingModalTitleText.textContent = 'Account Information';
      const displayMethod = selectedPaymentMethod === 'Bkash' ? 'bKash' : selectedPaymentMethod;
      if (accountInputLabel) {
        accountInputLabel.textContent = `Enter your ${displayMethod} Account Number:`;
      }
      if (accountNextBtn) accountNextBtn.disabled = !bookingAccountInput.value.trim();
    } else if (stepNumber === 4) {
      if (bookingOtpStep) bookingOtpStep.style.display = 'flex';
      if (bookingModalTitleText) bookingModalTitleText.textContent = 'OTP Verification';
      if (bookingOtpInput) bookingOtpInput.value = '';
      if (otpAlertMessage) otpAlertMessage.style.display = 'none';
      if (otpNextBtn) otpNextBtn.disabled = true;
      sendOtp();
    } else if (stepNumber === 5) {
      if (bookingPinStep) bookingPinStep.style.display = 'flex';
      if (bookingModalTitleText) bookingModalTitleText.textContent = 'PIN Verification';
      const displayMethod = selectedPaymentMethod === 'Bkash' ? 'bKash' : selectedPaymentMethod;
      if (pinInputLabel) {
        pinInputLabel.textContent = `Enter your ${displayMethod} PIN:`;
      }
      if (bookingPinInput) bookingPinInput.value = '';
      if (pinAlertMessage) pinAlertMessage.style.display = 'none';
      if (pinNextBtn) pinNextBtn.disabled = true;
      sendPin();
    } else if (stepNumber === 6) {
      if (bookingSuccessStep) bookingSuccessStep.style.display = 'flex';
      if (bookingModalTitleText) bookingModalTitleText.textContent = 'Booking Confirmed';
    }
  }

  function sendOtp() {
    clearTimeout(otpTimeout);
    generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    if (otpDummyValue) otpDummyValue.textContent = generatedOtp;
    if (otpDummyContainer) {
      otpDummyContainer.style.display = 'block';
      // Force layout reflow before opacity change to trigger transition animation
      otpDummyContainer.offsetHeight;
      otpDummyContainer.style.opacity = '1';
    }
    otpTimeout = setTimeout(() => {
      if (otpDummyContainer) otpDummyContainer.style.opacity = '0';
    }, 5000);
  }

  function sendPin() {
    clearTimeout(pinTimeout);
    generatedPin = String(Math.floor(1000 + Math.random() * 9000));
    if (pinDummyValue) pinDummyValue.textContent = generatedPin;
    if (pinDummyContainer) {
      pinDummyContainer.style.display = 'block';
      // Force layout reflow before opacity change to trigger transition animation
      pinDummyContainer.offsetHeight;
      pinDummyContainer.style.opacity = '1';
    }
    pinTimeout = setTimeout(() => {
      if (pinDummyContainer) pinDummyContainer.style.opacity = '0';
    }, 5000);
  }

  function executeFinalBooking() {
    if (!selectedBus || selectedSeats.length === 0) return;

    const seatsStr = selectedSeats.join(', ');

    // Compile current booked seats list
    let currentBookedList = [];
    if (selectedBus.bookedSeats !== undefined && selectedBus.bookedSeats !== null && selectedBus.bookedSeats.trim() !== '') {
      currentBookedList = selectedBus.bookedSeats.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      currentBookedList = getBookedSeatsList(selectedBus);
    }

    // Combine existing bookings with new selections
    const newBookedList = [...currentBookedList, ...selectedSeats];
    newBookedList.sort();
    const newBookedSeatsStr = newBookedList.join(', ');
    const newAvailableSeats = Math.max(0, 40 - newBookedList.length);

    // Prepare updated bus data
    const updatedBusData = {
      id: selectedBus.id,
      operator: selectedBus.operator,
      busType: selectedBus.busType,
      departureTime: selectedBus.departureTime,
      fare: selectedBus.fare,
      availableSeats: newAvailableSeats,
      fromDistrict: selectedBus.fromDistrict,
      toDistrict: selectedBus.toDistrict,
      journeyDate: selectedBus.journeyDate || '',
      bookedSeats: newBookedSeatsStr
    };

    // Call backend PUT API to update the seats
    fetch(`${apiBase}/api/bus/${selectedBus.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedBusData)
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
      showToast(`🎟️ Tickets booked successfully! Seats: ${seatsStr} on ${selectedBus.operator}.`, 'success');
      
      // Log booking history to database
      const bookingData = {
        userEmail: localStorage.getItem('userEmail') || '',
        busId: selectedBus.id,
        busName: selectedBus.operator,
        fromDistrict: selectedBus.fromDistrict,
        toDistrict: selectedBus.toDistrict,
        journeyDate: dateVal,
        seats: seatsStr,
        paymentMethod: selectedPaymentMethod,
        departureTime: selectedBus.departureTime
      };

      fetch(`${apiBase}/api/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })
      .then(res => {
        if (!res.ok) console.error('Failed to log booking history.');
      })
      .catch(err => {
        console.error('Error logging booking:', err);
      });

      // Update local object properties to match the database update
      selectedBus.bookedSeats = newBookedSeatsStr;
      selectedBus.availableSeats = newAvailableSeats;
      selectedBus.dbAvailableSeats = newAvailableSeats;
      selectedBus.userBookedSeats = [];
      // Clear payment inputs to prevent browser password managers from triggering
      if (bookingAccountInput) bookingAccountInput.value = '';
      if (bookingOtpInput) bookingOtpInput.value = '';
      if (bookingPinInput) bookingPinInput.value = '';

      // Transition to Step 6
      showStep(6);

      // Re-render listings
      renderBuses(currentBuses);
    })
    .catch(error => {
      console.error('Error booking ticket:', error);
      showToast(`❌ Booking failed: ${error.message}`, 'danger');
    });
  }

  // Close booking modal and clear timeouts
  if (closeBookingModalBtn) {
    closeBookingModalBtn.addEventListener('click', () => {
      if (otpDummyContainer) {
        otpDummyContainer.style.opacity = '0';
        otpDummyContainer.style.display = 'none';
      }
      if (pinDummyContainer) {
        pinDummyContainer.style.opacity = '0';
        pinDummyContainer.style.display = 'none';
      }
      if (bookingModal) bookingModal.style.display = 'none';
    });
  }

  // Step 1: Confirm Booking transition to Step 2
  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener('click', () => {
      showStep(2);
    });
  }

  // Step 2 Listeners
  if (payMethodNextBtn) {
    payMethodNextBtn.addEventListener('click', () => {
      showStep(3);
    });
  }
  if (payMethodPrevBtn) {
    payMethodPrevBtn.addEventListener('click', () => {
      showStep(1);
    });
  }

  // Radio selection change listener
  document.querySelectorAll('.payment-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      selectedPaymentMethod = radio.value;
      if (payMethodNextBtn) payMethodNextBtn.disabled = false;
    });
  });

  // Step 3 Listeners
  if (accountNextBtn) {
    accountNextBtn.addEventListener('click', () => {
      showStep(4);
    });
  }
  if (accountPrevBtn) {
    accountPrevBtn.addEventListener('click', () => {
      showStep(2);
    });
  }
  if (bookingAccountInput) {
    bookingAccountInput.addEventListener('input', () => {
      if (accountNextBtn) {
        accountNextBtn.disabled = !bookingAccountInput.value.trim();
      }
    });
  }

  // Step 4 Listeners
  if (otpNextBtn) {
    otpNextBtn.addEventListener('click', () => {
      const enteredOtp = bookingOtpInput.value.trim();
      if (enteredOtp === generatedOtp) {
        if (otpAlertMessage) otpAlertMessage.style.display = 'none';
        showStep(5);
      } else {
        if (otpAlertMessage) {
          otpAlertMessage.textContent = '❌ Incorrect OTP. Please try again.';
          otpAlertMessage.style.display = 'block';
        }
        bookingOtpInput.value = '';
        otpNextBtn.disabled = true;
        sendOtp();
      }
    });
  }
  if (otpPrevBtn) {
    otpPrevBtn.addEventListener('click', () => {
      showStep(3);
    });
  }
  if (bookingOtpInput) {
    bookingOtpInput.addEventListener('input', () => {
      if (otpAlertMessage) otpAlertMessage.style.display = 'none';
      if (otpNextBtn) {
        otpNextBtn.disabled = !bookingOtpInput.value.trim();
      }
    });
  }

  // Step 5 Listeners
  if (pinNextBtn) {
    pinNextBtn.addEventListener('click', () => {
      const enteredPin = bookingPinInput.value.trim();
      if (enteredPin === generatedPin) {
        if (pinAlertMessage) pinAlertMessage.style.display = 'none';
        executeFinalBooking();
      } else {
        if (pinAlertMessage) {
          pinAlertMessage.textContent = '❌ Incorrect PIN. Please try again.';
          pinAlertMessage.style.display = 'block';
        }
        bookingPinInput.value = '';
        pinNextBtn.disabled = true;
        sendPin();
      }
    });
  }
  if (pinPrevBtn) {
    pinPrevBtn.addEventListener('click', () => {
      showStep(4);
    });
  }
  if (bookingPinInput) {
    bookingPinInput.addEventListener('input', () => {
      if (pinAlertMessage) pinAlertMessage.style.display = 'none';
      if (pinNextBtn) {
        pinNextBtn.disabled = !bookingPinInput.value.trim();
      }
    });
  }

  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', () => {
      if (otpDummyContainer) {
        otpDummyContainer.style.opacity = '0';
        otpDummyContainer.style.display = 'none';
      }
      if (pinDummyContainer) {
        pinDummyContainer.style.opacity = '0';
        pinDummyContainer.style.display = 'none';
      }
      if (bookingModal) bookingModal.style.display = 'none';
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
