// ==================== CONFIGURATION ====================
// Supabase Configuration - Replace with your actual values
const SUPABASE_URL = 'https://fixvjglzzxiqpylblvqz.supabase.co';  // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeHZqZ2x6enhpcXB5bGJsdnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjc2NTcsImV4cCI6MjA3Nzc0MzY1N30.aoPwVDYshyNmYL79Xo3DSBfZ53hxFv26kt2QwJIXRiw'; // Your anon/public key

// Admin credentials (for demo - in production, use Supabase Auth)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// // Initialize Supabase client
// let supabase;
// if (typeof window !== 'undefined') {
//     // Load Supabase from CDN
//     const script = document.createElement('script');
//     script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
//     script.onload = () => {
//         supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
//         console.log('Supabase initialized');
//     };
//     document.head.appendChild(script);
// }

// // Global variables
// let currentComplaints = [];
// let currentComplaintId = null;

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
}

// ==================== FORM TYPE TOGGLE ====================
function toggleFormFields() {
    const formType = document.getElementById('formType').value;
    const complaintTypeGroup = document.getElementById('complaintTypeGroup');
    const feedbackTypeGroup = document.getElementById('feedbackTypeGroup');
    const complaintTypeSelect = document.getElementById('complaintType');
    const feedbackTypeSelect = document.getElementById('feedbackType');
    const descriptionLabel = document.getElementById('descriptionLabel');
    const submitText = document.getElementById('submitText');
    
    if (formType === 'Complaint') {
        // Show complaint type, hide feedback type
        complaintTypeGroup.style.display = 'block';
        feedbackTypeGroup.style.display = 'none';
        
        // Make complaint type required, feedback type optional
        complaintTypeSelect.required = true;
        feedbackTypeSelect.required = false;
        feedbackTypeSelect.value = '';
        
        // Update labels
        descriptionLabel.innerHTML = 'Complaint Description <span class="required">*</span>';
        submitText.textContent = 'Submit Complaint';
        
    } else if (formType === 'Feedback') {
        // Show feedback type, hide complaint type
        complaintTypeGroup.style.display = 'none';
        feedbackTypeGroup.style.display = 'block';
        
        // Make feedback type required, complaint type optional
        feedbackTypeSelect.required = true;
        complaintTypeSelect.required = false;
        complaintTypeSelect.value = '';
        
        // Update labels
        descriptionLabel.innerHTML = 'Feedback Description <span class="required">*</span>';
        submitText.textContent = 'Submit Feedback';
        
    } else {
        // Hide both if nothing selected
        complaintTypeGroup.style.display = 'none';
        feedbackTypeGroup.style.display = 'none';
        complaintTypeSelect.required = false;
        feedbackTypeSelect.required = false;
        submitText.textContent = 'Submit';
    }
}

// Global variables
let supabase = null;
let currentComplaints = [];
let currentComplaintId = null;

