import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const priorities = ['Low', 'Medium', 'High'];
const statuses = ['In Progress', 'Completed', 'Failed'];

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    priority: 'Medium',
    endDate: '',
    status: 'In Progress',
  });
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/todos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodos(response.data);
    } catch (err) {
      setError('Failed to load todos.');
    }
  };

  const openModal = (todo = null) => {
    setSelectedTodo(todo);
    setForm(todo ? {
      title: todo.title,
      priority: todo.priority,
      endDate: todo.due_date ? todo.due_date.split('T')[0] : '',
      status: todo.status || 'In Progress',
    } : {
      title: '',
      priority: 'Medium',
      endDate: '',
      status: 'In Progress',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTodo(null);
    setForm({ title: '', priority: 'Medium', endDate: '', status: 'In Progress' });
    setError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (selectedTodo) {
        // Edit
        await axios.patch(`http://localhost:3001/api/todos/${selectedTodo._id}`, {
          title: form.title,
          priority: form.priority,
          due_date: form.endDate ? new Date(form.endDate).toISOString() : undefined,
          status: form.status,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create
        await axios.post('http://localhost:3001/api/todos', {
          title: form.title,
          priority: form.priority,
          due_date: form.endDate ? new Date(form.endDate).toISOString() : undefined,
          status: form.status,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      closeModal();
      fetchTodos();
    } catch (err) {
      setError('Failed to save task.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTodos();
    } catch (err) {
      setError('Failed to delete task.');
    }
  };

  // Calculate stats
  const stats = [
    { name: 'Completed', value: todos.filter(t => t.status === 'Completed').length },
    { name: 'In Progress', value: todos.filter(t => t.status === 'In Progress').length },
    { name: 'Failed', value: todos.filter(t => t.status === 'Failed').length },
  ];
  const COLORS = ['#22c55e', '#facc15', '#ef4444'];
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <h1 className="text-3xl font-bold mb-4">Todo List</h1>
        {/* Stats Chart */}
        <div className="mb-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2">Task Status Overview</h2>
          <ResponsiveContainer width={300} height={220}>
            <PieChart>
              <Pie data={stats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {stats.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <button
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => openModal()}
        >
          Create New
        </button>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="space-y-2">
          {todos.map(todo => (
            <div key={todo._id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded shadow">
              <div>
                <div className="text-lg font-semibold">{todo.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  Priority: <span className={`font-bold ${todo.priority === 'High' ? 'text-red-500' : todo.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>{todo.priority}</span>
                  {todo.due_date && (
                    <span> | Due: {new Date(todo.due_date).toLocaleDateString()}</span>
                  )}
                  {todo.status && (
                    <span> | Status: <span className="font-bold">{todo.status}</span></span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => openModal(todo)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(todo._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{selectedTodo ? 'Edit Task' : 'Create Task'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full border p-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full border p-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">End Date</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full border p-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border p-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {selectedTodo ? 'Save Changes' : 'Create'}
                  </button>
                </div>
                {error && <div className="text-red-500 mt-2">{error}</div>}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;