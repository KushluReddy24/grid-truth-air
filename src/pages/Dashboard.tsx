import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { PublicDashboard } from "@/components/dashboards/PublicDashboard";
import { ContributorDashboard } from "@/components/dashboards/ContributorDashboard";
import { VerifierDashboard } from "@/components/dashboards/VerifierDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { loading, role, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        {loading ? (
          <Skeleton className="h-[500px] w-full rounded-xl" />
        ) : !user || role === "public_user" ? (
          <PublicDashboard />
        ) : role === "contributor" ? (
          <ContributorDashboard />
        ) : role === "verifier" ? (
          <VerifierDashboard />
        ) : (
          <PublicDashboard />
        )}
      </main>
    </div>
  );
}