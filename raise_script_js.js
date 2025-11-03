// ==================== CONFIGURATION ====================
// IMPORTANT: Replace with your actual Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyswFn65bVPqle5M1fUGFdzDkS4-stnb7aLcJY9yozMLuhjLtrTjx3SUSiTqvr0upoY/exec';

// Admin credentials (for demo - in production, use backend authentication)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Global variables
let currentComplaints = [];
let currentRowIndex = null;

// ==================== COMPLAINT FORM (index.html) ====================
function initComplaintForm() {
    // Get asset/stall ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get('stall') || urlParams.get('asset') || urlParams.get('assetcode');
    
    if (assetId) {
        document.getElementById('assetIdDisplay').textContent = assetId;
        document.getElementById('assetBadge').style.display = 'block';
    }

    // Get location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lon = position.coords.longitude.toFixed(6);
                document.getElementById('location').value = `${lat}, ${lon}`;
            },
            () => {
                document.getElementById('location').value = 'Location not available';
            }
        );
    } else {
        document.getElementById('location').value = 'Location not supported';
    }

    // Photo upload handler
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoUpload);
    }

    // Form submission
    const form = document.getElementById('complaintForm');
    if (form) {
        form.addEventListener('submit', handleComplaintSubmit);
    }

     const formTypeEl = document.getElementById('formType');
    const complaintGroup = document.getElementById('complaintGroup');
    const feedbackGroup = document.getElementById('feedbackGroup');

    if (formTypeEl && complaintGroup && feedbackGroup) {
        const toggle = () => {
        if (formTypeEl.value === 'Feedback') {
            complaintGroup.style.display = 'none';
            feedbackGroup.style.display = 'block';
        } else {
            complaintGroup.style.display = 'block';
            feedbackGroup.style.display = 'none';
        }
        };
        formTypeEl.addEventListener('change', toggle);
        toggle();
    }
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5000000) {
        showError('Photo size should be less than 5MB');
        event.target.value = '';
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = function() {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${reader.result}" alt="Preview">`;
        preview.style.display = 'block';
        document.getElementById('uploadText').textContent = '✓ Photo uploaded';
    };
    reader.readAsDataURL(file);
}

// async function handleComplaintSubmit(event) {
//     event.preventDefault();
    
//     hideError();
    
//     const submitBtn = event.target.querySelector('.btn-primary');
//     const submitText = document.getElementById('submitText');
//     const originalText = submitText.textContent;
    
//     // Disable submit button
//     submitBtn.disabled = true;
//     submitText.textContent = 'Submitting...';

//     try {
//         // Get form data
//         const urlParams = new URLSearchParams(window.location.search);
//         const assetId = urlParams.get('stall') || urlParams.get('asset') || urlParams.get('assetcode');
        
//         const formData = {
//             timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
//             name: document.getElementById('name').value.trim() || 'Anonymous',
//             mobile: document.getElementById('mobile').value.trim() || 'Not provided',
//             complaintType: document.getElementById('complaintType').value,
//             description: document.getElementById('description').value.trim(),
//             location: document.getElementById('location').value.trim(),
//             assetId: assetId || 'Not specified',
//             status: 'Pending',
//             photo: ''
//         };

//         // Validate required fields
//         if (!formData.complaintType) {
//             showError('Please select a complaint type');
//             submitBtn.disabled = false;
//             submitText.textContent = originalText;
//             return;
//         }

//         if (!formData.description) {
//             showError('Please enter complaint description');
//             submitBtn.disabled = false;
//             submitText.textContent = originalText;
//             return;
//         }

//         // Validate mobile if provided
//         if (formData.mobile !== 'Not provided' && !/^[0-9]{10}$/.test(formData.mobile)) {
//             showError('Please enter a valid 10-digit mobile number');
//             submitBtn.disabled = false;
//             submitText.textContent = originalText;
//             return;
//         }

