import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import './Chat.css';

// A unique, fixed ID for the admin.
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Effect to scroll to the bottom of the messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to fetch the list of conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const { data: convosData, error: convosError } = await supabase.rpc('get_conversations');
        if (convosError) throw convosError;

        if (convosData && convosData.length > 0) {
          const userIds = convosData.map(c => c.user_id);
          const supabaseAdmin = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_SERVICE_KEY);
          const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
          if (usersError) throw usersError;

          const conversationsWithEmails = convosData.map(convo => {
            const user = users.find(u => u.id === convo.user_id);
            return { ...convo, email: user ? user.email : 'Unknown User' };
          });
          setConversations(conversationsWithEmails);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        alert('Could not fetch conversations.');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Effect to fetch messages and subscribe to realtime updates
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${ADMIN_USER_ID}),(sender_id.eq.${ADMIN_USER_ID},receiver_id.eq.${selectedUser.user_id})`)
        .order('created_at', { ascending: true });

      if (error) {
        alert('Error fetching messages: ' + error.message);
      } else {
        setMessages(data);
      }
      setLoadingMessages(false);
    };

    fetchMessages();

    // Set up the real-time subscription
    const subscription = supabase
      .channel(`messages-${selectedUser.user_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        // Check if the new message belongs to the current conversation
        const newMessage = payload.new;
        if ((newMessage.sender_id === selectedUser.user_id && newMessage.receiver_id === ADMIN_USER_ID) ||
            (newMessage.sender_id === ADMIN_USER_ID && newMessage.receiver_id === selectedUser.user_id)) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      })
      .subscribe();

    // Cleanup function to remove the subscription
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      content: newMessage,
      sender_id: ADMIN_USER_ID,
      receiver_id: selectedUser.user_id,
    };

    const { error } = await supabase.from('messages').insert([messageData]);
    if (error) {
      alert('Error sending message: ' + error.message);
    } else {
      setNewMessage(''); // Clear the input field
    }
  };

  if (loading) return <p>Loading conversations...</p>;

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h3>Conversations ({conversations.length})</h3>
        <ul>
          {conversations.map(convo => (
            <li key={convo.user_id} onClick={() => setSelectedUser(convo)} className={selectedUser?.user_id === convo.user_id ? 'active' : ''}>
              <p className="email">{convo.email}</p>
              <p className="timestamp">{new Date(convo.last_message_time).toLocaleString()}</p>
            </li>
          ))}
        </ul>
        {conversations.length === 0 && !loading && <p className="no-conversations">No active conversations.</p>}
      </div>
      <div className="chat-window">
        {selectedUser ? (
          <>
            <h3>Chat with {selectedUser.email}</h3>
            <div className="messages-area">
              {loadingMessages ? <p>Loading messages...</p> : (
                messages.map(msg => (
                  <div key={msg.id} className={`message ${msg.sender_id === ADMIN_USER_ID ? 'sent' : 'received'}`}>
                    <p>{msg.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="message-input-area" onSubmit={handleSendMessage}>
              <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected"><p>Select a conversation from the left to start chatting.</p></div>
        )}
      </div>
    </div>
  );
}

export default Chat;