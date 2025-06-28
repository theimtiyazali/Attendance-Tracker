import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { motion } from "framer-motion";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold mb-4 text-primary">Loading Application...</h1>
        <p className="text-xl text-muted-foreground">
          Please wait while we redirect you.
        </p>
      </motion.div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;