//         // Handle photo
//         const photoInput = document.getElementById('photoInput');
//         if (photoInput && photoInput.files && photoInput.files[0]) {
//             const file = photoInput.files[0];
//             const reader = new FileReader();
            
//             formData.photo = await new Promise((resolve) => {
//                 reader.onloadend = () => resolve(reader.result);
//                 reader.readAsDataURL(file);
//             });
//         }

//         // Submit to Google Sheets
//         await submitToGoogleSheets(formData);

//         // Store for WhatsApp sharing
//         sessionStorage.setItem('lastComplaint', JSON.stringify(formData));

//         // Show success
//         showSuccess(formData);

//     } catch (error) {
//         console.error('Submission error:', error);
//         showError('Failed to submit complaint. Please try again.');
//         submitBtn.disabled = false;
//         submitText.textContent = originalText;
//     }
// }

async function handleComplaintSubmit(event) {
  event.preventDefault();
  hideError();
  const submitBtn = event.target.querySelector('.btn-primary');
  const submitText = document.getElementById('submitText');
  const originalText = submitText.textContent;
  submitBtn.disabled = true;
  submitText.textContent = 'Submitting...';

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get('stall') || urlParams.get('asset') || urlParams.get('assetcode');

    // New: read form type and compute category
    const formType = document.getElementById('formType').value;
    let category;
    if (formType === 'Feedback') {
      const feedbackType = document.getElementById('feedbackType').value;
      if (!feedbackType) {
        showError('Please select feedback type');
        submitBtn.disabled = false;
        submitText.textContent = originalText;
        return;
      }
      category = `Feedback - ${feedbackType}`;
    } else {
      const selectedComplaint = document.getElementById('complaintType').value;
      if (!selectedComplaint) {
        showError('Please select a complaint type');
        submitBtn.disabled = false;
        submitText.textContent = originalText;
        return;
      }
      category = selectedComplaint;
    }

    const formData = {
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      name: document.getElementById('name').value.trim() || 'Anonymous',
      mobile: document.getElementById('mobile').value.trim() || 'Not provided',
      complaintType: category, // single field for both complaint and feedback
      description: document.getElementById('description').value.trim(),
      location: document.getElementById('location').value.trim(),
      assetId: assetId || 'Not specified',
      status: 'Pending',
      photo: ''
    };

    // Existing validations remain unchanged
    if (!formData.description) {
      showError('Please enter complaint description');
      submitBtn.disabled = false;
      submitText.textContent = originalText;
      return;
    }
    if (formData.mobile !== 'Not provided' && !/^[0-9]{10}$/.test(formData.mobile)) {
      showError('Please enter a valid 10-digit mobile number');
      submitBtn.disabled = false;
      submitText.textContent = originalText;
      return;
    }

    // Existing photo handling (unchanged)
    const photoInput = document.getElementById('photoInput');
    if (photoInput && photoInput.files && photoInput.files[0]) {
      const file = photoInput.files[0];
      const reader = new FileReader();
      formData.photo = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    // Save to Google Sheets (unchanged function)
    await submitToGoogleSheets(formData);

    // Auto-share only for complaints and only if a number was provided
    if (formType === 'Complaint' && formData.mobile && formData.mobile !== 'Not provided') {
      const digits = formData.mobile.replace(/\D/g, '');
      const toNumber = digits.length === 10 ? ('91' + digits) : digits; // default to India code for 10-digit inputs
      if (toNumber) {
        shareOnWhatsApp(formData, toNumber);
      }
    }

    // Persist and show success (existing)
    sessionStorage.setItem('lastComplaint', JSON.stringify(formData));
    showSuccess(formData);
  } catch (error) {
    console.error('Submission error:', error);
    showError('Failed to submit complaint. Please try again.');
    submitBtn.disabled = false;
    submitText.textContent = originalText;
  }
}