// ==================== SUPABASE INITIALIZATION ====================
// Wait for Supabase to load from CDN
function initSupabase() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase initialized');
            resolve();
            return;
        }
        
        // Wait for script to load
        let checkInterval = setInterval(() => {
            if (window.supabase) {
                clearInterval(checkInterval);
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Supabase initialized');
                resolve();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!supabase) {
                reject(new Error('Supabase failed to load'));
            }
        }, 10000);
    });
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
        preview.innerHTML = `<img src="${reader.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
        preview.style.display = 'block';
        document.getElementById('uploadText').textContent = '✓ Photo uploaded';
    };
    reader.readAsDataURL(file);
}

async function handleComplaintSubmit(event) {
    event.preventDefault();
    hideError();

        
    // CHECK IF SUPABASE IS LOADED - ADD THIS
    if (!supabase) {
        await initSupabase();
        if (!supabase) {
            showError('Database connection failed. Please refresh the page.');
            return;
        }
    }
    
    const submitBtn = event.target.querySelector('.btn-primary');
    const submitText = document.getElementById('submitText');
    const originalText = submitText.textContent;
    
    // Disable submit button
    submitBtn.disabled = true;
    submitText.textContent = 'Submitting...';
    
    try {
        // Get form data
        const urlParams = new URLSearchParams(window.location.search);
        const assetId = urlParams.get('stall') || urlParams.get('asset') || urlParams.get('assetcode');
        
        const formType = document.getElementById('formType').value;
        
        const formData = {
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            name: document.getElementById('name').value.trim() || 'Anonymous',
            mobile: document.getElementById('mobile').value.trim() || 'Not provided',
            pnr_uts: document.getElementById('pnrUts').value.trim() || 'Not provided',
            form_type: formType,
            description: document.getElementById('description').value.trim(),
            location: document.getElementById('location').value.trim(),
            asset_id: assetId || 'Not specified',
            status: 'Pending',
            photo_url: null
        };

        if (formType === 'Complaint') {
            const complaintType = document.getElementById('complaintType').value;
            if (complaintType) {
                formData.complaint_type = complaintType;
            }
        } else if (formType === 'Feedback') {
            const feedbackType = document.getElementById('feedbackType').value;
            if (feedbackType) {
                formData.feedback_type = feedbackType;
            }
        }
        
        // Validate form type selection
        if (!formData.form_type) {
            showError('Please select form type (Complaint or Feedback)');
            submitBtn.disabled = false;
            submitText.textContent = originalText;
            return;
        }

        // Validate based on form type
        if (formData.form_type === 'Complaint') {
            if (!formData.complaint_type) {
                showError('Please select a complaint type');
                submitBtn.disabled = false;
                submitText.textContent = originalText;
                return;
            }
        } else if (formData.form_type === 'Feedback') {
            if (!formData.feedback_type) {
                showError('Please select a feedback type (Suggestion or Appreciation)');
                submitBtn.disabled = false;
                submitText.textContent = originalText;
                return;
            }
        }

        // Validate description
        if (!formData.description) {
            showError('Please enter description');
            submitBtn.disabled = false;
            submitText.textContent = originalText;
            return;
        }

        // Validate mobile if provided
        if (formData.mobile !== 'Not provided' && !/^[0-9]{10}$/.test(formData.mobile)) {
            showError('Please enter a valid 10-digit mobile number');
            submitBtn.disabled = false;
            submitText.textContent = originalText;
            return;
        }

        // Handle photo upload to Supabase Storage
        const photoInput = document.getElementById('photoInput');
        if (photoInput && photoInput.files && photoInput.files[0]) {
            const file = photoInput.files[0];
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('complaint-photos')
                .upload(fileName, file);
            
            if (uploadError) {
                console.error('Photo upload error:', uploadError);
                showError('Failed to upload photo. Submitting complaint without photo...');
            } else {
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('complaint-photos')
                    .getPublicUrl(fileName);
                formData.photo_url = urlData.publicUrl;
            }
        }
        
        console.log("formData:", formData);
        // Submit to Supabase
        const { data, error } = await supabase
            .from('complaints')
            .insert([formData], { defaultToNull: false })
            .select();
        
        if (error) {
            throw error;
        }
        
        // Store for WhatsApp sharing
        sessionStorage.setItem('lastComplaint', JSON.stringify(formData));
        
        // Show success
        showSuccess(formData);
        
    } catch (error) {
        console.error('Submission error:', error);
        showError('Failed to submit complaint. Please try again.');
        submitBtn.disabled = false;
        submitText.textContent = originalText;
    }
}

function showSuccess(formData) {
    document.getElementById('formContent').style.display = 'none';
    document.getElementById('successContent').style.display = 'block';
    document.getElementById('refId').textContent = formData.asset_id;
    document.getElementById('refType').textContent = formData.complaint_type;
    
    // Setup WhatsApp button
    const whatsappBtn = document.getElementById('whatsappBtn');
    whatsappBtn.onclick = () => shareOnWhatsApp(formData);
}

function shareOnWhatsApp(formData) {
    const emoji = formData.form_type === 'Feedback' ? '💬' : '🚆';
    let message = `${emoji} RAISE ${formData.form_type} Registered

