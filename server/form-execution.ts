import { VM } from 'vm2';

/**
 * Securely executes user-provided JavaScript code with form data as context
 * @param code - The JavaScript code to execute
 * @param formData - Form data to be made available to the code
 * @returns The result of the code execution
 */
export async function executeJavaScript(code: string, formData: any): Promise<any> {
  try {
    // Create a secure sandbox with VM2
    const vm = new VM({
      timeout: 1000, // Timeout after 1 second
      sandbox: {
        console: {
          log: () => {}, // Disabled console.log
          error: () => {}, // Disabled console.error
          warn: () => {}, // Disabled console.warn
        },
        ...formData, // Inject form data as variables
      },
      eval: false, // Disallow eval()
      wasm: false, // Disallow WebAssembly
    });

    // Wrap the code in a function if it's not already
    let executionCode = code;
    
    // Check if the code contains a function named processForm
    if (!code.includes('function processForm')) {
      executionCode = `
        function processForm() {
          ${code}
        }
        processForm();
      `;
    } else {
      executionCode = `${code}\nprocessForm();`;
    }

    // Execute the code and return the result
    return vm.run(executionCode);
  } catch (error: any) {
    throw new Error(`JavaScript execution error: ${error.message}`);
  }
}
