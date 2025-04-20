import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import TopNavigation from "@/components/layout/top-navigation";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle, Code, ListChecks, FileSpreadsheet } from "lucide-react";
import { Form } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: forms, isLoading: isLoadingForms } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });
  
  const { data: publicForms, isLoading: isLoadingPublicForms } = useQuery<Form[]>({
    queryKey: ["/api/forms/public"],
  });

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <TopNavigation />
        
        <main className="px-4 sm:px-6 lg:px-8 py-6 fade-in">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome, {user?.fullName || user?.username}!</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Build custom forms, add JavaScript functionality, and share them with the world.
            </p>
          </div>
          
          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/create-form">
              <Button className="w-full h-24 text-lg flex flex-col bg-primary hover:bg-primary/90" size="lg">
                <PlusCircle className="h-6 w-6 mb-2" />
                Create New Form
              </Button>
            </Link>
            
            <Link href="/my-forms">
              <Button className="w-full h-24 text-lg flex flex-col bg-secondary hover:bg-secondary/90" size="lg" variant="secondary">
                <ListChecks className="h-6 w-6 mb-2" />
                My Forms
              </Button>
            </Link>
            
            <Link href="/explore">
              <Button className="w-full h-24 text-lg flex flex-col" size="lg" variant="outline">
                <FileSpreadsheet className="h-6 w-6 mb-2" />
                Explore Forms
              </Button>
            </Link>
          </div>
          
          {/* Recent forms section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Recent Forms</h2>
              <Link href="/my-forms">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            
            {isLoadingForms ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : forms && forms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forms.slice(0, 3).map((form) => (
                  <Card key={form.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{form.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2 flex justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </div>
                      <Link href={`/forms/${form.id}`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created any forms yet.</p>
                  <Link href="/create-form">
                    <Button>Create Your First Form</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Popular public forms section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Popular Public Forms</h2>
              <Link href="/explore">
                <Button variant="ghost" size="sm">Explore All</Button>
              </Link>
            </div>
            
            {isLoadingPublicForms ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : publicForms && publicForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicForms.slice(0, 3).map((form) => (
                  <Card key={form.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{form.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2 flex justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        By: {form.userId === user?.id ? "You" : "Another User"}
                      </div>
                      <Link href={`/forms/${form.id}/view`}>
                        <Button size="sm" variant="outline">Use Form</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No public forms available yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
