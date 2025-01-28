document.addEventListener('DOMContentLoaded', () => {
  const userTable = document.getElementById('userTable');
  
  // Fetch and display users
async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch users');
    }

    const result = await response.json();
    
    if (!Array.isArray(result.data)) {
      throw new Error('Invalid data format received');
    }

    renderUsers(result.data);
  } catch (error) {
    alert(error.message);
    window.location.href = '/login'; // Redirect if unauthorized
  }
}

  // Render users in table
  function renderUsers(users) {
    if (!users || users.length === 0) {
      userTable.innerHTML = `<div class="alert alert-info">No users found</div>`;
      return;
    }
  
    userTable.innerHTML = `
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Verified</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${user.firstName} ${user.lastName}</td>
              <td>${user.email}</td>
              <td>${user.verified ? 'Yes' : 'No'}</td>
              <td>${user.admin ? 'Yes' : 'No'}</td>
              <td>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user._id}')">
                  Delete
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Delete user function
  window.deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      loadUsers(); // Refresh the list
      alert('User deleted successfully');
    } catch (error) {
      alert(error.message);
    }
  };

  // Initial load
  loadUsers();
});