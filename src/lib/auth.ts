import { User } from "@/types";

const USER_STORAGE_KEY = "attendance_app_user";

export const login = (username: string, role: User['role']): User | null => {
  // Mock authentication: In a real app, this would involve API calls
  if (username && (role === 'employee' || role === 'admin')) {
    const user: User = {
      id: username,
      name: username,
      role: role,
    };
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