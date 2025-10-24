import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTasks from "./pages/admin/AdminTasks";
import DepartmentDashboard from "./pages/department/DepartmentDashboard";
import DepartmentTasks from "./pages/department/DepartmentTasks";
import ExecutiveDashboard from "./pages/executive/ExecutiveDashboard";
import ExecutiveTasks from "./pages/executive/ExecutiveTasks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/tasks" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTasks />
              </ProtectedRoute>
            } />
            
            <Route path="/department/dashboard" element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <DepartmentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/department/tasks" element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <DepartmentTasks />
              </ProtectedRoute>
            } />
            
            <Route path="/executive/dashboard" element={
              <ProtectedRoute allowedRoles={['executive']}>
                <ExecutiveDashboard />
              </ProtectedRoute>
            } />
            <Route path="/executive/tasks" element={
              <ProtectedRoute allowedRoles={['executive']}>
                <ExecutiveTasks />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
