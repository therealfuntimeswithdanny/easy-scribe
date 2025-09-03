import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  FileText, 
  MoreHorizontal,
  Trash2,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

interface NoteSidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  onNoteCreate: () => void;
  onNoteDelete: (noteId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const NoteSidebar = ({
  notes,
  activeNoteId,
  onNoteSelect,
  onNoteCreate,
  onNoteDelete,
  searchTerm,
  onSearchChange,
}: NoteSidebarProps) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(note.content).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPreviewText = (content: any): string => {
    if (!content || !content.content) return '';
    
    const extractText = (nodes: any[]): string => {
      return nodes.map(node => {
        if (node.type === 'text') return node.text || '';
        if (node.content) return extractText(node.content);
        return '';
      }).join(' ');
    };
    
    return extractText(content.content).slice(0, 100) + '...';
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Notes</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNoteCreate}
            className="h-8 w-8 p-0 bg-gradient-primary text-white hover:opacity-90"
            title="New Note"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-foreground/60 h-4 w-4" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "pl-9 bg-sidebar-accent border-sidebar-border transition-smooth",
              isSearchFocused && "ring-2 ring-sidebar-ring"
            )}
          />
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-sidebar-foreground/60">
              {searchTerm ? 'No matching notes found' : 'No notes yet'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-smooth border",
                    activeNoteId === note.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                      : "bg-sidebar hover:bg-note-item-hover border-transparent"
                  )}
                  onClick={() => onNoteSelect(note.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 flex-shrink-0 opacity-60" />
                        <h3 className="font-medium truncate text-sm">
                          {note.title}
                        </h3>
                      </div>
                      
                      <p className="text-xs opacity-70 line-clamp-2 mb-2">
                        {getPreviewText(note.content)}
                      </p>
                      
                      <div className="flex items-center gap-1 text-xs opacity-60">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-smooth"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onNoteDelete(note.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};