import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import './Chat.css'; // We will update this file next

const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${ADMIN_USER_ID}),and(sender_id.eq.${ADMIN_USER_ID},receiver_id.eq.${selectedUser.user_id})`)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error);
      else setMessages(data);
      setLoadingMessages(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages-${selectedUser.user_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new;
        if ((newMessage.sender_id === selectedUser.user_id && newMessage.receiver_id === ADMIN_USER_ID) ||
            (newMessage.sender_id === ADMIN_USER_ID && newMessage.receiver_id === selectedUser.user_id)) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const messageData = { content: newMessage, sender_id: ADMIN_USER_ID, receiver_id: selectedUser.user_id };
    const { error } = await supabase.from('messages').insert([messageData]);
    if (error) alert('Error sending message: ' + error.message);
    else setNewMessage('');
  };

  return (
    <div>
      <h1>Live Chat</h1>
      <div className="chat-layout">
        <div className="conversations-panel">
          <h3>Conversations ({conversations.length})</h3>
          {loading ? <p>Loading...</p> : (
            <ul>
              {conversations.map(convo => (
                <li key={convo.user_id} onClick={() => setSelectedUser(convo)} className={selectedUser?.user_id === convo.user_id ? 'active' : ''}>
                  <p className="convo-email">{convo.email}</p>
                  <p className="convo-time">{new Date(convo.last_message_time).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="chat-window-panel">
          {selectedUser ? (
            <>
              <div className="chat-window-header">
                Chat with {selectedUser.email}
              </div>
              <div className="messages-display">
                {loadingMessages ? <p>Loading messages...</p> : (
                  messages.map(msg => (
                    <div key={msg.id} className={`message-bubble ${msg.sender_id === ADMIN_USER_ID ? 'sent' : 'received'}`}>
                      <p>{msg.content}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <button type="submit">Send</button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Select a conversation from the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;