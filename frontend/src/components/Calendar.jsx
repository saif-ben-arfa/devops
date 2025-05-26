import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

const CATEGORY_OPTIONS = [
  { value: 'work', label: 'Work', color: '#1e90ff', icon: '💼' },
  { value: 'personal', label: 'Personal', color: '#28a745', icon: '🏠' },
  { value: 'meeting', label: 'Meeting', color: '#ffc107', icon: '📅' },
  { value: 'other', label: 'Other', color: '#6c757d', icon: '🔖' },
];

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    category: 'work',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Map backend events to FullCalendar format
      setEvents(response.data.map(ev => ({
        id: ev._id,
        title: ev.title,
        start: ev.startDate,
        end: ev.endDate,
        description: ev.description,
        category: ev.category || 'work',
      })));
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleDateSelect = (selectInfo) => {
    setShowEventForm(true);
    setNewEvent({
      title: '',
      description: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr || selectInfo.startStr,
      category: 'work',
    });
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/api/events', {
        title: newEvent.title,
        description: newEvent.description,
        startDate: newEvent.start,
        endDate: newEvent.end,
        category: newEvent.category,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add the new event to local state
      setEvents(prevEvents => [...prevEvents, {
        id: response.data._id,
        title: response.data.title,
        start: response.data.startDate,
        end: response.data.endDate,
        description: response.data.description,
        category: response.data.category,
      }]);
      
      setShowEventForm(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleEventDelete = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state by removing the deleted event
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const eventContent = (eventInfo) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === eventInfo.event.extendedProps.category) || CATEGORY_OPTIONS[0];
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: 4 }}>{cat.icon}</span>
        <b>{eventInfo.event.title}</b>
      </div>
    );
  };

  const eventDidMount = (info) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === info.event.extendedProps.category) || CATEGORY_OPTIONS[0];
    info.el.style.backgroundColor = cat.color;
    info.el.style.borderColor = cat.color;
  };

  const handleEventDrop = async (info) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:3001/api/events/${info.event.id}`, {
        title: info.event.title,
        description: info.event.extendedProps.description,
        startDate: info.event.start.toISOString(),
        endDate: info.event.end ? info.event.end.toISOString() : info.event.start.toISOString(),
        category: info.event.extendedProps.category || 'work',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state with the updated event
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === info.event.id 
            ? {
                ...event,
                start: info.event.start,
                end: info.event.end || info.event.start,
              }
            : event
        )
      );
      
      // If Google Calendar is connected, sync the update
      const user = await axios.get('http://localhost:3001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (user.data.googleTokens) {
        await axios.post('http://localhost:3001/api/google/sync', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error updating event:', error);
      info.revert(); // Revert the drag if the update fails
    }
  };

  const handleEventResize = async (info) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:3001/api/events/${info.event.id}`, {
        title: info.event.title,
        description: info.event.extendedProps.description,
        startDate: info.event.start.toISOString(),
        endDate: info.event.end ? info.event.end.toISOString() : info.event.start.toISOString(),
        category: info.event.extendedProps.category || 'work',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state with the updated event
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === info.event.id 
            ? {
                ...event,
                start: info.event.start,
                end: info.event.end || info.event.start,
              }
            : event
        )
      );
      
      // If Google Calendar is connected, sync the update
      const user = await axios.get('http://localhost:3001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (user.data.googleTokens) {
        await axios.post('http://localhost:3001/api/google/sync', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error resizing event:', error);
      info.revert(); // Revert the resize if the update fails
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEventForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Event
          </button>
          <button
            onClick={async () => {
              const token = localStorage.getItem('token');
              const res = await fetch('http://localhost:3001/api/google/auth', {
                headers: { Authorization: `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.url) {
                window.location.href = data.url;
              } else {
                alert('Failed to get Google OAuth URL');
              }
            }}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Connect Google Calendar
          </button>
          <button
            onClick={async () => {
              const token = localStorage.getItem('token');
              await axios.post('http://localhost:3001/api/google/sync', {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              alert('Events synced to Google Calendar!');
            }}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Sync Events
          </button>
        </div>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        selectable={true}
        select={handleDateSelect}
        events={events}
        eventContent={eventContent}
        eventDidMount={eventDidMount}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        height="auto"
        editable={true}
        droppable={true}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventClick={(info) => {
          if (window.confirm('Delete this event?')) {
            handleEventDelete(info.event.id);
          }
        }}
      />
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 z-60">
            <h3 className="text-xl font-bold mb-4">Add Event</h3>
            <form onSubmit={handleEventSubmit}>
              <div className="mb-4">
                <label className="block mb-2">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full border p-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full border p-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Start Date</label>
                <input
                  type="date"
                  value={newEvent.start}
                  onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  className="w-full border p-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">End Date</label>
                <input
                  type="date"
                  value={newEvent.end}
                  onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  className="w-full border p-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Category</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  className="w-full border p-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="px-4 py-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar; 