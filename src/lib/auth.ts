import { User } from "@/types";

const USER_STORAGE_KEY = "attendance_app_user";
const ALL_USERS_STORAGE_KEY = "attendance_app_all_users";

// Helper to get all stored users
const getStoredUsers = (): User[] => {
  const usersJson = localStorage.getItem(ALL_USERS_STORAGE_KEY);
  try {
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error("Failed to parse all users data from local storage:", error);
    return [];
  }
};

// Helper to save all users to local storage
const saveUsers = (users: User[]) => {
  try {
    localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save all users data to local storage:", error);
  }
};

export const login = (username: string, role: User['role']): User | null => {
  console.log("lib/auth: Attempting mock login for username:", username, "role:", role);
  if (username && (role === 'employee' || role === 'admin')) {
    const user: User = {
      id: username,
      name: username,
      role: role,
    };
    console.log("lib/auth: User object created:", user);

    // Add user to the list of all users if not already present
    const allUsers = getStoredUsers();
    if (!allUsers.some(u => u.id === user.id)) {
      allUsers.push(user);
      saveUsers(allUsers);
      console.log("lib/auth: User added to all users list.");
    } else {
      console.log("lib/auth: User already exists in all users list.");
    }

    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      console.log("lib/auth: Current user saved to localStorage:", user);
      return user;
    } catch (error) {
      console.error("lib/auth: Failed to save current user to localStorage:", error);
      return null;
    }
  }
  console.log("lib/auth: Login conditions not met (username empty or invalid role).");
  return null;
};

export const logout = () => {
  console.log("lib/auth: Removing current user from localStorage.");
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      console.log("lib/auth: Retrieved current user from localStorage:", user);
      return user;
    } catch (error) {
      console.error("lib/auth: Failed to parse user data from local storage:", error);
      return null;
    }
  }
  console.log("lib/auth: No current user found in localStorage.");
  return null;
};

export const getAllUsers = (): User[] => {
  console.log("lib/auth: Getting all users.");
  return getStoredUsers();
};

export const addUser = (username: string, role: User['role']): User | null => {
  console.log("lib/auth: Attempting to add new user:", username, role);
  const allUsers = getStoredUsers();
  if (allUsers.some(u => u.id === username)) {
    console.log("lib/auth: User already exists, cannot add.");
    return null; // User already exists
  }
  const newUser: User = { id: username, name: username, role };
  allUsers.push(newUser);
  saveUsers(allUsers);
  console.log("lib/auth: New user added:", newUser);
  return newUser;
};

export const deleteUser = (userId: string): boolean => {
  console.log("lib/auth: Attempting to delete user:", userId);
  let allUsers = getStoredUsers();
  const initialLength = allUsers.length;
  allUsers = allUsers.filter(u => u.id !== userId);
  saveUsers(allUsers);
  const success = allUsers.length < initialLength;
  if (success) {
    console.log("lib/auth: User deleted successfully.");
  } else {
    console.log("lib/auth: Failed to delete user (user not found).");
  }
  return success; // True if a user was removed
};