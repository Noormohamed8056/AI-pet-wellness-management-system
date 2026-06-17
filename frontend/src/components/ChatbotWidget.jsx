import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  MessageCircle, 
  Bot, 
  User, 
  Sparkles,
  Dog,
  Cat,
  Bird,
  Rabbit,
  HelpCircle,
  Calendar,
  Pill,
  Syringe,
  ShoppingBag,
  Stethoscope,
  ChevronDown,
  LogIn
} from 'lucide-react';
import { sendChatMessage, getChatbotSuggestions, getPublicPlatformStats } from '../api/api';
import botImage from '../assets/bot.png';
import botGif from '../assets/bot-animated.gif';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Guest';
  const userRole = localStorage.getItem('userRole');

  // Initialize chatbot
  useEffect(() => {
    const welcomeMessage = userId 
      ? {
          id: 1,
          text: `👋 **Welcome back, ${userName?.split(' ')[0] || 'Pet Parent'}!** I'm your PetCare Assistant. How can I help you and your furry friends today? 🐾`,
          sender: 'bot',
          timestamp: new Date(),
          isMarkdown: true
        }
      : {
          id: 1,
          text: `👋 **Hello there!** I'm your PetCare Assistant! 🏥\n\nI can help you with:\n\n• 👨‍⚕️ Finding veterinarians\n• 📅 Booking appointments\n• 🐕 Pet health tracking\n• 🛍️ Pet shop products\n\n✨ **Tip:** Login to get personalized pet information!`,
          sender: 'bot',
          timestamp: new Date(),
          isMarkdown: true
        };
    
    setMessages([welcomeMessage]);
    loadSuggestions();
    loadPublicStats();
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadPublicStats = async () => {
    try {
      const response = await getPublicPlatformStats();
      localStorage.setItem('platformStats', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      if (userId) {
        const response = await getChatbotSuggestions(userId);
        setSuggestions(response.data);
      } else {
        setSuggestions([
          '👋 Hello',
          '👨‍⚕️ How many vets?',
          '📅 Book appointment',
          '🐾 About PetCare'
        ]);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await sendChatMessage(text, userId);
      
      setIsTyping(false);
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.message,
        sender: 'bot',
        timestamp: new Date(response.data.timestamp),
        isMarkdown: true
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Update suggestions
      if (response.data.suggestions) {
        setSuggestions(response.data.suggestions);
      }
      
      // Update unread count if chat is closed
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: '😔 **Oops!** I\'m having trouble connecting. Please try again or contact support.',
        sender: 'bot',
        timestamp: new Date(),
        isMarkdown: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion) => {
    // Remove emoji from suggestion for API call
    const cleanText = suggestion.replace(/[^\w\s?!.]/g, '').trim();
    sendMessage(cleanText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessage = (text) => {
    if (!text) return '';
    
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Bullet points
    text = text.replace(/•/g, '•');
    // Line breaks
    text = text.replace(/\n/g, '<br />');
    // Links
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-violet-600 hover:underline">$1</a>');
    
    return text;
  };

  const getPetIcon = () => {
    const icons = [Dog, Cat, Bird, Rabbit];
    const RandomIcon = icons[Math.floor(Math.random() * icons.length)];
    return <RandomIcon size={16} />;
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <>
    {/* Chat Button with Notification Badge */}
{!isOpen && (
   <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
    <button
      onClick={() => setIsOpen(true)}
      className="relative group"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 blur-xl opacity-70 group-hover:opacity-100 animate-pulse-slow"></div>
      
      {/* GIF Button */}
      <div className="relative animate-float">
        <img 
          src={botGif}
          alt="PetCare Assistant" 
          className="w-16 h-16 rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(139,92,246,0.9)] transition-all hover:scale-110 object-cover border-2 border-white relative z-10"
        />
      </div>
      
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-white shadow-lg font-bold z-20">
          {unreadCount}
        </span>
      )}
      
      {/* Tooltip */}
      <span className="absolute right-20 bottom-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl border border-gray-700">
        ✨ Chat with me!
      </span>
    </button>
    
    {/* Login Button for Guests */}
    {!userId && (
      <button
        onClick={handleLoginRedirect}
        className="mt-3 bg-white text-violet-600 px-4 py-2 rounded-lg shadow-md border border-violet-200 hover:bg-violet-50 transition-all flex items-center gap-2 text-sm font-medium"
      >
        <LogIn size={16} />
        Login for personalized help
      </button>
    )}
  </div>
)}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 z-50 animate-slideIn">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    PetCare Assistant
                    <Sparkles size={14} className="text-yellow-300" />
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1.5"></span>
                      <span className="text-xs text-white/90">Online</span>
                    </span>
                    {userId && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {userRole || 'User'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Quick Actions */}
            {userId && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex gap-2 text-xs">
                  <button className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg hover:bg-white/20 transition">
                    <Calendar size={12} />
                    Appointments
                  </button>
                  <button className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg hover:bg-white/20 transition">
                    <Dog size={12} />
                    My Pets
                  </button>
                  <button className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg hover:bg-white/20 transition">
                    <Stethoscope size={12} />
                    Find Vet
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot size={16} className="text-violet-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-violet-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.isMarkdown ? (
                    <div 
                      className="text-sm leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                  <p className={`text-[10px] mt-1.5 ${
                    msg.sender === 'user' ? 'text-violet-200' : 'text-gray-400'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                    <User size={16} className="text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start mb-4 animate-fadeIn">
                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center mr-2">
                  <Bot size={16} className="text-violet-600" />
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Carousel */}
          {suggestions.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2 px-1 flex items-center gap-1">
                <Sparkles size={12} />
                Suggested questions:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs whitespace-nowrap hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                  >
                    {suggestion.includes('pet') || suggestion.includes('Pet') ? getPetIcon() : null}
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={userId ? "Ask about your pets, appointments..." : "Ask about vets, services..."}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm bg-gray-50"
                  disabled={loading}
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`p-3 rounded-xl transition-all ${
                  loading || !input.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
            
            {/* Login Prompt for Guests */}
            {!userId && (
              <div className="mt-3 text-xs text-center">
                <span className="text-gray-500">New to PetCare? </span>
                <button 
                  type="button"
                  onClick={handleLoginRedirect}
                  className="text-violet-600 hover:underline font-medium"
                >
                  Login / Register
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Custom CSS */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .prose {
          max-width: 100%;
        }
        
        .prose strong {
          color: inherit;
          font-weight: 600;
        }
        
        .prose a {
          color: #7c3aed;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 2px;
        }
        
        .prose a:hover {
          color: #6d28d9;
        }
      `}</style>
    </>
  );
};

export default ChatbotWidget;