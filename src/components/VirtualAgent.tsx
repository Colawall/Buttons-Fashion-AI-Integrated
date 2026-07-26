import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { ChatMessage, User, Product } from "../types";

// Dynamic Lucide Icon Helper
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.HelpCircle className={className} />;
  return <IconComponent className={className} />;
};

interface VirtualAgentProps {
  currentUser: User;
  cartItemsCount: number;
  products: Product[];
  onAddComplaint: () => void; // Trigger catalog update on user dashboard if relevant
  onNavigateToCatalog: () => void;
}

export default function VirtualAgent({
  currentUser,
  cartItemsCount,
  products,
  onAddComplaint,
  onNavigateToCatalog
}: VirtualAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "agent",
      text: `Warm greetings, **${currentUser.username}**! 🌻 I'm your virtual **Atelier Assistant** for **Buttons Fashion**—engineered with beauty, growth, and strength. I can guide you through our empowering ready-to-wear tailored apparel, assist you with custom sizes, or log support tickets instantly. How can I empower your style journey today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isOpen, isLoading]);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      const message = customEvent.detail?.message;
      setIsOpen(true);
      if (message) {
        sendUserMessage(message);
      }
    };
    window.addEventListener("open-atelier-chat", handleOpenChat);
    return () => {
      window.removeEventListener("open-atelier-chat", handleOpenChat);
    };
  }, [chatHistory]);

  // Handle Quick chip clicks
  const handleQuickPrompt = async (promptText: string) => {
    if (isLoading) return;
    await sendUserMessage(promptText);
  };

  const sendUserMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add User message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatHistory, userMsg].map((m) => ({
            sender: m.sender,
            text: m.text
          })),
          userContext: {
            username: currentUser.username,
            role: currentUser.role,
            cartItemsCount
          }
        })
      });

      if (!response.ok) {
        throw new Error("Chat response failed");
      }

      const data = await response.json();

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isComplaintTriggered: data.isComplaintTriggered
      };

      setChatHistory((prev) => [...prev, agentMsg]);
      
      if (data.isComplaintTriggered) {
        // Trigger dashboard alert callback
        onAddComplaint();
      }
    } catch (err) {
      console.error("Chat error:", err);
      // Fallback response inside client if server drops
      const fallbackMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: "agent",
        text: "I experienced a slight connection delay. However, I am still offline-active! Can I help you calculate your recommended size or recommend couture pieces?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendUserMessage(inputText);
    }
  };

  // Convert asterisks to beautiful bold nodes for stylish display
  const renderMessageText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-extrabold text-slate-800 dark:text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const getRoleBadgeColor = () => {
    if (currentUser.role === 'student') return 'text-white border-white bg-white/10';
    if (currentUser.role === 'super_user') return 'text-white border-white bg-white/10';
    return 'text-white border-white bg-white/10';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Dynamic Action Trigger Button */}
      <motion.button
        id="btn-virtual-agent-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-black hover:bg-[#000000] text-white shadow-xl rounded-none p-4 md:px-5 md:py-3.5 transition-all text-[11px] font-bold border border-black cursor-pointer uppercase tracking-widest"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icons.Sparkles className="h-4 w-4 text-white animate-pulse" />
        <span className="hidden md:inline">Ask Atelier Assistant</span>
        <span className="flex items-center justify-center bg-white text-black font-mono font-bold text-[9px] px-1.5 py-0.5 border border-black">
          AI
        </span>
      </motion.button>

      {/* Interactive Helper Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="panel-assistant-window"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            className="absolute bottom-16 right-0 w-[92vw] sm:w-[410px] h-[580px] bg-white rounded-none shadow-2xl border-2 border-black overflow-hidden flex flex-col"
          >
            {/* Soft Header */}
            <div className="bg-black p-5 text-white relative rounded-none">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white hover:opacity-85 p-1.5 rounded-none transition-opacity cursor-pointer border-none bg-transparent"
              >
                <Icons.X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="bg-white/15 p-2.5 rounded-none border border-white/20">
                  <Icons.Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-sans font-black uppercase tracking-wider text-base flex items-center gap-2">
                    Atelier Assistant
                    <span className="bg-magenta text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-none tracking-widest uppercase">
                      ONLINE
                    </span>
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5 font-mono tracking-wider uppercase">Fashion & Sizing Coordinator</p>
                </div>
              </div>

              {/* Status Context Pill */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10px] bg-white/10 p-2 rounded-none border border-white/5 font-mono tracking-widest uppercase">
                <span className="text-gray-400">Account:</span>
                <span className={`px-2 py-0.5 border font-bold ${getRoleBadgeColor()}`}>
                  {currentUser.role.replace('_', ' ')}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-white font-bold">{currentUser.username}</span>
              </div>
            </div>

            {/* Main scrollable body */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9F9F9]"
            >
              <AnimatePresence initial={false}>
                {chatHistory.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex gap-2 max-w-[85%] items-start">
                      {msg.sender === "agent" && (
                        <div className="bg-black p-1.5 rounded-none border border-black shrink-0 self-start mt-1">
                          <Icons.Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={`p-3.5 rounded-none shadow-sm text-xs leading-relaxed border ${
                          msg.sender === "user"
                            ? "bg-black text-white border-black"
                            : "bg-white text-black border-[#EFEFEF]"
                        }`}
                      >
                        <p className="whitespace-pre-line leading-relaxed">{renderMessageText(msg.text)}</p>
                        
                        {/* Incident saved badge indicator */}
                        {msg.isComplaintTriggered && (
                          <div className="mt-2.5 p-2.5 bg-white border border-black rounded-none flex items-center gap-2 text-[10px] text-black font-mono uppercase tracking-wider font-bold">
                            <Icons.AlertTriangle className="h-4 w-4 shrink-0 text-red-650" />
                            <div>
                              Complaint filed dynamically to dashboard.
                            </div>
                          </div>
                        )}

                        <span
                          className={`block text-[8px] mt-1.5 text-right font-mono tracking-wider uppercase ${
                            msg.sender === "user" ? "text-gray-400" : "text-gray-400"
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%] items-start">
                    <div className="bg-black p-1.5 rounded-none border border-black shrink-0 self-start mt-1">
                      <Icons.Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white text-black border border-[#EFEFEF] p-3 rounded-none flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper Chips */}
            <div className="px-4 py-2.5 bg-[#F5F5F5] border-t border-black space-y-2">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest font-mono">Quick Sparks</div>
              <div className="flex flex-wrap gap-1.5 max-h-[76px] overflow-y-auto pr-1">
                <button
                  onClick={() => handleQuickPrompt("Recommend some couture clothing!")}
                  className="bg-white hover:bg-black hover:text-white border border-[#EFEFEF] hover:border-black text-black text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-none text-left transition-all font-mono shrink-0 cursor-pointer"
                >
                  👗 Recommend clothing
                </button>
                <button
                  onClick={() => handleQuickPrompt("Show me the dress size chart guide.")}
                  className="bg-white hover:bg-black hover:text-white border border-[#EFEFEF] hover:border-black text-black text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-none text-left transition-all font-mono shrink-0 cursor-pointer"
                >
                  📐 Dress Size Guide
                </button>
                <button
                  onClick={() => handleQuickPrompt("How do standard prices differ from Student prices?")}
                  className="bg-white hover:bg-black hover:text-white border border-[#EFEFEF] hover:border-black text-black text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-none text-left transition-all font-mono shrink-0 cursor-pointer"
                >
                  🎓 Explain Student Offers
                </button>
                <button
                  onClick={() => handleQuickPrompt("I want to make a complaint about my delivery delay.")}
                  className="bg-white hover:bg-red-50 hover:text-red-700 border border-[#EFEFEF] hover:border-red-600 text-red-650 text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-none text-left transition-all font-mono shrink-0 cursor-pointer"
                >
                  ⚠️ File a complaint
                </button>
                <button
                  onClick={() => handleQuickPrompt("Introduce yourself!")}
                  className="bg-white hover:bg-black hover:text-white border border-[#EFEFEF] hover:border-black text-black text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-none text-left transition-all font-mono shrink-0 cursor-pointer"
                >
                  🌹 Who are you?
                </button>
              </div>
            </div>

            {/* Input area */}
            <div className="p-3 bg-white border-t border-black flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about sizing guides, fabrics, styles, or file complaints..."
                className="flex-grow bg-[#F5F5F5] border border-gray-200 hover:border-black focus:border-black focus:bg-white text-black placeholder-gray-400 text-xs px-3.5 py-3 rounded-none focus:outline-none transition-all font-sans"
                disabled={isLoading}
              />
              <button
                onClick={() => sendUserMessage(inputText)}
                className="bg-black hover:bg-[#000000] text-white p-3 rounded-none cursor-pointer transition-transform duration-105 active:scale-95 disabled:bg-gray-300 flex items-center justify-center border-none"
                disabled={!inputText.trim() || isLoading}
              >
                <Icons.Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
