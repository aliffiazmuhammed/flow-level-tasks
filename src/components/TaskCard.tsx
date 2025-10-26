import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, User } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    deadline: string | null;
    task_type?: string;
    assigned_to_profile?: {
      name: string;
      email: string;
    } | null;
    delegated_to_profile?: {
      name: string;
      email: string;
    } | null;
  };
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onDelegate?: (taskId: string) => void;
  onViewDetails?: (taskId: string) => void;
  showActions?: boolean;
}

export const TaskCard = ({ 
  task, 
  onStatusChange, 
  onDelegate,
  onViewDetails,
  showActions = true 
}: TaskCardProps) => {
  const priorityColors = {
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    urgent: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const statusColors = {
    pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  const typeColors = {
    ad_hoc: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    strategic: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{task.title}</h3>
            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {task.task_type && (
              <Badge className={typeColors[task.task_type as keyof typeof typeColors]}>
                {task.task_type.replace('_', ' ')}
              </Badge>
            )}
            <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
              {task.priority}
            </Badge>
            <Badge className={statusColors[task.status as keyof typeof statusColors]}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          {task.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(task.deadline), "MMM dd, yyyy")}
            </div>
          )}
          {(task.assigned_to_profile || task.delegated_to_profile) && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {task.delegated_to_profile?.name || task.assigned_to_profile?.name}
            </div>
          )}
        </div>

        {showActions && (
          <div className="mt-4 flex gap-2">
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewDetails(task.id)}
              >
                View Details
              </Button>
            )}
            {onDelegate && task.status === 'pending' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelegate(task.id)}
              >
                Delegate
              </Button>
            )}
            {onStatusChange && (
              <>
                {task.status === 'pending' && (
                  <Button 
                    size="sm"
                    onClick={() => onStatusChange(task.id, 'in_progress')}
                  >
                    Start
                  </Button>
                )}
                {task.status === 'in_progress' && (
                  <Button 
                    size="sm"
                    onClick={() => onStatusChange(task.id, 'completed')}
                  >
                    Complete
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};
