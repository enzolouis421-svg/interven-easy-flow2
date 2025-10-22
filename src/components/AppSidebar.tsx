import { Home, ClipboardList, Users, Wrench, LogOut, FileText, Bot, Settings, Calendar } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Tableau de bord", url: "/dashboard", icon: Home },
  { title: "Interventions & Devis", url: "/interventions-devis", icon: ClipboardList },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Techniciens", url: "/techniciens", icon: Wrench },
  { title: "Calendrier", url: "/calendar", icon: Calendar },
  { title: "Assistant IA", url: "/assistant", icon: Bot },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Déconnexion",
      description: "À bientôt !",
    });
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-gradient-to-b from-sidebar via-sidebar/98 to-sidebar/95">
      <SidebarContent className="pt-4 pb-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 mb-4">
            {collapsed ? (
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-glow">
                IG
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-glow">
                  IG
                </div>
                <span className="text-xl font-bold text-gradient">
                  IntervenGo
                </span>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-3">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className={({ isActive }) =>
                        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-primary/20 via-secondary/15 to-primary/20 text-primary shadow-glow border border-primary/30"
                            : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
                        }`
                      }
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`relative ${isActive ? 'animate-float' : ''}`}>
                            <item.icon className={`h-5 w-5 transition-all duration-300 ${
                              isActive ? 'text-primary' : 'group-hover:scale-110'
                            }`} />
                            {isActive && (
                              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
                            )}
                          </div>
                          {!collapsed && (
                            <span className={`font-medium transition-all duration-300 ${
                              isActive ? 'text-primary' : ''
                            }`}>
                              {item.title}
                            </span>
                          )}
                          {isActive && !collapsed && (
                            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group"
            >
              <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              {!collapsed && <span className="font-medium">Déconnexion</span>}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
