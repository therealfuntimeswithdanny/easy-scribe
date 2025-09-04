import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PenTool } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/notes" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <PenTool className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">EasyScribe</h1>
        </div>
        
        <h2 className="text-2xl font-semibold mb-4">
          Beautiful Note Taking Made Simple
        </h2>
        
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          Capture your thoughts, ideas, and inspiration in a clean, distraction-free environment. 
          Rich text editing with a minimal, elegant design.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button 
            asChild 
            className="bg-gradient-primary text-white border-0 text-lg px-8 py-6"
          >
            <a href="/auth">Get Started</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
