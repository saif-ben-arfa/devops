import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight/lib/core';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import clsx from 'clsx';

const extensions = [
  StarterKit,
  Link,
  Image,
  Highlight,
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  CodeBlockLowlight.configure({ lowlight }),
  TaskList,
  TaskItem,
  Placeholder.configure({ placeholder: 'Start typing your note...' }),
];

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/notes', { headers: { Authorization: `Bearer ${token}` } });
      console.log('API Response:', res.data); // Debug log
      if (!Array.isArray(res.data)) {
        console.error('Notes data is not an array:', res.data);
        setError('Invalid notes data received from server');
        return;
      }
      setNotes(res.data);
      if (res.data.length > 0) selectNote(res.data[0]);
    } catch (e) { 
      console.error('Error fetching notes:', e); // Debug log
      setError('Failed to load notes.'); 
    }
  };

  const selectNote = useCallback((note) => {
    setSelected(note);
    setTitle(note.title);
    if (editor) editor.commands.setContent(note.content || { type: 'doc', content: [] });
  }, []);

  const createNote = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:3001/api/notes', {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotes([res.data, ...notes]);
      selectNote(res.data);
    } catch { setError('Failed to create note.'); }
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/notes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const updated = notes.filter(n => n._id !== id);
      setNotes(updated);
      if (updated.length > 0) selectNote(updated[0]);
      else {
        setSelected(null);
        setTitle('');
        if (editor) editor.commands.setContent({ type: 'doc', content: [] });
      }
    } catch { setError('Failed to delete note.'); }
  };

  const saveNote = async (content) => {
    if (!selected || isSaving) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:3001/api/notes/${selected._id}`, { title, content }, { headers: { Authorization: `Bearer ${token}` } });
      setNotes(notes.map(n => n._id === selected._id ? { ...n, title, content } : n));
    } catch { setError('Failed to save note.'); } finally { setIsSaving(false); }
  };

  const editor = useEditor({
    extensions,
    content: selected?.content || { type: 'doc', content: [] },
    onUpdate: ({ editor }) => { saveNote(editor.getJSON()); },
  });

  // Drag-and-drop
  const onDragEnd = result => {
    if (!result.destination) return;
    const reordered = Array.from(notes);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setNotes(reordered.map((n, i) => ({ ...n, order: i })));
    // Optionally: send new order to backend
  };

  // Filtered notes
  const filteredNotes = Array.isArray(notes) ? notes
    .filter(note => note && note.title && note.title.toLowerCase().includes(search.toLowerCase()))
    .filter(note => !tagFilter || (note.tags && Array.isArray(note.tags) && note.tags.includes(tagFilter)))
    .sort((a, b) => (b.pinned - a.pinned) || (a.order - b.order))
    : [];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex h-[80vh] bg-gray-50 dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notes</h2>
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={createNote}
            >
              + New
            </button>
          </div>
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="m-2 p-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          {/* Tag filter UI can go here */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="notes">
              {provided => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {filteredNotes.map((note, idx) => (
                    <Draggable key={note._id} draggableId={note._id} index={idx}>
                      {provided => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={clsx(
                            "px-4 py-3 cursor-pointer border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700",
                            selected && note._id === selected._id && "bg-blue-100 dark:bg-gray-700"
                          )}
                          onClick={() => selectNote(note)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold truncate text-gray-900 dark:text-gray-100">{note.title || 'Untitled Note'}</span>
                            {note.pinned && <span className="text-yellow-500 ml-2">★</span>}
                          </div>
                          {/* Tag display */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {note.tags?.map(tag => (
                              <span key={tag} className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-0.5 rounded text-gray-800 dark:text-gray-200">{tag}</span>
                            ))}
                          </div>
                          <button
                            className="text-xs text-red-400 hover:text-red-600 mt-1"
                            onClick={e => { e.stopPropagation(); deleteNote(note._id); }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <div className="p-8 flex-1 flex flex-col">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => saveNote(editor.getJSON())}
              placeholder="Untitled Note"
              className="w-full text-3xl font-bold mb-4 border-2 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-gray-900 rounded-lg px-4 py-2 shadow-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none transition text-gray-900 dark:text-gray-100"
            />
            <div className="flex-1 bg-blue-50 dark:bg-gray-800 border-2 border-blue-200 dark:border-gray-700 rounded-lg shadow p-4 focus-within:border-blue-500 transition">
              {editor ? (
                <EditorContent editor={editor} className="prose max-w-none min-h-[300px] outline-none text-gray-900 dark:text-gray-100" />
              ) : (
                <p>Loading editor...</p>
              )}
              {!selected?.content?.content?.length && (
                <div className="absolute left-8 top-8 text-gray-400 pointer-events-none select-none">
                  Start typing your note...
                </div>
              )}
            </div>
            <div className="text-right text-xs text-gray-400 mt-2">
              {isSaving ? 'Saving...' : 'Saved'}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            {error ? error : 'Select or create a note to get started.'}
          </div>
        )}
      </div>
      {/* Error message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-2 rounded shadow">
          {error}
        </div>
      )}
    </div>
    </div>
  );
}