// async function submitToGoogleSheets(data) {
//     try {
//         // Check if using demo mode or actual Google Sheets
//         if (GOOGLE_SCRIPT_URL === 'https://script.google.com/macros/s/AKfycbyswFn65bVPqle5M1fUGFdzDkS4-stnb7aLcJY9yozMLuhjLtrTjx3SUSiTqvr0upoY/exec') {
//             // Demo mode: Store in localStorage
//             console.log('Demo mode: Saving to localStorage');
//             let complaints = JSON.parse(localStorage.getItem('Complaints') || '[]');
//             complaints.push(data);
//             localStorage.setItem('Complaints', JSON.stringify(complaints));
//             await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
//         } else {
//             // Production mode: Send to Google Sheets
//             const response = await fetch(GOOGLE_SCRIPT_URL, {
//                 method: 'POST',
//                 mode: 'no-cors',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(data)
//             });
            
//             // Note: With no-cors mode, we can't read the response
//             // Assume success if no error is thrown
//             console.log('Submitted to Google Sheets');
//         }
//     } catch (error) {
//         console.error('Google Sheets submission error:', error);
//         throw error;
//     }
// }

async function submitToGoogleSheets(data) {

  try {
    // if (GOOGLE_SCRIPT_URL === "https://script.google.com/macros/s/AKfycbyswFn65bVPqle5M1fUGFdzDkS4-stnb7aLcJY9yozMLuhjLtrTjx3SUSiTqvr0upoY/exec") {
    //   // Demo mode
    //   console.log('Demo mode: Saving to localStorage', data);
    //   let complaints = JSON.parse(localStorage.getItem('Complaints') || '[]');
    //   complaints.push(data);
    //   localStorage.setItem('Complaints', JSON.stringify(complaints));
    //   await new Promise(resolve => setTimeout(resolve, 1500));
    // } else {
      // Production mode - REMOVE no-cors
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        // headers: {
        //   'Content-Type': 'application/json',
        // },
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Submission failed');
      }
      console.log('Submitted successfully:', result);
    // }
  } catch (error) {
    console.error('Google Sheets submission error:', error);
    throw error;
  }
}


function showSuccess(formData) {
    document.getElementById('formContent').style.display = 'none';
    document.getElementById('successContent').style.display = 'block';
    document.getElementById('refId').textContent = formData.assetId;
    document.getElementById('refType').textContent = formData.complaintType;
    
    // Setup WhatsApp button
    const whatsappBtn = document.getElementById('whatsappBtn');
    whatsappBtn.onclick = () => shareOnWhatsApp(formData);
}

// function shareOnWhatsApp(formData) {
//     let message = `🚆 RAISE Complaint Registered

// Asset ID: ${formData.assetId}
// Type: ${formData.complaintType}
// Description: ${formData.description}`;

//     if (formData.location && formData.location !== 'Location not available') {
//         message += `\nLocation: ${formData.location}`;
//     }

//     if (formData.photo) {
//         message += `\nPhoto: Attached (see complaint form)`;
//     }

//     if (formData.name !== 'Anonymous') {
//         message += `\nSubmitted by: ${formData.name}`;
//     }

//     if (formData.mobile !== 'Not provided') {
//         message += `\nMobile: ${formData.mobile}`;
//     }

//     message += `\n\nTimestamp: ${formData.timestamp}`;
//     message += `\n\n#RAISE #RailwayComplaint`;

//     const whatsappNumber = "+918754444825";
//     const whatsappURL = "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message);

//     window.open(whatsappURL, '_blank');
// }

function shareOnWhatsApp(formData, toNumber) {
  let message = `🚆 RAISE Complaint Registered
Asset ID: ${formData.assetId}
Type: ${formData.complaintType}
Description: ${formData.description}`;

  if (formData.location && formData.location !== 'Location not available') {
    message += `\nLocation: ${formData.location}`;
  }
  if (formData.photo) {
    message += `\nPhoto: Attached (see complaint form)`;
  }
  if (formData.name !== 'Anonymous') {
    message += `\nSubmitted by: ${formData.name}`;
  }
  if (formData.mobile !== 'Not provided') {
    message += `\nMobile: ${formData.mobile}`;
  }
  message += `\n\nTimestamp: ${formData.timestamp}\n\n#RAISE #RailwayComplaint`;

  // Prefer the provided number; fall back to the existing default if needed
  const number = ('+916374713251').replace(/^\+/, '');
  const whatsappURL = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
  window.open(whatsappURL, '_blank');
}


