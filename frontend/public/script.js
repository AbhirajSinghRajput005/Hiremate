// HireMate Frontend - Vanilla JavaScript Logic// ============= UTILITY FUNCTIONS =============// Get JWT token from localStoragefunction getToken() {  return localStorage.getItem('jwt_token');
}

// Set JWT token in localStorage
function setToken(token) {
  localStorage.setItem('jwt_token', token);
}

// Remove JWT token from localStorage
function removeToken() {
  localStorage.removeItem('jwt_token');
}

// Decode JWT payload (simple base64 decode)
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

// Get current user info from token
function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token);
}

// Check if user is logged in
function isLoggedIn() {
  return getToken() !== null;
}

// Check if current user is a client
function isClient() {
  const user = getCurrentUser();
  return user && user.role === 'client';
}

// Check if current user is a freelancer
function isFreelancer() {
  const user = getCurrentUser();
  return user && user.role === 'freelancer';
}

// Get current user ID
function getCurrentUserId() {
  const user = getCurrentUser();
  return user ? user.id : null;
}

// ============= API REQUEST FUNCTIONS =============

// Generic API request function
async function apiRequest(url, method = 'GET', body = null, requiresAuth = false) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (requiresAuth) {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ============= ALERT/MESSAGE FUNCTIONS =============

// Show alert message
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show alert-message`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// ============= AUTHENTICATION FUNCTIONS =============

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  apiRequest('/api/auth/login', 'POST', { email, password })
    .then(response => {
      setToken(response.token);
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/jobs';
      }, 1000);
    })
    .catch(error => {
      showAlert(error.message || 'Login failed', 'danger');
    });
}

// Handle signup form submission
function handleSignup(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  
  apiRequest('/api/auth/register', 'POST', { username, email, password, role })
    .then(response => {
      setToken(response.token);
      showAlert('Registration successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/jobs';
      }, 1000);
    })
    .catch(error => {
      showAlert(error.message || 'Registration failed', 'danger');
    });
}

// Handle logout
function handleLogout() {
  removeToken();
  showAlert('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}

// ============= NAVIGATION BAR FUNCTIONS =============

// Update navigation bar based on auth state
function updateNavigation() {
  const loggedInElements = document.querySelectorAll('.auth-required');
  const loggedOutElements = document.querySelectorAll('.guest-only');
  const clientOnlyElements = document.querySelectorAll('.client-only');
  const freelancerOnlyElements = document.querySelectorAll('.freelancer-only');
  
  if (isLoggedIn()) {
    loggedInElements.forEach(el => el.classList.remove('hidden'));
    loggedOutElements.forEach(el => el.classList.add('hidden'));
    
    if (isClient()) {
      clientOnlyElements.forEach(el => el.classList.remove('hidden'));
      freelancerOnlyElements.forEach(el => el.classList.add('hidden'));
    } else if (isFreelancer()) {
      clientOnlyElements.forEach(el => el.classList.add('hidden'));
      freelancerOnlyElements.forEach(el => el.classList.remove('hidden'));
    }
  } else {
    loggedInElements.forEach(el => el.classList.add('hidden'));
    loggedOutElements.forEach(el => el.classList.remove('hidden'));
    clientOnlyElements.forEach(el => el.classList.add('hidden'));
    freelancerOnlyElements.forEach(el => el.classList.add('hidden'));
  }
}

// ============= JOB LISTING FUNCTIONS =============

// Filter jobs based on search input
function filterJobs() {
  const searchInput = document.getElementById('search-input');
  const tagInput = document.getElementById('tag-input');
  
  if (!searchInput) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  const tagTerm = tagInput ? tagInput.value.toLowerCase() : '';
  
  const jobCards = document.querySelectorAll('.job-card');
  
  jobCards.forEach(card => {
    const title = card.getAttribute('data-title').toLowerCase();
    const tags = card.getAttribute('data-tags').toLowerCase();
    
    const matchesSearch = title.includes(searchTerm);
    const matchesTag = !tagTerm || tags.includes(tagTerm);
    
    if (matchesSearch && matchesTag) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// ============= JOB DETAILS FUNCTIONS =============

// Handle job application
function handleApplyToJob(jobId) {
  if (!isLoggedIn()) {
    showAlert('Please login to apply to jobs', 'warning');
    return;
  }
  
  if (!isFreelancer()) {
    showAlert('Only freelancers can apply to jobs', 'warning');
    return;
  }
  
  apiRequest(`/api/jobs/${jobId}/apply`, 'POST', {}, true)
    .then(response => {
      showAlert('Application submitted successfully!', 'success');
      
      const applyBtn = document.getElementById('apply-btn');
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.textContent = 'Applied';
      }
      
      setTimeout(() => {
        location.reload();
      }, 1500);
    })
    .catch(error => {
      showAlert(error.message || 'Failed to submit application', 'danger');
    });
}

// Handle accept application
function handleAcceptApplicant(jobId, applicantId) {
  apiRequest(`/api/jobs/${jobId}/applicants/${applicantId}/accept`, 'PUT', {}, true)
    .then(response => {
      showAlert('Application accepted successfully!', 'success');
      setTimeout(() => {
        location.reload();
      }, 1000);
    })
    .catch(error => {
      showAlert(error.message || 'Failed to accept application', 'danger');
    });
}

// Handle reject application
function handleRejectApplicant(jobId, applicantId) {
  apiRequest(`/api/jobs/${jobId}/applicants/${applicantId}/reject`, 'PUT', {}, true)
    .then(response => {
      showAlert('Application rejected', 'info');
      setTimeout(() => {
        location.reload();
      }, 1000);
    })
    .catch(error => {
      showAlert(error.message || 'Failed to reject application', 'danger');
    });
}

// Handle mark job as completed
function handleCompleteJob(jobId) {
  if (!confirm('Are you sure you want to mark this job as completed?')) {
    return;
  }
  
  apiRequest(`/api/jobs/${jobId}/complete`, 'PUT', {}, true)
    .then(response => {
      showAlert('Job marked as completed!', 'success');
      setTimeout(() => {
        location.reload();
      }, 1000);
    })
    .catch(error => {
      showAlert(error.message || 'Failed to complete job', 'danger');
    });
}

// Handle comment submission
function handleCommentSubmit(event, jobId) {
  event.preventDefault();
  
  if (!isLoggedIn()) {
    showAlert('Please login to comment', 'warning');
    return;
  }
  
  const textarea = document.getElementById('comment-text');
  const text = textarea.value.trim();
  
  if (!text) {
    showAlert('Comment cannot be empty', 'warning');
    return;
  }
  
  apiRequest(`/api/jobs/${jobId}/comments`, 'POST', { text }, true)
    .then(response => {
      showAlert('Comment posted successfully!', 'success');
      textarea.value = '';
      
      // Add comment to list dynamically
      const commentsList = document.getElementById('comments-list');
      if (commentsList) {
        const user = getCurrentUser();
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-box';
        commentDiv.innerHTML = `
          <div class="comment-author">${user.username || 'Anonymous'}</div>
          <div class="comment-date">Just now</div>
          <p class="comment-text">${text}</p>
        `;
        commentsList.insertBefore(commentDiv, commentsList.firstChild);
      }
    })
    .catch(error => {
      showAlert(error.message || 'Failed to post comment', 'danger');
    });
}

// ============= INITIALIZATION =============

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
  // Update navigation based on auth state
  updateNavigation();
  
  // Login form handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Signup form handler
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  // Logout button handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      handleLogout();
    });
  }
  
  // Search and filter handlers
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', filterJobs);
  }
  
  const tagInput = document.getElementById('tag-input');
  if (tagInput) {
    tagInput.addEventListener('input', filterJobs);
  }
  
  // Apply button handler
  const applyBtn = document.getElementById('apply-btn');
  if (applyBtn) {
    const jobId = applyBtn.getAttribute('data-job-id');
    applyBtn.addEventListener('click', function() {
      handleApplyToJob(jobId);
    });
  }
  
  // Complete job button handler
  const completeBtn = document.getElementById('complete-job-btn');
  if (completeBtn) {
    const jobId = completeBtn.getAttribute('data-job-id');
    completeBtn.addEventListener('click', function() {
      handleCompleteJob(jobId);
    });
  }
  
  // Comment form handler
  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    const jobId = commentForm.getAttribute('data-job-id');
    commentForm.addEventListener('submit', function(event) {
      handleCommentSubmit(event, jobId);
    });
  }
  
  // Accept/Reject buttons handlers
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const jobId = this.getAttribute('data-job-id');
      const applicantId = this.getAttribute('data-applicant-id');
      handleAcceptApplicant(jobId, applicantId);
    });
  });
  
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const jobId = this.getAttribute('data-job-id');
      const applicantId = this.getAttribute('data-applicant-id');
      handleRejectApplicant(jobId, applicantId);
    });
  });
});