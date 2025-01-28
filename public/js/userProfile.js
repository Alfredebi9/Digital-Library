document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const editName = document.getElementById('editName');
  const editEmail = document.getElementById('editEmail');
  
  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) window.location.href = '/login';

  // Load initial user data
  loadUserData();

  // Avatar upload handler
  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const response = await fetch('/api/user/avatar', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();
        if (response.ok) {
          // Update preview and localStorage
          avatarPreview.src = data.avatarUrl;
          user.avatar = data.avatarUrl;
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        alert(`Avatar update failed: ${error.message}`);
      }
    }
  });

  // Load user data from server
  async function loadUserData() {
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        userName.textContent = `${data.firstName} ${data.lastName}`;
        userEmail.textContent = data.email;
        avatarPreview.src = data.avatar;
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          avatar: data.avatar
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  // Edit modal show handler
  document.getElementById('editModal').addEventListener('show.bs.modal', async () => {
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        editName.value = `${data.firstName} ${data.lastName}`;
        editEmail.value = data.email;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  });
});

async function updateProfile(e) {
  e.preventDefault();
  const [firstName, lastName] = document.getElementById('editName').value.split(' ');
  const email = document.getElementById('editEmail').value;

  try {
    const response = await fetch('/api/user', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ firstName, lastName, email })
    });

    const data = await response.json();
    if (response.ok) {
      // Update UI and localStorage
      document.getElementById('userName').textContent = `${firstName} ${lastName}`;
      document.getElementById('userEmail').textContent = email;
      
      const user = JSON.parse(localStorage.getItem('user'));
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Close modal
      bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    alert(`Update failed: ${error.message}`);
  }
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/login';
}