function showError(message) {
    const alert = document.getElementById('errorAlert');
    if (alert) {
        alert.textContent = message;
        alert.style.display = 'block';
        alert.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => hideError(), 5000);
        
        // Scroll to error
        alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function hideError() {
    const alert = document.getElementById('errorAlert');
    if (alert) {
        alert.style.display = 'none';
        alert.classList.remove('show');
    }
}

// ==================== ADMIN LOGIN (admin.html) ====================
function initAdminLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    const loginBtn = event.target.querySelector('.btn-primary');
    const loginText = document.getElementById('loginText');
    const originalText = loginText.textContent;
    
    // Disable button
    loginBtn.disabled = true;
    loginText.textContent = 'Logging in...';
    
    // Simulate authentication delay
    setTimeout(() => {
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // Set session
            sessionStorage.setItem('adminAuth', 'true');
            sessionStorage.setItem('adminUser', username);
            
            // Redirect to complaints page
            window.location.href = 'raise_complaints_html.html';
        } else {
            // Show error
            const alert = document.getElementById('loginAlert');
            alert.textContent = 'Invalid credentials. Please try again.';
            alert.style.display = 'block';
            alert.classList.add('show');
            
            loginBtn.disabled = false;
            loginText.textContent = originalText;
            
            // Clear password
            document.getElementById('password').value = '';
            
            // Hide error after 5 seconds
            setTimeout(() => {
                alert.style.display = 'none';
                alert.classList.remove('show');
            }, 5000);
        }
    }, 1000);
}

function logout() {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminUser');
    window.location.href = 'raise_admin_html.html';
}

// ==================== COMPLAINTS DASHBOARD (complaints.html) ====================
function checkAuth() {
    const isAuth = sessionStorage.getItem('adminAuth');
    if (!isAuth || isAuth !== 'true') {
        window.location.href = 'raise_admin_html.html';
    }
}

