import { useState, useEffect } from 'react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { NoteSidebar } from '@/components/NoteSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotes } from '@/hooks/useNotes';
import { PenTool, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NotesApp = () => {
  const {
    notes,
    activeNote,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    debouncedUpdate,
  } = useNotes();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    if (activeNote) {
      setTempTitle(activeNote.title);
    }
  }, [activeNote]);

  const handleContentChange = (content: any) => {
    if (activeNote) {
      // Auto-generate title from first line if it's "Untitled Note"
      let newTitle = activeNote.title;
      if (activeNote.title === 'Untitled Note' && content.content && content.content.length > 0) {
        const firstNode = content.content[0];
        if (firstNode && firstNode.content && firstNode.content.length > 0) {
          const firstText = firstNode.content[0];
          if (firstText && firstText.text) {
            newTitle = firstText.text.slice(0, 50).trim() || 'Untitled Note';
          }
        }
      }

      const cleanup = debouncedUpdate(activeNote.id, { 
        content, 
        title: newTitle 
      });
      return cleanup;
    }
  };

  const handleTitleSave = () => {
    if (activeNote && tempTitle.trim()) {
      updateNote(activeNote.id, { title: tempTitle.trim() });
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTempTitle(activeNote?.title || '');
      setEditingTitle(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-subtle flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative z-50 lg:z-auto transition-transform duration-300",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        !isSidebarOpen && "lg:w-0 lg:overflow-hidden"
      )}>
        <NoteSidebar
          notes={notes}
          activeNoteId={activeNote?.id || null}
          onNoteSelect={selectNote}
          onNoteCreate={createNote}
          onNoteDelete={deleteNote}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">EasyScribe</span>
            </div>
          </div>

          {activeNote && (
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="w-64"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-lg font-medium cursor-pointer hover:text-primary transition-smooth"
                  onClick={() => setEditingTitle(true)}
                  title="Click to edit title"
                >
                  {activeNote.title}
                </h1>
              )}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 p-6 overflow-auto">
          {activeNote ? (
            <div className="max-w-4xl mx-auto">
              <RichTextEditor
                content={activeNote.content}
                onChange={handleContentChange}
                placeholder="Start writing your thoughts..."
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <PenTool className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to EasyScribe</h2>
                <p className="text-muted-foreground mb-6">
                  Create your first note to get started. Capture your thoughts, ideas, and inspiration in a beautiful, distraction-free environment.
                </p>
                <Button onClick={createNote} className="bg-gradient-primary text-white border-0">
                  <PenTool className="h-4 w-4 mr-2" />
                  Create Your First Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};