Asset ID: ${formData.asset_id}
Form Type: ${formData.form_type}`;
    
    if (formData.complaint_type) {
        message += `\nComplaint Type: ${formData.complaint_type}`;
    }
    
    if (formData.feedback_type) {
        message += `\nFeedback Type: ${formData.feedback_type}`;
    }
    
    message += `\nDescription: ${formData.description}`;
    
    if (formData.location && formData.location !== 'Location not available') {
        message += `\nLocation: ${formData.location}`;
    }
    
    if (formData.pnr_uts && formData.pnr_uts !== 'Not provided') {
        message += `\nPNR/UTS: ${formData.pnr_uts}`;
    }
    
    if (formData.photo_url) {
        message += `\nPhoto: ${formData.photo_url}`;
    }
    
    if (formData.name !== 'Anonymous') {
        message += `\nSubmitted by: ${formData.name}`;
    }
    
    if (formData.mobile !== 'Not provided') {
        message += `\nMobile: ${formData.mobile}`;
    }
    
    message += `\n\nTimestamp: ${formData.timestamp}`;
    message += `\n\n#RAISE #Railway${formData.form_type}`;
    
    const whatsappNumber = "+916374713251";
    const whatsappURL = "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message);
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
        // CHECK IF SUPABASE IS LOADED - ADD THIS
    if (!supabase) {
        try {
            await initSupabase();
        } catch (error) {
            console.error('Supabase initialization failed:', error);
            const errorDiv = document.getElementById('errorDiv');
            errorDiv.style.display = 'block';
            document.getElementById('errorMessage').textContent = 
                'Failed to initialize database connection. Please refresh the page.';
            return;
        }
    }

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
        // Fetch from Supabase
        const { data: complaints, error } = await supabase
            .from('complaints')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        currentComplaints = complaints || [];
        
        // Hide loading
        loadingDiv.style.display = 'none';
        
        if (currentComplaints.length === 0) {
            emptyState.style.display = 'block';
        } else {
            renderTable(currentComplaints);
            updateStats(currentComplaints);
            tableContainer.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Load complaints error:', error);
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        document.getElementById('errorMessage').textContent = 
            'Failed to load complaints. Please check your Supabase configuration and try again.';
    }
}

