import Sidebar from "@/components/layout/sidebar";
import TopNavigation from "@/components/layout/top-navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Form } from "@shared/schema";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Eye, 
  Globe, 
  Lock, 
  MoreVertical,
  Check,
  X
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function MyFormsPage() {
  const { toast } = useToast();
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  
  const { data: forms, isLoading } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });
  
  const deleteFormMutation = useMutation({
    mutationFn: async (formId: number) => {
      await apiRequest("DELETE", `/api/forms/${formId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Form deleted",
        description: "The form has been deleted successfully.",
      });
      setFormToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete form: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const togglePublicMutation = useMutation({
    mutationFn: async ({ formId, isPublic }: { formId: number; isPublic: boolean }) => {
      await apiRequest("PUT", `/api/forms/${formId}`, { isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Visibility updated",
        description: "Form visibility has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update form visibility: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteForm = (form: Form) => {
    setFormToDelete(form);
  };
  
  const confirmDeleteForm = () => {
    if (formToDelete) {
      deleteFormMutation.mutate(formToDelete.id);
    }
  };
  
  const handleTogglePublic = (form: Form) => {
    togglePublicMutation.mutate({
      formId: form.id,
      isPublic: !form.isPublic
    });
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <TopNavigation />
        
        <main className="px-4 sm:px-6 lg:px-8 py-6 fade-in">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Forms</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage your custom forms
              </p>
            </div>
            
            <Link href="/create-form">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Form
              </Button>
            </Link>
          </div>
          
          {/* Forms list */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : forms && forms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <Card key={form.id} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{form.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {form.description || "No description provided"}
                        </CardDescription>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/forms/${form.id}/edit`}>
                              <div className="flex items-center w-full">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </div>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/forms/${form.id}/view`}>
                              <div className="flex items-center w-full">
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </div>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublic(form)}>
                            {form.isPublic ? (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Make Private
                              </>
                            ) : (
                              <>
                                <Globe className="mr-2 h-4 w-4" />
                                Make Public
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteForm(form)}
                            className="text-red-500 focus:text-red-500 dark:focus:text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-3">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      {form.isPublic ? (
                        <div className="flex items-center text-green-500">
                          <Globe className="mr-1 h-4 w-4" />
                          Public
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Lock className="mr-1 h-4 w-4" />
                          Private
                        </div>
                      )}
                      <span className="mx-2">•</span>
                      <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0 flex gap-2">
                    <Link href={`/forms/${form.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/forms/${form.id}/view`} className="flex-1">
                      <Button className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed rounded-lg border-gray-300 dark:border-gray-700">
              <div className="mb-4">
                <PlusCircle className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">No forms yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't created any forms yet. Start by creating your first form.
              </p>
              <Link href="/create-form">
                <Button>Create Your First Form</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!formToDelete} onOpenChange={() => !deleteFormMutation.isPending && setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the form "{formToDelete?.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteFormMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteForm} 
              disabled={deleteFormMutation.isPending}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deleteFormMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