async function loadComplaints() {
    const loadingDiv = document.getElementById('loadingDiv');
    const tableContainer = document.getElementById('tableContainer');
    const errorDiv = document.getElementById('errorDiv');
    const emptyState = document.getElementById('emptyState');
    
    // Show loading
    loadingDiv.style.display = 'block';
    tableContainer.style.display = 'none';
    errorDiv.style.display = 'none';
    emptyState.style.display = 'none';

    try {
        let complaints = [];
        
        // Check if using demo mode or actual Google Sheets
        // if (GOOGLE_SCRIPT_URL === 'https://script.google.com/macros/s/AKfycbyswFn65bVPqle5M1fUGFdzDkS4-stnb7aLcJY9yozMLuhjLtrTjx3SUSiTqvr0upoY/exec') {
        //     // Demo mode: Load from localStorage
        //     console.log('Demo mode: Loading from localStorage');
        //     complaints = JSON.parse(localStorage.getItem('Complaints') || '[]');
        //     await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        // } else {
            // Production mode: Fetch from Google Sheets
            const response = await fetch(GOOGLE_SCRIPT_URL + '?action=get', {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch complaints');
            }
            
            complaints = await response.json();
        // }

        currentComplaints = complaints;
        
        // Hide loading
        loadingDiv.style.display = 'none';
        
        if (complaints.length === 0) {
            emptyState.style.display = 'block';
        } else {
            renderTable(complaints);
            updateStats(complaints);
            tableContainer.style.display = 'block';
        }

    } catch (error) {
        console.error('Load complaints error:', error);
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        document.getElementById('errorMessage').textContent = 'Failed to load complaints. Please check your Google Apps Script configuration and try again.';
    }
}

function renderTable(complaints) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    complaints.reverse().forEach((complaint, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${complaint.timestamp || '-'}</td>
            <td><strong>${complaint.assetId || complaint.stallId || '-'}</strong></td>
            <td>${complaint.complaintType || '-'}</td>
            <td title="${complaint.description || '-'}">${truncateText(complaint.description, 50)}</td>
            <td>${complaint.name || '-'}</td>
            <td>${complaint.mobile || '-'}</td>
            <td title="${complaint.location || '-'}">${truncateText(complaint.location, 30)}</td>
            <td>${renderPhotoCell(complaint.photo)}</td>
            <td><span class="status-badge status-${getStatusClass(complaint.status)}">${complaint.status || 'Pending'}</span></td>
            <td><button class="btn-update" onclick="openStatusModal(${complaints.length - 1 - index})">Update</button></td>
        `;
    });
}

function renderPhotoCell(photo) {
    if (!photo || photo === 'No') {
        return '<span style="color: #999;">No Photo</span>';
    }
    
    if (photo.startsWith('http')) {
        return `<a href="${photo}" target="_blank" style="color: #3b82f6; text-decoration: none;">View Photo</a>`;
    }
    
    if (photo === 'Yes' || photo.startsWith('data:image')) {
        return '<span style="color: #10b981;">✓ Available</span>';
    }
    
    return '<span style="color: #999;">-</span>';
}

function getStatusClass(status) {
    if (!status) return 'pending';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress')) return 'progress';
    if (statusLower.includes('resolved')) return 'resolved';
    return 'pending';
}

function truncateText(text, maxLength) {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function updateStats(complaints) {
    const total = complaints.length;
    const pending = complaints.filter(c => !c.status || c.status === 'Pending').length;
    const progress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('progressCount').textContent = progress;
    document.getElementById('resolvedCount').textContent = resolved;
}

function initDashboardFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filtered = currentComplaints;
    
    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(c => {
            const assetId = (c.assetId || c.stallId || '').toLowerCase();
            const type = (c.complaintType || '').toLowerCase();
            const description = (c.description || '').toLowerCase();
            return assetId.includes(searchTerm) || type.includes(searchTerm) || description.includes(searchTerm);
        });
    }
    
    // Apply status filter
    if (statusFilter) {
        filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    renderTable(filtered);
}

function openStatusModal(index) {
    currentRowIndex = currentComplaints.length - 1 - index;
    const complaint = currentComplaints[currentRowIndex];
    
    document.getElementById('modalAssetId').textContent = complaint.assetId || complaint.stallId || '-';
    document.getElementById('modalCurrentStatus').textContent = complaint.status || 'Pending';
    document.getElementById('newStatus').value = complaint.status || 'Pending';
    document.getElementById('statusModal').style.display = 'flex';
}

function closeStatusModal() {
    document.getElementById('statusModal').style.display = 'none';
    currentRowIndex = null;
}

async function updateStatus() {
    if (currentRowIndex === null) return;
    
    const newStatus = document.getElementById('newStatus').value;
    
    try {
        // Update status in data
        currentComplaints[currentRowIndex].status = newStatus;
        
        // Save to storage
        // if (GOOGLE_SCRIPT_URL === 'https://script.google.com/macros/s/AKfycbyswFn65bVPqle5M1fUGFdzDkS4-stnb7aLcJY9yozMLuhjLtrTjx3SUSiTqvr0upoY/exec') {
        //     // Demo mode: Update localStorage
        //     localStorage.setItem('Complaints', JSON.stringify(currentComplaints));
        // } else {
            // Production mode: Update Google Sheets
            const updateData = {
                action: 'updateStatus',
                rowIndex: currentRowIndex,
                status: newStatus
            };
            
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });
        // }
        
        // Close modal and refresh
        closeStatusModal();
        loadComplaints();
        
    } catch (error) {
        console.error('Update status error:', error);
        alert('Failed to update status. Please try again.');
    }
}

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById('statusModal');
    if (modal && event.target === modal) {
        closeStatusModal();
    }
}