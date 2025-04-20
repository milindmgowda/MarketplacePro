import Sidebar from "@/components/layout/sidebar";
import TopNavigation from "@/components/layout/top-navigation";
import FormElements from "@/components/form-builder/form-elements";
import FormCanvas from "@/components/form-builder/form-canvas";
import CodeEditor from "@/components/form-builder/code-editor";
import ResultDisplay from "@/components/form-builder/result-display";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { FormElement, FormSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function CreateFormPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State for form building
  const [formTitle, setFormTitle] = useState<string>("My Custom Form");
  const [formDescription, setFormDescription] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  
  // State for JavaScript code
  const [jsCode, setJsCode] = useState<string>("// Form inputs will be available as variables\n// Example: if form has \"age\" input, use it as variable\n\nfunction processForm() {\n  let result = {};\n  \n  // Add your logic here\n  \n  return result;\n}");
  
  // State for form data and results
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [executionResult, setExecutionResult] = useState<any>(null);
  
  // Function to handle element drop on the canvas
  const handleElementDrop = (element: FormElement) => {
    setFormElements([...formElements, element]);
  };
  
  // Function to remove element from the canvas
  const handleElementRemove = (elementId: string) => {
    setFormElements(formElements.filter(el => el.id !== elementId));
  };
  
  // Function to update element on the canvas
  const handleElementUpdate = (updatedElement: FormElement) => {
    setFormElements(formElements.map(el => 
      el.id === updatedElement.id ? updatedElement : el
    ));
  };
  
  // Function to handle code editor changes
  const handleCodeChange = (newCode: string) => {
    setJsCode(newCode);
  };
  
  // Function to handle form data changes (from the preview)
  const handleFormDataChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Function to test the JavaScript code
  const handleRunTest = async () => {
    try {
      // Create a sample output
      const response = await apiRequest("POST", `/api/forms/test/execute`, {
        code: jsCode,
        formData: formData
      });
      
      const result = await response.json();
      setExecutionResult(result);
      
      toast({
        title: "Code executed successfully",
        description: "Check the output below.",
      });
    } catch (error: any) {
      toast({
        title: "Execution failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Save form mutation
  const saveFormMutation = useMutation({
    mutationFn: async () => {
      const formData = {
        title: formTitle,
        description: formDescription,
        isPublic,
        userId: user!.id,
        schema: { elements: formElements }
      };
      
      const formResponse = await apiRequest("POST", "/api/forms", formData);
      const form = await formResponse.json();
      
      // Save script if form was created successfully
      if (form && form.id) {
        await apiRequest("POST", `/api/forms/${form.id}/script`, {
          code: jsCode
        });
      }
      
      return form;
    },
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success!",
        description: "Form saved successfully.",
      });
      navigate("/my-forms");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save form",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSaveForm = () => {
    if (!formTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Form title is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (formElements.length === 0) {
      toast({
        title: "Validation Error",
        description: "Add at least one form element.",
        variant: "destructive",
      });
      return;
    }
    
    saveFormMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <TopNavigation />
        
        <main className="px-4 sm:px-6 lg:px-8 py-6 fade-in">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Create New Form</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Build a custom form with drag-and-drop and add JavaScript functionality
            </p>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Form Builder Palette - Left Column */}
            <div className="xl:col-span-3 order-1">
              <FormElements 
                onElementSelect={handleElementDrop}
                formTitle={formTitle}
                formDescription={formDescription}
                isPublic={isPublic}
                onFormTitleChange={setFormTitle}
                onFormDescriptionChange={setFormDescription}
                onIsPublicChange={setIsPublic}
              />
            </div>
            
            {/* Form Builder Canvas - Middle Column */}
            <div className="xl:col-span-5 order-3 xl:order-2">
              <FormCanvas 
                elements={formElements}
                onElementRemove={handleElementRemove}
                onElementUpdate={handleElementUpdate}
                onFormDataChange={handleFormDataChange}
                onSave={handleSaveForm}
                isSaving={saveFormMutation.isPending}
              />
            </div>
            
            {/* JavaScript Editor - Right Column */}
            <div className="xl:col-span-4 order-2 xl:order-3">
              <CodeEditor 
                code={jsCode} 
                onCodeChange={handleCodeChange}
                formData={formData}
                onRunTest={handleRunTest}
                executionResult={executionResult}
              />
            </div>
          </div>
          
          {/* Result Visualization (below the form) */}
          {executionResult && (
            <div className="mt-8">
              <ResultDisplay 
                formData={formData}
                executionResult={executionResult}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
