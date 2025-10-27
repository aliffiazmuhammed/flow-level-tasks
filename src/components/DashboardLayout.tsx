import { ReactNode } from "react";
import { LayoutDashboard, ListTodo, LogOut, MessageSquare, Network, Activity, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "department_head" | "executive";
}

export const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const { signOut } = useAuth();

  const getNavItems = () => {
    const baseUrl = role === "admin" ? "/admin" : role === "department_head" ? "/department" : "/executive";
    return [
      { icon: LayoutDashboard, label: "Dashboard", path: `${baseUrl}/dashboard` },
      { icon: ListTodo, label: "Tickets", path: `${baseUrl}/tasks` },
      { icon: MessageSquare, label: "Messages", path: `${baseUrl}/messages`, badge: 3 },
      { icon: Network, label: "Hierarchy & Departments", path: `${baseUrl}/hierarchy` },
      { icon: Activity, label: "Activity Timeline", path: `${baseUrl}/activity` },
      { icon: User, label: "Account", path: `${baseUrl}/account` },
    ];
  };

  const roleLabels = {
    admin: "Admin",
    department_head: "Department Head",
    executive: "Executive"
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar - Fixed */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card z-50 shadow-soft"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-border p-6">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TaskFlow
            </h1>
            <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wide">{roleLabels[role]}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {getNavItems().map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {item.badge && (
                  <Badge className="bg-accent text-accent-foreground border-0 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content - Scrollable with left margin */}
      <main className="flex-1 ml-64 h-screen overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
