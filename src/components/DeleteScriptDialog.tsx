import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteScript, type ScriptData } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DeleteScriptDialogProps {
  script: ScriptData;
  children: React.ReactNode;
}

export const DeleteScriptDialog = ({ script, children }: DeleteScriptDialogProps) => {
  const [open, setOpen] = useState(false);

  const { token } = useAuth();
  const queryClient = useQueryClient();

  const deleteScriptMutation = useMutation({
    mutationFn: () => deleteScript(token ?? '', script.slug),
    onSuccess: () => {
      toast.success('Script deleted successfully!');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete script');
    }
  });

  const handleDelete = () => {
    deleteScriptMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Script
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{script.title}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Warning</p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the script and all its data. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteScriptMutation.isPending}
          >
            {deleteScriptMutation.isPending ? 'Deleting...' : 'Delete Script'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

