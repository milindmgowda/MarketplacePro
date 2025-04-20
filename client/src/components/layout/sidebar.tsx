import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Plus, 
  List, 
  Search, 
  Code, 
  User, 
  Settings, 
  Menu, 
  X,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Close mobile sidebar when location changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);
  
  // Close mobile sidebar when ESC key is pressed
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);
  
  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/create-form", label: "Create Form", icon: Plus },
    { path: "/my-forms", label: "My Forms", icon: List },
    { path: "/explore", label: "Explore", icon: Search },
  ];
  
  const accountItems = [
    { path: "/profile", label: "Profile", icon: User },
    { path: "/settings", label: "Settings", icon: Settings },
  ];
  
  const SidebarContent = () => (
    <>
      <div className="p-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <Link href="/">
          <div className="text-primary font-bold text-xl cursor-pointer">FormScript</div>
        </Link>
      </div>
      
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="mb-6">
          <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Main</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors",
                  location === item.path 
                    ? "bg-primary bg-opacity-10 text-primary dark:text-primary" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}>
                  <Icon className="flex-shrink-0 w-5 h-5 mr-3" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </div>
        
        <div className="mb-6">
          <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Account</p>
          {accountItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors",
                  location === item.path 
                    ? "bg-primary bg-opacity-10 text-primary dark:text-primary" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}>
                  <Icon className="flex-shrink-0 w-5 h-5 mr-3" />
                  {item.label}
                </a>
              </Link>
            );
          })}
          
          <Button
            variant="ghost"
            className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md mb-1 justify-start hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <span className="flex-shrink-0 w-5 h-5 mr-3 animate-spin border-2 border-red-500 border-t-transparent rounded-full" />
            ) : (
              <LogOut className="flex-shrink-0 w-5 h-5 mr-3" />
            )}
            Logout
          </Button>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{user ? getInitials(user.fullName || user.username) : "U"}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </>
  );
  
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 fixed h-full overflow-y-auto transition duration-300 z-30">
        <SidebarContent />
      </aside>
      
      {/* Mobile sidebar toggle button */}
      <div className="lg:hidden fixed bottom-4 left-4 z-40">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Mobile sidebar overlay */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />
      
      {/* Mobile sidebar */}
      <aside 
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-50 transform transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-4 top-4 lg:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
}
