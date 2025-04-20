import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { v4 as uuidv4 } from 'uuid';
import { 
  TextIcon, 
  HashIcon, 
  CheckSquareIcon, 
  CircleIcon, 
  ListIcon, 
  AlignJustifyIcon, 
  CalendarIcon 
} from "lucide-react";
import { motion } from "framer-motion";
import { FormElement, FormElementType } from "@shared/schema";

type FormElementsProps = {
  onElementSelect: (element: FormElement) => void;
  formTitle: string;
  formDescription: string;
  isPublic: boolean;
  onFormTitleChange: (title: string) => void;
  onFormDescriptionChange: (description: string) => void;
  onIsPublicChange: (isPublic: boolean) => void;
};

export default function FormElements({
  onElementSelect,
  formTitle,
  formDescription,
  isPublic,
  onFormTitleChange,
  onFormDescriptionChange,
  onIsPublicChange
}: FormElementsProps) {
  // Define available form elements
  const elementTypes: Array<{
    type: FormElementType;
    label: string;
    icon: React.ElementType;
  }> = [
    { type: 'text', label: 'Text Input', icon: TextIcon },
    { type: 'number', label: 'Number Input', icon: HashIcon },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquareIcon },
    { type: 'radio', label: 'Radio Button', icon: CircleIcon },
    { type: 'select', label: 'Select Dropdown', icon: ListIcon },
    { type: 'textarea', label: 'Text Area', icon: AlignJustifyIcon },
    { type: 'date', label: 'Date Picker', icon: CalendarIcon }
  ];

  const handleDragStart = (e: React.DragEvent, type: FormElementType) => {
    e.dataTransfer.setData('elementType', type);
  };

  const handleElementClick = (type: FormElementType) => {
    // Create a new form element with default properties
    const newElement: FormElement = {
      id: uuidv4(),
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      name: `${type}_${Date.now()}`,
      required: false,
      placeholder: `Enter ${type}...`,
    };
    
    // Add options for select and radio types
    if (type === 'select' || type === 'radio') {
      newElement.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ];
    }
    
    onElementSelect(newElement);
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <h2 className="font-semibold text-lg mb-4">Form Elements</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Drag elements to the form area or click to add
        </p>
        
        <div className="space-y-3">
          {elementTypes.map((element) => {
            const Icon = element.icon;
            return (
              <motion.div
                key={element.type}
                className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center cursor-grab"
                draggable
                onDragStart={(e) => handleDragStart(e, element.type)}
                onClick={() => handleElementClick(element.type)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="text-primary mr-2 h-5 w-5" />
                <span>{element.label}</span>
              </motion.div>
            );
          })}
        </div>
        
        <Separator className="my-6" />
        
        <div className="mt-4">
          <h3 className="font-medium text-md mb-3">Form Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="form-title" className="mb-1">Form Title</Label>
              <Input 
                id="form-title" 
                value={formTitle}
                onChange={(e) => onFormTitleChange(e.target.value)}
                placeholder="My Custom Form"
              />
            </div>
            
            <div>
              <Label htmlFor="form-description" className="mb-1">Description</Label>
              <Textarea 
                id="form-description" 
                rows={3} 
                value={formDescription}
                onChange={(e) => onFormDescriptionChange(e.target.value)}
                placeholder="Form description..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="public-form" 
                checked={isPublic}
                onCheckedChange={onIsPublicChange}
              />
              <Label htmlFor="public-form">Public form (visible to others)</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
