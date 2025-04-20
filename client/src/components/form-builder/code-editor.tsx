import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlayIcon, Code, IndentIncrease, WrapText } from "lucide-react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  formData: Record<string, any>;
  onRunTest: () => void;
  executionResult: any;
}

export default function CodeEditor({ 
  code, 
  onCodeChange, 
  formData, 
  onRunTest, 
  executionResult 
}: CodeEditorProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [testData, setTestData] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState(() => {
    return document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light';
  });
  
  // Update editor theme based on document theme
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setTheme(isDark ? 'vs-dark' : 'light');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  // Initialize test data based on form data
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      setTestData(
        Object.entries(formData).reduce((acc, [key, value]) => {
          acc[key] = value?.toString() || '';
          return acc;
        }, {} as Record<string, string>)
      );
    }
  }, [formData]);
  
  const handleRunTest = async () => {
    setIsExecuting(true);
    try {
      await onRunTest();
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleTestDataChange = (key: string, value: string) => {
    setTestData({ ...testData, [key]: value });
  };
  
  const getFormattedResult = () => {
    if (!executionResult) return '';
    
    try {
      return JSON.stringify(executionResult, null, 2);
    } catch (error) {
      return String(executionResult);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="mb-4">
          <h2 className="font-semibold text-lg">JavaScript Logic</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Write code to process form input data
          </p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 p-2 mb-4">
          <div className="flex justify-between items-center mb-2 text-xs text-gray-500 px-2">
            <div>script.js</div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="h-6 px-1">
                <IndentIncrease className="h-4 w-4" />
                <span className="sr-only">Format</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-1">
                <WrapText className="h-4 w-4" />
                <span className="sr-only">Word Wrap</span>
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700">
            <Editor
              height="240px"
              defaultLanguage="javascript"
              value={code}
              onChange={(value) => onCodeChange(value || '')}
              theme={theme}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: 'on',
                automaticLayout: true,
                tabSize: 2,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                }
              }}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium text-md mb-2">Test Your Code</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Try your code with sample data:
          </p>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Test Input</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                {Object.keys(testData).length > 0 ? (
                  Object.entries(testData).map(([key, value]) => (
                    <div key={key}>
                      <Input 
                        value={value}
                        onChange={(e) => handleTestDataChange(key, e.target.value)}
                        placeholder={`${key} = '${value}'`}
                        className="text-sm"
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <Input placeholder="fullName = 'John Doe'" className="text-sm" disabled />
                    <Input placeholder="age = 25" className="text-sm" disabled />
                  </>
                )}
              </div>
            </div>
            
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button 
                className="w-full" 
                onClick={handleRunTest}
                disabled={isExecuting}
                variant="secondary"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4" />
                    Run Test
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium text-md mb-2">Output</h3>
          <div 
            className="font-mono text-sm min-h-24 max-h-48 overflow-y-auto p-2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          >
            <pre className="whitespace-pre-wrap">{getFormattedResult()}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