function renderTable(complaints) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    complaints.forEach((complaint, index) => {
        const row = tbody.insertRow();
        // row.innerHTML = `
        //     <td class="table-cell">${complaints.length - index}</td>
        //     <td class="table-cell">${escapeHtml(complaint.timestamp)}</td>
        //     <td class="table-cell">${escapeHtml(complaint.name)}</td>
        //     <td class="table-cell">${escapeHtml(complaint.mobile)}</td>
        //     <td class="table-cell">${escapeHtml(complaint.pnr_uts || 'Not provided')}</td>
        //     <td class="table-cell">${escapeHtml(complaint.complaint_type)}</td>
        //     <td class="table-cell" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" 
        //         title="${escapeHtml(complaint.description)}">
        //         ${escapeHtml(complaint.description)}
        //     </td>
        //     <td class="table-cell">${escapeHtml(complaint.location || 'N/A')}</td>
        //     <td class="table-cell">${escapeHtml(complaint.asset_id)}</td>
        //     <td class="table-cell">
        //         ${complaint.photo_url ? 
        //             `<a href="${escapeHtml(complaint.photo_url)}" target="_blank" class="photo-link">📷 View</a>` : 
        //             'No photo'}
        //     </td>
        //     <td class="table-cell">
        //         <span class="status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}">
        //             ${escapeHtml(complaint.status)}
        //         </span>
        //     </td>
        //     <td class="table-cell">
        //         <button class="btn-action" onclick="openStatusModal('${complaint.id}', '${escapeHtml(complaint.status)}', ${index})">
        //             Update
        //         </button>
        //     </td>
        // `;
         row.innerHTML = `
            <td class="table-cell">${complaints.length - index}</td>
            <td class="table-cell">${escapeHtml(complaint.timestamp)}</td>
            <td class="table-cell">
                <span class="badge ${complaint.form_type === 'Complaint' ? 'badge-complaint' : 'badge-feedback'}">
                    ${escapeHtml(complaint.form_type || 'Complaint')}
                </span>
            </td>
            <td class="table-cell">${escapeHtml(complaint.name)}</td>
            <td class="table-cell">${escapeHtml(complaint.mobile)}</td>
            <td class="table-cell">${escapeHtml(complaint.pnr_uts || 'Not provided')}</td>
            <td class="table-cell">
                ${escapeHtml(complaint.complaint_type || complaint.feedback_type || 'N/A')}
            </td>
            <td class="table-cell" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" 
                title="${escapeHtml(complaint.description)}">
                ${escapeHtml(complaint.description)}
            </td>
            <td class="table-cell">${escapeHtml(complaint.location || 'N/A')}</td>
            <td class="table-cell">${escapeHtml(complaint.asset_id)}</td>
            <td class="table-cell">
                ${complaint.photo_url ? 
                    `<a href="${escapeHtml(complaint.photo_url)}" target="_blank" class="photo-link">📷 View</a>` : 
                    'No photo'}
            </td>
            <td class="table-cell">
                <span class="status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}">
                    ${escapeHtml(complaint.status)}
                </span>
            </td>
            <td class="table-cell">
                <button class="btn-action" onclick="openStatusModal('${complaint.id}', '${escapeHtml(complaint.status)}', ${index})">
                    Update
                </button>
            </td>
        `;

    });
}

function updateStats(complaints) {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('progressCount').textContent = inProgress;
    document.getElementById('resolvedCount').textContent = resolved;
}

// function openStatusModal(complaintId, currentStatus, index) {
//     currentComplaintId = complaintId;
//     document.getElementById('currentStatus').textContent = currentStatus;
//     document.getElementById('newStatus').value = currentStatus;
//     document.getElementById('statusModal').style.display = 'flex';
// }

function openStatusModal(complaintId, currentStatus, index) {
    currentComplaintId = complaintId;
    
    // Get the complaint details
    const complaint = currentComplaints[index];
    
    // Populate modal
    document.getElementById('modalAssetId').textContent = complaint.asset_id || 'N/A';
    document.getElementById('modalCurrentStatus').textContent = currentStatus;
    document.getElementById('newStatus').value = currentStatus;
    
    // Show modal
    document.getElementById('statusModal').style.display = 'flex';
}


function closeStatusModal() {
    document.getElementById('statusModal').style.display = 'none';
    currentComplaintId = null;
}

// async function updateStatus() {
//     const newStatus = document.getElementById('newStatus').value;
    
//     if (!currentComplaintId) return;
    
//     const updateBtn = document.querySelector('#statusModal .btn-primary');
//     const originalText = updateBtn.textContent;
//     updateBtn.disabled = true;
//     updateBtn.textContent = 'Updating...';
    
//     try {
//         const { error } = await supabase
//             .from('complaints')
//             .update({ status: newStatus })
//             .eq('id', currentComplaintId);
        
//         if (error) {
//             throw error;
//         }
        
//         // Show success notification
//         showNotification('Status updated successfully!', 'success');
        
//         // Close modal
//         closeStatusModal();
        
//         // Reload complaints
//         await loadComplaints();
        
//     } catch (error) {
//         console.error('Update status error:', error);
//         showNotification('Failed to update status. Please try again.', 'error');
//         updateBtn.disabled = false;
//         updateBtn.textContent = originalText;
//     }
// }

