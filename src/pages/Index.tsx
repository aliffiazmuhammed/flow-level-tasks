import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Users, LayoutDashboard } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectUser = async () => {
      if (user) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          switch (profile.role) {
            case 'admin':
              navigate('/admin/dashboard');
              break;
            case 'department_head':
              navigate('/department/dashboard');
              break;
            case 'executive':
              navigate('/executive/dashboard');
              break;
          }
        }
      }
    };

    redirectUser();
  }, [user, navigate]);

  const features = [
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Admin, Department Heads, and Executives with tailored permissions"
    },
    {
      icon: LayoutDashboard,
      title: "Intuitive Dashboards",
      description: "Clean, modern interfaces for efficient task management"
    },
    {
      icon: CheckCircle2,
      title: "Task Delegation",
      description: "Seamless workflow from creation to completion"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
            ProjectFlow
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Enterprise Project Planning & Management System
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
            Streamline your project workflows with hierarchical task assignment.
            From admins to department heads to executives—everyone stays aligned.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => navigate('/login')} className="gap-2">
              Sign In
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/signup')}>
              Create Account
            </Button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              className="bg-card rounded-2xl p-8 shadow-lg border border-border"
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
