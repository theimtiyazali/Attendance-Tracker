import { User } from "@/types";

const USER_STORAGE_KEY = "attendance_app_user";
const ALL_USERS_STORAGE_KEY = "attendance_app_all_users";

// Helper to get all stored users
const getStoredUsers = (): User[] => {
  const usersJson = localStorage.getItem(ALL_USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

// Helper to save all users to local storage
const saveUsers = (users: User[]) => {
  localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(users));
};

export const login = (username: string, role: User['role']): User | null => {
  // Mock authentication: In a real app, this would involve API calls
  if (username && (role === 'employee' || role === 'admin')) {
    const user: User = {
      id: username,
      name: username,
      role: role,
    };

    // Add user to the list of all users if not already present
    const allUsers = getStoredUsers();
    if (!allUsers.some(u => u.id === user.id)) {
      allUsers.push(user);
      saveUsers(allUsers);
    }

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error("Failed to parse user data from local storage:", error);
      return null;
    }
  }
  return null;
};

export const getAllUsers = (): User[] => {
  return getStoredUsers();
};