async function updateStatus() {
    const newStatus = document.getElementById('newStatus').value;
    
    if (!currentComplaintId) {
        showError('No complaint selected');
        return;
    }
    
    const updateBtn = document.querySelector('#statusModal .btn-primary');
    const originalText = updateBtn.textContent;
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';
    
    try {
        // Update in Supabase
        const { error } = await supabase
            .from('complaints')
            .update({ status: newStatus })
            .eq('id', currentComplaintId);
        
        if (error) {
            throw error;
        }
        
        // Show success notification
        showNotification('Status updated successfully!', 'success');
        
        // Close modal
        closeStatusModal();
        
        // Reload complaints
        await loadComplaints();
        
    } catch (error) {
        console.error('Update status error:', error);
        showNotification('Failed to update status. Please try again.', 'error');
        updateBtn.disabled = false;
        updateBtn.textContent = originalText;
    }
}


function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function searchComplaints() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = currentComplaints.filter(complaint => {
        return (
            complaint.name.toLowerCase().includes(searchTerm) ||
            complaint.mobile.includes(searchTerm) ||
            (complaint.pnr_uts && complaint.pnr_uts.toLowerCase().includes(searchTerm)) || 
            complaint.complaint_type.toLowerCase().includes(searchTerm) ||
            complaint.description.toLowerCase().includes(searchTerm) ||
            complaint.asset_id.toLowerCase().includes(searchTerm)
        );
    });
    
    renderTable(filtered);
    updateStats(filtered);
}

function filterByStatus() {
    const status = document.getElementById('statusFilter').value;
    
    let filtered = currentComplaints;
    if (status !== 'all') {
        filtered = currentComplaints.filter(c => c.status === status);
    }
    
    renderTable(filtered);
    updateStats(filtered);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ==================== DASHBOARD FILTERS ====================
function initDashboardFilters() {
    // Search input listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchComplaints);
    }
    
    // Status filter listener
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterByStatus);
    }
}

// ==================== QR CODE GENERATOR (qr_generator.html) ====================
function generateQRCode() {
    const assetId = document.getElementById('assetInput').value.trim();
    const qrContainer = document.getElementById('qrCode');
    const downloadBtn = document.getElementById('downloadBtn');
    
    if (!assetId) {
        alert('Please enter an Asset/Stall ID');
        return;
    }
    
    // Clear previous QR code
    qrContainer.innerHTML = '';
    
    // Generate complaint form URL
    const baseUrl = window.location.origin + window.location.pathname.replace('qr_generator.html', 'raise_index_html.html');
    const complaintUrl = `${baseUrl}?asset=${encodeURIComponent(assetId)}`;
    
    // Generate QR code
    new QRCode(qrContainer, {
        text: complaintUrl,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Show download button
    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = () => downloadQR(assetId);
}

function downloadQR(assetId) {
    const canvas = document.querySelector('#qrCode canvas');
    if (canvas) {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `QR_${assetId}.png`;
        a.click();
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
if (!document.head.querySelector('style[data-notifications]')) {
    style.setAttribute('data-notifications', 'true');
    document.head.appendChild(style);
}


// ==================== INITIALIZATION ====================
// document.addEventListener('DOMContentLoaded', () => {
//     // Determine which page we're on and initialize accordingly
//     if (document.getElementById('complaintForm')) {
//         initComplaintForm();
//     } else if (document.getElementById('loginForm')) {
//         initAdminLogin();
//     } else if (document.getElementById('complaintsTable')) {
//         checkAuth();
//         loadComplaints();
//     }
// });


document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase first
    try {
        await initSupabase();
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showError('Failed to connect to database. Please refresh the page.');
        return;
    }
    
    // Determine which page we're on and initialize accordingly
    if (document.getElementById('complaintForm')) {
        initComplaintForm();
    } else if (document.getElementById('loginForm')) {
        initAdminLogin();
    } else if (document.getElementById('complaintsTable')) {
        checkAuth();
        initDashboardFilters();
        await loadComplaints();
    }
});


// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
