import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        loadNotes();
      } else {
        // For demo purposes, create a temporary user session
        signInAnonymously();
      }
    };

    checkAuth();
  }, []);

  const signInAnonymously = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Anonymous sign in error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to create session. Using local storage for demo.",
        variant: "destructive",
      });
      // Fallback to local storage
      loadNotesFromLocalStorage();
    } else {
      setUser(data.user);
      loadNotes();
    }
  };

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
      if (data && data.length > 0 && !activeNote) {
        setActiveNote(data[0]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes. Using local storage as fallback.",
        variant: "destructive",
      });
      loadNotesFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotesFromLocalStorage = () => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      setNotes(parsedNotes);
      if (parsedNotes.length > 0) {
        setActiveNote(parsedNotes[0]);
      }
    }
    setIsLoading(false);
  };

  const saveNoteToLocalStorage = (updatedNotes: Note[]) => {
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  const createNote = async () => {
    const newNote = {
      title: 'Untitled Note',
      content: { type: 'doc', content: [] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (user) {
        const { data, error } = await supabase
          .from('notes')
          .insert([{ ...newNote, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;

        const createdNote = data as Note;
        setNotes(prev => [createdNote, ...prev]);
        setActiveNote(createdNote);
      } else {
        // Fallback to local storage
        const id = Date.now().toString();
        const noteWithId = { ...newNote, id };
        const updatedNotes = [noteWithId, ...notes];
        setNotes(updatedNotes);
        setActiveNote(noteWithId);
        saveNoteToLocalStorage(updatedNotes);
      }

      toast({
        title: "Note Created",
        description: "New note created successfully.",
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note.",
        variant: "destructive",
      });
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('notes')
          .update(updates)
          .eq('id', noteId);

        if (error) throw error;
      }

      // Update local state
      const updatedNotes = notes.map(note =>
        note.id === noteId ? { ...note, ...updates, updated_at: new Date().toISOString() } : note
      );
      setNotes(updatedNotes);
      
      if (activeNote?.id === noteId) {
        setActiveNote(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
      }

      if (!user) {
        saveNoteToLocalStorage(updatedNotes);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note.",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', noteId);

        if (error) throw error;
      }

      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);

      if (activeNote?.id === noteId) {
        setActiveNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
      }

      if (!user) {
        saveNoteToLocalStorage(updatedNotes);
      }

      toast({
        title: "Note Deleted",
        description: "Note deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    }
  };

  const selectNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setActiveNote(note);
    }
  };

  // Auto-save functionality
  const debouncedUpdate = (noteId: string, updates: Partial<Note>) => {
    const timeoutId = setTimeout(() => {
      updateNote(noteId, updates);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  return {
    notes,
    activeNote,
    isLoading,
    user,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    debouncedUpdate,
  };
};