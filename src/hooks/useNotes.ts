import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadNotes();
    } else {
      setIsLoading(false);
      setNotes([]);
      setActiveNote(null);
    }
  }, [user]);


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
        description: "Failed to load notes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const createNote = async () => {
    const newNote = {
      title: 'Untitled Note',
      content: { type: 'doc', content: [] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create notes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ ...newNote, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      const createdNote = data as Note;
      setNotes(prev => [createdNote, ...prev]);
      setActiveNote(createdNote);

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
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', noteId);

      if (error) throw error;

      // Update local state
      const updatedNotes = notes.map(note =>
        note.id === noteId ? { ...note, ...updates, updated_at: new Date().toISOString() } : note
      );
      setNotes(updatedNotes);
      
      if (activeNote?.id === noteId) {
        setActiveNote(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
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
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);

      if (activeNote?.id === noteId) {
        setActiveNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
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
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    debouncedUpdate,
  };
};