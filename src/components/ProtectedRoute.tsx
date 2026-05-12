import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { loading, user, role } = useAuth();

  if (loading) {
    return <Skeleton className="h-[500px] w-full rounded-xl" />;
  }

  // If not logged in, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If specific roles are required and user doesn't have one, redirect
  if (requiredRoles.length > 0 && !requiredRoles.includes(role || "public_user")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
