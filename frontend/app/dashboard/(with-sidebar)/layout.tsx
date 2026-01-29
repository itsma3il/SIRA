import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh min-[calc(100vh-4rem)] md:h-[calc(100vh-1rem)] overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
