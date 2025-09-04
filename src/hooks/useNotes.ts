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

const NOTES_STORAGE_KEY = 'easyscribe_notes';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load notes from localStorage on mount
  useEffect(() => {
    loadLocalNotes();
  }, []);

  // Sync with cloud when user signs in
  useEffect(() => {
    if (user && !isSyncing) {
      syncWithCloud();
    }
  }, [user]);

  const loadLocalNotes = () => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      const localNotes = stored ? JSON.parse(stored) : [];
      setNotes(localNotes);
      if (localNotes.length > 0 && !activeNote) {
        setActiveNote(localNotes[0]);
      }
    } catch (error) {
      console.error('Error loading local notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToLocal = (notesToSave: Note[]) => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const syncWithCloud = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      // Get cloud notes
      const { data: cloudNotes, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get local notes
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      const localNotes: Note[] = stored ? JSON.parse(stored) : [];

      // Merge notes (cloud takes precedence for conflicts)
      const mergedNotes: Note[] = (cloudNotes || []).map(cn => ({
        id: cn.id,
        title: cn.title,
        content: cn.content,
        created_at: cn.created_at,
        updated_at: cn.updated_at,
        user_id: cn.user_id
      }));
      
      // Add local notes that don't exist in cloud
      for (const localNote of localNotes) {
        const existsInCloud = cloudNotes?.some(cn => cn.id === localNote.id);
        if (!existsInCloud) {
          // Upload local note to cloud
          const noteToUpload = { 
            ...localNote, 
            user_id: user.id,
            id: localNote.id,
            title: localNote.title,
            content: localNote.content,
            created_at: localNote.created_at,
            updated_at: localNote.updated_at
          };
          const { data, error: uploadError } = await supabase
            .from('notes')
            .insert([noteToUpload])
            .select()
            .single();

          if (!uploadError && data) {
            const noteFromCloud: Note = {
              id: data.id,
              title: data.title,
              content: data.content,
              created_at: data.created_at,
              updated_at: data.updated_at,
              user_id: data.user_id
            };
            mergedNotes.unshift(noteFromCloud);
          }
        }
      }

      setNotes(mergedNotes);
      saveToLocal(mergedNotes);
      
      if (mergedNotes.length > 0 && !activeNote) {
        setActiveNote(mergedNotes[0]);
      }

      toast({
        title: "Synced",
        description: "Your notes have been synced with the cloud.",
      });
    } catch (error) {
      console.error('Error syncing with cloud:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync notes with cloud.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const createNote = async () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: { type: 'doc', content: [] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNote(newNote);
    saveToLocal(updatedNotes);

    // Sync to cloud if user is signed in
    if (user) {
      try {
        const noteToInsert = {
          id: newNote.id,
          title: newNote.title,
          content: newNote.content,
          created_at: newNote.created_at,
          updated_at: newNote.updated_at,
          user_id: user.id
        };
        const { data, error } = await supabase
          .from('notes')
          .insert([noteToInsert])
          .select()
          .single();

        if (error) throw error;

        // Update with cloud ID
        const cloudNote: Note = { ...data, user_id: data.user_id };
        const notesWithCloudId = updatedNotes.map(n => 
          n.id === newNote.id ? cloudNote : n
        );
        setNotes(notesWithCloudId);
        setActiveNote(cloudNote);
        saveToLocal(notesWithCloudId);
      } catch (error) {
        console.error('Error syncing new note to cloud:', error);
      }
    }

    toast({
      title: "Note Created",
      description: "New note created successfully.",
    });
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId ? { ...note, ...updates, updated_at: new Date().toISOString() } : note
    );
    setNotes(updatedNotes);
    saveToLocal(updatedNotes);
    
    if (activeNote?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
    }

    // Sync to cloud if user is signed in
    if (user) {
      try {
        const { error } = await supabase
          .from('notes')
          .update(updates)
          .eq('id', noteId);

        if (error) throw error;
      } catch (error) {
        console.error('Error syncing update to cloud:', error);
      }
    }
  };

  const deleteNote = async (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    saveToLocal(updatedNotes);

    if (activeNote?.id === noteId) {
      setActiveNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
    }

    // Delete from cloud if user is signed in
    if (user) {
      try {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', noteId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting from cloud:', error);
      }
    }

    toast({
      title: "Note Deleted",
      description: "Note deleted successfully.",
    });
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
    isSyncing,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    debouncedUpdate,
    syncWithCloud,
  };
};