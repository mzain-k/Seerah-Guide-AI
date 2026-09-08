import { MessageSquare, HelpCircle, ChevronLeft, ChevronRight, LogOut } from "lucide-react";

export default function Sidebar({
  isOpen,
  setIsOpen,
  sessions,
  onLogout,
  onSelectSession
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  sessions: any[];
  onLogout: () => void;
  onSelectSession: (session: any) => void;
}) {
  const quizzes = sessions.filter(s => s.session_type === "quiz");
  const tutors = sessions.filter(s => s.session_type === "tutor");

  const renderSessionList = (list: any[], icon: React.ReactNode, title: string) => {
    if (list.length === 0) return null;
    
    return (
      <div className="mb-6">
        {isOpen && <h3 className="text-xs font-bold text-seerah-muted uppercase tracking-wider mb-2 px-2">{title}</h3>}
        <div className="space-y-1">
          {list.map(session => (
            <button 
              key={session.id} 
              onClick={() => onSelectSession(session)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors ${!isOpen && 'justify-center'}`}
              title={!isOpen ? `${title} (Pages ${session.start_page}-${session.end_page})` : undefined}
            >
              {icon}
              {isOpen && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-gray-800">
                    Pages {session.start_page} - {session.end_page}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {session.language}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border-r border-seerah-border transition-all duration-300 flex flex-col h-screen shrink-0 ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className="p-4 flex items-center justify-between border-b border-seerah-border h-16 shrink-0">
        {isOpen && <span className="font-bold font-serif text-seerah-text truncate">My History</span>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
          {isOpen ? <ChevronLeft size={20}/> : <ChevronRight size={20}/>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {renderSessionList(quizzes, <HelpCircle size={18} className="text-seerah-accent shrink-0"/>, "Quizzes")}
        {renderSessionList(tutors, <MessageSquare size={18} className="text-blue-500 shrink-0"/>, "Tutor Lessons")}
        
        {isOpen && sessions.length === 0 && (
          <div className="text-center p-4 text-sm text-gray-400 mt-4">
            No history found.
          </div>
        )}
      </div>

      <div className="p-4 border-t border-seerah-border shrink-0">
        <button 
          onClick={onLogout} 
          className={`flex items-center gap-3 text-red-500 hover:bg-red-50 p-2 rounded-lg w-full transition-colors ${!isOpen && 'justify-center'}`}
        >
          <LogOut size={18} className="shrink-0" />
          {isOpen && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}