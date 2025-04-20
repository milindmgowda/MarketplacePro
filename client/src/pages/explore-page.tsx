import Sidebar from "@/components/layout/sidebar";
import TopNavigation from "@/components/layout/top-navigation";
import { useQuery } from "@tanstack/react-query";
import { Form } from "@shared/schema";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar, User } from "lucide-react";
import { useState } from "react";

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: publicForms, isLoading } = useQuery<Form[]>({
    queryKey: ["/api/forms/public"],
  });
  
  // Filter forms based on search term
  const filteredForms = publicForms ? publicForms.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <TopNavigation />
        
        <main className="px-4 sm:px-6 lg:px-8 py-6 fade-in">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Explore Forms</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Discover and use forms created by the community
            </p>
          </div>
          
          {/* Search and filters */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search forms by title or description..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Forms grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForms.map((form) => (
                <Card key={form.id} className="transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{form.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {form.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <User size={16} className="mr-2" />
                        <span>By: User #{form.userId}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/forms/${form.id}/view`}>
                      <Button className="w-full">Use This Form</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium mb-2">No forms found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? "No forms match your search criteria" : "There are no public forms available yet"}
              </p>
              <Link href="/create-form">
                <Button>Create a Form</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
