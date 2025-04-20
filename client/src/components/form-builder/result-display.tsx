import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ResultDisplayProps {
  formData: Record<string, any>;
  executionResult: any;
}

export default function ResultDisplay({ formData, executionResult }: ResultDisplayProps) {
  // Helper to determine a good color for a specific output property
  const getOutputColor = (key: string) => {
    const colors = {
      status: "green",
      result: "blue",
      error: "red",
      warning: "yellow",
      info: "indigo",
      success: "emerald"
    };
    
    const keyLower = key.toLowerCase();
    
    for (const [colorKey, color] of Object.entries(colors)) {
      if (keyLower.includes(colorKey)) {
        return color;
      }
    }
    
    // Return a default color if no match
    return "blue";
  };
  
  // Helper to format values by type
  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 
        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">True</Badge> : 
        <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900">False</Badge>;
    }
    
    if (typeof value === 'number') {
      return <span className="font-medium">{value}</span>;
    }
    
    if (typeof value === 'object') {
      return <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
    }
    
    return value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <h2 className="font-semibold text-lg mb-4">Output Visualization</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Here's how the result will appear after form submission
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
              <h3 className="font-medium">Form Submitted Successfully</h3>
            </div>
            
            {/* Form Input Values */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{key}</p>
                    <p className="font-medium">{value?.toString() || '(empty)'}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* JavaScript Execution Results */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2">JavaScript Output:</h4>
              
              {executionResult && typeof executionResult === 'object' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(executionResult).map(([key, value]) => {
                    const color = getOutputColor(key);
                    return (
                      <div 
                        key={key} 
                        className={`p-3 rounded-md border bg-${color}-50 text-${color}-700 border-${color}-200 dark:bg-${color}-900/20 dark:text-${color}-400 dark:border-${color}-900`}
                        style={{ 
                          backgroundColor: `var(--${color}-50, hsl(var(--${color})))`,
                          borderColor: `var(--${color}-200, hsl(var(--${color})))`,
                          color: `var(--${color}-700, hsl(var(--${color})))`
                        }}
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{key}</p>
                        <div className="font-medium">{formatValue(value)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Result</p>
                  <div className="font-medium">{formatValue(executionResult)}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
