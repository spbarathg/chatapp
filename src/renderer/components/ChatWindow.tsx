import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { encryptMessage } from '../utils/encryption';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  encrypted: boolean;
  type: 'text' | 'image' | 'video' | 'voice';
  attachmentUrl?: string;
}

interface Attachment {
  file: File;
  type: 'image' | 'video' | 'voice';
}

const ChatWindow: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contact, setContact] = useState<any>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const loadContact = async () => {
      const contacts = await window.electron.ipcRenderer.invoke('get-data', 'contacts');
      const currentContact = contacts?.find((c: any) => c.id === contactId);
      setContact(currentContact);
    };
    loadContact();
  }, [contactId]);

  useEffect(() => {
    const loadMessages = async () => {
      const storedMessages = await window.electron.ipcRenderer.invoke('get-data', `messages-${contactId}`);
      if (storedMessages) {
        setMessages(storedMessages);
      }
    };
    loadMessages();
  }, [contactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !contact) return;

    try {
      let messageContent = newMessage;
      let messageType: Message['type'] = 'text';
      let attachmentUrl: string | undefined;

      if (attachments.length > 0) {
        const attachment = attachments[0];
        messageType = attachment.type;
        attachmentUrl = await window.electron.ipcRenderer.invoke('upload-attachment', {
          file: attachment.file,
          type: attachment.type
        });
      }

      if (messageContent) {
        messageContent = await encryptMessage(messageContent, contact.publicKey);
      }

      const message: Message = {
        id: Date.now().toString(),
        senderId: 'user',
        content: messageContent,
        timestamp: new Date().toISOString(),
        encrypted: true,
        type: messageType,
        attachmentUrl
      };

      const updatedMessages = [...messages, message];
      await window.electron.ipcRenderer.invoke('set-data', `messages-${contactId}`, updatedMessages);
      setMessages(updatedMessages);
      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const type = file.type.startsWith('image/') ? 'image' :
                   file.type.startsWith('video/') ? 'video' : 'voice';
      setAttachments([{ file, type }]);
    }
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsVideoCallActive(true);
    } catch (error) {
      console.error('Failed to start video call:', error);
    }
  };

  const endVideoCall = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoCallActive(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        setAttachments([{ file, type: 'voice' }]);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'image':
        return (
          <img
            src={message.attachmentUrl}
            alt="Shared image"
            className="max-w-full rounded-lg"
            onClick={() => window.open(message.attachmentUrl, '_blank')}
          />
        );
      case 'video':
        return (
          <video
            src={message.attachmentUrl}
            controls
            className="max-w-full rounded-lg"
          />
        );
      case 'voice':
        return (
          <audio
            src={message.attachmentUrl}
            controls
            className="w-full"
          />
        );
      default:
        return (
          <p className="break-words text-input leading-relaxed">
            {message.encrypted ? '🔒 Encrypted' : message.content}
          </p>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-bg-primary animate-fade-in">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-dark-bg-secondary border-b border-dark-border">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-avatar bg-dark-accent-primary flex items-center justify-center text-white text-lg font-medium shadow-hover">
              {contact?.username?.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-bg-secondary ${
              contact?.status === 'online' ? 'bg-dark-online' : 'bg-dark-text-muted'
            }`} />
          </div>
          <div>
            <h2 className="text-chat-title font-bold text-dark-text-primary">{contact?.username}</h2>
            <span className="text-message-preview text-dark-text-muted">
              {contact?.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {!isVideoCallActive ? (
            <button
              onClick={startVideoCall}
              className="p-2 rounded-full hover:bg-dark-bg-hover transition-smooth"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-dark-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={endVideoCall}
              className="p-2 rounded-full bg-dark-error hover:bg-dark-error-hover transition-smooth"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Video Call */}
      {isVideoCallActive && (
        <div className="flex-1 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Messages */}
      {!isVideoCallActive && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-dark-bg-tertiary scrollbar-track-dark-bg-secondary">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[70%] rounded-message px-4 py-3 shadow-message transition-smooth ${
                  message.senderId === 'user'
                    ? 'bg-dark-message-sent text-dark-text-primary'
                    : 'bg-dark-message-received text-dark-text-primary'
                }`}
              >
                {renderMessage(message)}
                <span className="text-timestamp text-dark-text-muted mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Message Input */}
      {!isVideoCallActive && (
        <form onSubmit={handleSendMessage} className="p-6 bg-dark-bg-secondary border-t border-dark-border">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-dark-bg-hover transition-smooth"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-dark-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-full transition-smooth ${
                isRecording ? 'bg-dark-error hover:bg-dark-error-hover' : 'hover:bg-dark-bg-hover'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-dark-input-bg border border-dark-input-border rounded-input px-4 py-3 text-input text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-dark-input-focus transition-smooth shadow-input"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() && attachments.length === 0}
              className="w-12 h-12 rounded-full bg-dark-accent-primary text-white flex items-center justify-center hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-hover"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
          {attachments.length > 0 && (
            <div className="mt-4 flex items-center space-x-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative">
                  {attachment.type === 'image' && (
                    <img
                      src={URL.createObjectURL(attachment.file)}
                      alt="Attachment preview"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  {attachment.type === 'video' && (
                    <video
                      src={URL.createObjectURL(attachment.file)}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  {attachment.type === 'voice' && (
                    <div className="w-20 h-20 bg-dark-bg-tertiary rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-dark-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 bg-dark-error text-white rounded-full p-1 hover:bg-dark-error-hover transition-smooth"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default ChatWindow; 