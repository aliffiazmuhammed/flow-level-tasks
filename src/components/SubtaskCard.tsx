import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface SubtaskCardProps {
  subtask: {
    id: string;
    description: string;
    status: string;
    due_date: string | null;
  };
  onStatusChange?: (subtaskId: string, newStatus: string) => void;
  onViewComments?: (subtaskId: string) => void;
  commentCount?: number;
}

export const SubtaskCard = ({ 
  subtask, 
  onStatusChange,
  onViewComments,
  commentCount = 0
}: SubtaskCardProps) => {
  const statusColors = {
    pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">{subtask.description}</p>
          {subtask.due_date && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(subtask.due_date), "MMM dd, yyyy")}
            </div>
          )}
        </div>
        <Badge className={statusColors[subtask.status as keyof typeof statusColors]} variant="outline">
          {subtask.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="mt-3 flex gap-2">
        {onViewComments && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onViewComments(subtask.id)}
            className="h-7 text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Comments ({commentCount})
          </Button>
        )}
        {onStatusChange && (
          <>
            {subtask.status === 'pending' && (
              <Button 
                size="sm"
                onClick={() => onStatusChange(subtask.id, 'in_progress')}
                className="h-7 text-xs"
              >
                Start
              </Button>
            )}
            {subtask.status === 'in_progress' && (
              <Button 
                size="sm"
                onClick={() => onStatusChange(subtask.id, 'completed')}
                className="h-7 text-xs"
              >
                Complete
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
};
