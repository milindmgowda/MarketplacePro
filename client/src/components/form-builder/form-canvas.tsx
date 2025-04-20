import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormElement } from "@shared/schema";
import { 
  Undo, 
  Eye, 
  Save, 
  Edit, 
  Trash2, 
  GripHorizontal,
  Loader2
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FormCanvasProps {
  elements: FormElement[];
  onElementRemove: (elementId: string) => void;
  onElementUpdate: (element: FormElement) => void;
  onFormDataChange: (name: string, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function FormCanvas({
  elements,
  onElementRemove,
  onElementUpdate,
  onFormDataChange,
  onSave,
  isSaving
}: FormCanvasProps) {
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editableElement, setEditableElement] = useState<FormElement | null>(null);
  const [history, setHistory] = useState<FormElement[][]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Save current state to history when elements change
  useEffect(() => {
    if (elements.length > 0) {
      setHistory(prev => [...prev, [...elements]]);
    }
  }, [elements]);
  
  // Update editable element when editing element changes
  useEffect(() => {
    if (editingElementId) {
      const element = elements.find(el => el.id === editingElementId);
      if (element) {
        setEditableElement({ ...element });
      }
    } else {
      setEditableElement(null);
    }
  }, [editingElementId, elements]);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("border-primary", "bg-primary/5");
    }
  };
  
  const handleDragLeave = () => {
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-primary", "bg-primary/5");
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleDragLeave();
    
    // Get the element type from the data transfer
    const elementType = e.dataTransfer.getData('elementType');
    
    if (elementType && onElementDrop) {
      // Forward the elementType to the page component
      // This is a patch to fix the drop functionality which was previously not implemented
      if (typeof window !== 'undefined') {
        // Create a custom event to trigger adding a new element of this type
        const event = new CustomEvent('form-element-drop', { 
          detail: { elementType }
        });
        window.dispatchEvent(event);
      }
    }
  };
  
  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current state
      const previousState = newHistory[newHistory.length - 1];
      
      // Update elements through parent component
      // This is a simplified approach, in a real app you would dispatch an action
      // or use a more robust state management approach
      previousState.forEach(element => {
        onElementUpdate(element);
      });
      
      // Remove elements that are not in the previous state
      elements.forEach(element => {
        if (!previousState.find(el => el.id === element.id)) {
          onElementRemove(element.id);
        }
      });
      
      setHistory(newHistory);
    }
  };
  
  const handleEditElement = (elementId: string) => {
    setEditingElementId(elementId);
  };
  
  const handleCancelEdit = () => {
    setEditingElementId(null);
    setEditableElement(null);
  };
  
  const handleSaveEdit = () => {
    if (editableElement) {
      onElementUpdate(editableElement);
      setEditingElementId(null);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof FormElement) => {
    if (editableElement) {
      setEditableElement({
        ...editableElement,
        [field]: e.target.value
      });
    }
  };
  
  const handleRequiredChange = (checked: boolean) => {
    if (editableElement) {
      setEditableElement({
        ...editableElement,
        required: checked
      });
    }
  };
  
  const handleFormValueChange = (name: string, value: any) => {
    if (!isPreviewMode) return;
    onFormDataChange(name, value);
  };
  
  const renderFormElement = (element: FormElement, isEditing: boolean = false) => {
    const currentElement = isEditing ? editableElement || element : element;
    
    if (isEditing) {
      // Editing view - show form element editor
      return (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div>
            <Label htmlFor={`edit-label-${element.id}`}>Label</Label>
            <Input 
              id={`edit-label-${element.id}`}
              value={currentElement.label} 
              onChange={(e) => handleInputChange(e, 'label')}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`edit-name-${element.id}`}>Field Name</Label>
            <Input 
              id={`edit-name-${element.id}`}
              value={currentElement.name} 
              onChange={(e) => handleInputChange(e, 'name')}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`edit-placeholder-${element.id}`}>Placeholder</Label>
            <Input 
              id={`edit-placeholder-${element.id}`}
              value={currentElement.placeholder || ''} 
              onChange={(e) => handleInputChange(e, 'placeholder')}
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`edit-required-${element.id}`}
              checked={currentElement.required} 
              onCheckedChange={handleRequiredChange}
            />
            <Label htmlFor={`edit-required-${element.id}`}>Required field</Label>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </div>
      );
    } else if (isPreviewMode) {
      // Preview mode - show actual form controls that update form data
      switch (element.type) {
        case 'text':
          return (
            <div className="mb-4">
              <Label htmlFor={element.id}>{element.label}{element.required && <span className="text-red-500">*</span>}</Label>
              <Input 
                id={element.id} 
                placeholder={element.placeholder} 
                required={element.required}
                onChange={(e) => handleFormValueChange(element.name, e.target.value)}
                className="mt-1"
              />
            </div>
          );
          
        case 'number':
          return (
            <div className="mb-4">
              <Label htmlFor={element.id}>{element.label}{element.required && <span className="text-red-500">*</span>}</Label>
              <Input 
                id={element.id} 
                type="number" 
                placeholder={element.placeholder}
                required={element.required}
                onChange={(e) => handleFormValueChange(element.name, Number(e.target.value))}
                className="mt-1"
              />
            </div>
          );
          
        case 'textarea':
          return (
            <div className="mb-4">
              <Label htmlFor={element.id}>{element.label}{element.required && <span className="text-red-500">*</span>}</Label>
              <Textarea 
                id={element.id} 
                placeholder={element.placeholder}
                required={element.required}
                onChange={(e) => handleFormValueChange(element.name, e.target.value)}
                className="mt-1"
              />
            </div>
          );
          
        case 'checkbox':
          return (
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id={element.id} 
                required={element.required}
                onCheckedChange={(checked) => handleFormValueChange(element.name, checked)}
              />
              <Label htmlFor={element.id}>{element.label}{element.required && <span className="text-red-500">*</span>}</Label>
            </div>
          );
          
        case 'radio':
          return (
            <div className="mb-4">
              <Label>{element.label}{element.required && <span className="text-red-500">*</span>}</Label>
              <RadioGroup 
                onValueChange={(value) => handleFormValueChange(element.name, value)}
                required={element.required}
                className="mt-2"
              >
                {element.options?.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${element.id}-${option.value}`} />
                    <Label htmlFor={`${element.id}-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          );
          
        case 'select':
          return (
            <div className="mb-4">
              <Label htmlFor={element.id}>{element.label}{element.required && <span className="text-red-500">*</span>}</Label>
              <Select onValueChange={(value) => handleFormValueChange(element.name, value)}>
                <SelectTrigger id={element.id} className="mt-1">
                  <SelectValue placeholder={element.placeholder || "Select an option"} />
                </SelectTrigger>
                <SelectContent>
                  {element.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
          
        case 'date':
          return (
            <div className="mb-4">
              <Label htmlFor={element.id}>{element.label}{element.required && <span className="text-red-500">*</span>}</Label>
              <Input 
                id={element.id} 
                type="date" 
                required={element.required}
                onChange={(e) => handleFormValueChange(element.name, e.target.value)}
                className="mt-1"
              />
            </div>
          );
          
        default:
          return <div>Unsupported element type</div>;
      }
    } else {
      // Builder mode - show element with edit/delete controls
      return (
        <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 relative group">
          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => handleEditElement(element.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Element</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-red-500 hover:text-red-600"
                    onClick={() => onElementRemove(element.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Element</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-2 mb-1 text-sm">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md">
              {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
            </span>
            {element.required && <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md">Required</span>}
          </div>
          
          <div>
            <div className="font-medium">{element.label}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Name: {element.name}</div>
          </div>
          
          {/* Simplified placeholder representation based on element type */}
          <div className="mt-2">
            {element.type === 'text' && <Input disabled placeholder={element.placeholder} />}
            {element.type === 'number' && <Input type="number" disabled placeholder={element.placeholder} />}
            {element.type === 'textarea' && <Textarea disabled placeholder={element.placeholder} />}
            {element.type === 'checkbox' && (
              <div className="flex items-center space-x-2">
                <Checkbox id={`preview-${element.id}`} disabled />
                <Label htmlFor={`preview-${element.id}`}>{element.label}</Label>
              </div>
            )}
            {element.type === 'radio' && (
              <div className="space-y-1">
                {element.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`preview-${element.id}-${index}`} disabled />
                    <Label htmlFor={`preview-${element.id}-${index}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            )}
            {element.type === 'select' && (
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder={element.placeholder || "Select an option"} />
                </SelectTrigger>
              </Select>
            )}
            {element.type === 'date' && <Input type="date" disabled />}
          </div>
        </div>
      );
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Form Preview</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUndo} 
              disabled={history.length <= 1}
            >
              <Undo className="mr-1 h-4 w-4" />
              Undo
            </Button>
            <Button 
              variant={isPreviewMode ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Eye className="mr-1 h-4 w-4" />
              {isPreviewMode ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>
        
        <div 
          ref={dropZoneRef}
          className={cn(
            "border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 min-h-[400px] transition-colors",
            (elements.length === 0 && !isPreviewMode) && "flex items-center justify-center"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {elements.length === 0 && !isPreviewMode ? (
            <div className="text-center py-16">
              <GripHorizontal className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
              <p className="mt-2 text-gray-500 dark:text-gray-400">Drag form elements here</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {elements.map((element) => (
                <motion.div
                  key={element.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {editingElementId === element.id
                    ? renderFormElement(element, true)
                    : renderFormElement(element)
                  }
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button onClick={onSave} disabled={isSaving || elements.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Form
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
