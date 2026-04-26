import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Wind, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-elegant">
            <Wind className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg tracking-tight">EMIQ</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">JEEDIMETLA</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <span className="hidden sm:inline-flex text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground capitalize">
                {role?.replace("_", " ")}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate("/auth?mode=signup")} className="shadow-elegant">
                Get Started
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}