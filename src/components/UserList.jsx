import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// This component will fetch and display the list of users
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoading(true);
        // We read the secret keys from the environment
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

        if (!serviceKey) {
          throw new Error("Supabase service key not found. Please check your Replit Secrets.");
        }

        // We create a new, temporary Supabase client with admin privileges
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        // This is the special function to get all users
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) throw error;

        setUsers(data.users);
      } catch (error) {
        alert('Error loading users: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, []);

  if (loading) {
    return <p>Loading users...</p>;
  }

  return (
    <div className="user-list-container">
      <h2>Registered Users ({users.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Signed Up</th>
            <th>Last Sign In</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{new Date(user.created_at).toLocaleString()}</td>
              <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserList;