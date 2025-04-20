import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Bell, Sun, Moon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";

export default function TopNavigation() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Fetch notifications
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  
  // Count unread notifications
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  
  // Mark notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center lg:hidden">
          <h1 className="text-xl font-bold text-primary">FormScript</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-500">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-4 py-2 font-medium">Notifications</div>
              <DropdownMenuSeparator />
              
              {notifications && notifications.length > 0 ? (
                <>
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className={`px-4 py-3 cursor-default ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{notification.type.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center py-2 justify-center text-primary">
                    View all notifications
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Dark mode toggle */}
          <div className="flex items-center space-x-2">
            <Switch 
              id="dark-mode-toggle" 
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="dark-mode-toggle" className="sr-only">
              Dark Mode
            </Label>
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-yellow-300" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </div>
          
          {/* Help button */}
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </Button>
        </div>
      </div>
    </header>
  );
}
