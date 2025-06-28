import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  const { isAuthenticated, isAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();

  // This component will typically redirect immediately, so a loading state is appropriate.
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin-dashboard", { replace: true });
      } else if (isEmployee) {
        navigate("/employee-dashboard", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isAdmin, isEmployee, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">Loading Application...</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Please wait while we redirect you.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;