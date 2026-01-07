'use client';
import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Note } from '@/lib/types';
import { addNote, getAllNotes, deleteNote, updateNote } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

export function NotesClientPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    try {
      const allNotes = await getAllNotes();
      setNotes(allNotes.sort((a, b) => b.id - a.id));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching notes',
        description: 'Could not load notes from the database.',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: '', content: '', category: '' },
  });

  const onSubmit = async (data: NoteFormData) => {
    try {
      if (editingNote) {
        await updateNote({ ...editingNote, ...data });
        toast({ title: 'Note updated successfully' });
      } else {
        await addNote(data);
        toast({ title: 'Note added successfully' });
      }
      await fetchNotes();
      setIsFormOpen(false);
      setEditingNote(null);
      form.reset();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving note',
        description: 'Could not save the note.',
      });
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    form.reset(note);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingNote(null);
    form.reset();
    setIsFormOpen(true);
  };
  
  const handleDelete = async (id: number) => {
    try {
        await deleteNote(id);
        toast({ title: 'Note deleted successfully' });
        await fetchNotes();
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Error deleting note",
            description: "Could not delete the note.",
        });
    }
  }

  return (
    <PageTemplate
      title="Notes"
      description="Jot down grammar rules, thoughts, and ideas."
      actions={
        <>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <Upload className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Import</span>
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Note</span>
          </Button>
        </>
      }
    >
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Add New Note'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea {...field} rows={8} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category (Optional)</FormLabel><FormControl><Input {...field} placeholder="e.g., Grammar, Idioms" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Save Note</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.length > 0 ? notes.map((note) => (
          <Card key={note.id}>
            <CardHeader>
              <CardTitle>{note.title}</CardTitle>
              {note.category && <CardDescription>{note.category}</CardDescription>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-4">{note.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString()}
                </p>
                <div>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(note)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(note.id)}>Delete</Button>
                </div>
            </CardFooter>
          </Card>
        )) : (
            <div className="col-span-full h-64 flex flex-col items-center justify-center rounded-lg border-2 border-dashed">
                <h3 className="text-lg font-semibold">No notes yet</h3>
                <p className="text-muted-foreground">Click 'Add Note' to get started.</p>
            </div>
        )}
      </div>
    </PageTemplate>
  );
}
