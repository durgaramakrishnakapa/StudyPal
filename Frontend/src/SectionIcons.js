const SectionIcons = {
  dashboard: ({ className = "w-16 h-16" }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="24" height="24" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="36" y="4" width="24" height="14" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="4" y="36" width="14" height="24" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="26" y="26" width="34" height="34" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <circle cx="16" cy="16" r="3" fill="#60a5fa"/>
      <circle cx="48" cy="11" r="2" fill="#60a5fa"/>
      <circle cx="11" cy="48" r="2" fill="#60a5fa"/>
      <rect x="30" y="30" width="26" height="2" fill="white"/>
      <rect x="30" y="36" width="20" height="2" fill="white"/>
      <rect x="30" y="42" width="24" height="2" fill="white"/>
      <rect x="30" y="48" width="18" height="2" fill="white"/>
    </svg>
  ),

  resourceProvider: ({ className = "w-16 h-16" }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="48" height="40" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="12" y="8" width="40" height="48" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="16" y="4" width="32" height="48" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <line x1="20" y1="16" x2="44" y2="16" stroke="white" strokeWidth="2"/>
      <line x1="20" y1="22" x2="40" y2="22" stroke="white" strokeWidth="2"/>
      <line x1="20" y1="28" x2="42" y2="28" stroke="white" strokeWidth="2"/>
      <line x1="20" y1="34" x2="38" y2="34" stroke="white" strokeWidth="2"/>
      <circle cx="32" cy="42" r="4" stroke="#10b981" strokeWidth="2" fill="#10b981/20"/>
      <path d="M28 42 L30 44 L36 38" stroke="#10b981" strokeWidth="2" fill="none"/>
    </svg>
  ),

  chatbot: ({ className = "w-16 h-16" }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="48" height="32" rx="8" stroke="white" strokeWidth="2" fill="white/10"/>
      <circle cx="22" cy="28" r="3" fill="#a855f7"/>
      <circle cx="42" cy="28" r="3" fill="#a855f7"/>
      <path d="M26 36 Q32 42 38 36" stroke="#a855f7" strokeWidth="2" fill="none"/>
      <rect x="4" y="12" width="8" height="8" rx="2" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="52" y="12" width="8" height="8" rx="2" stroke="white" strokeWidth="2" fill="white/10"/>
      <path d="M20 48 L24 52 L32 48 L40 52 L44 48" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="32" cy="8" r="4" stroke="#a855f7" strokeWidth="2" fill="#a855f7/20"/>
      <rect x="30" y="4" width="4" height="4" fill="#a855f7"/>
      <path d="M16 52 Q32 58 48 52" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  ),

  smartCanvas: ({ className = "w-16 h-16" }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="56" height="40" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="8" y="12" width="48" height="32" rx="2" stroke="white" strokeWidth="1" fill="black"/>
      <path d="M12 20 Q20 16 28 20 T44 20" stroke="#ec4899" strokeWidth="2" fill="none"/>
      <circle cx="16" cy="28" r="4" stroke="#ec4899" strokeWidth="2" fill="#ec4899/20"/>
      <rect x="24" y="24" width="8" height="8" rx="2" stroke="#ec4899" strokeWidth="2" fill="#ec4899/20"/>
      <polygon points="40,36 48,24 56,36" stroke="#ec4899" strokeWidth="2" fill="#ec4899/20"/>
      <rect x="2" y="52" width="60" height="8" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <circle cx="12" cy="56" r="2" fill="white"/>
      <circle cx="52" cy="56" r="2" fill="white"/>
      <path d="M20 56 L44 56" stroke="white" strokeWidth="2"/>
    </svg>
  ),

  codeGenerator: ({ className = "w-16 h-16" }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="56" height="48" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="4" y="8" width="56" height="12" rx="4" stroke="white" strokeWidth="2" fill="white/20"/>
      <circle cx="12" cy="14" r="2" fill="#f97316"/>
      <circle cx="20" cy="14" r="2" fill="#f97316"/>
      <circle cx="28" cy="14" r="2" fill="#f97316"/>
      <path d="M12 28 L18 34 L12 40" stroke="#f97316" strokeWidth="2" fill="none"/>
      <rect x="22" y="38" width="12" height="2" fill="#f97316"/>
      <path d="M40 28 L46 22 L52 28 L46 34 Z" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="8" y="46" width="48" height="2" fill="white/30"/>
      <rect x="8" y="50" width="36" height="2" fill="white/30"/>
      <circle cx="50" cy="46" r="6" stroke="#f97316" strokeWidth="2" fill="#f97316/20"/>
      <path d="M47 46 L49 48 L53 44" stroke="#f97316" strokeWidth="2" fill="none"/>
    </svg>
  ),

  contentGenerator: ({ className = "w-16 h-16" }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="48" height="56" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="12" y="8" width="40" height="4" fill="#14b8a6"/>
      <rect x="12" y="16" width="32" height="2" fill="white/70"/>
      <rect x="12" y="20" width="36" height="2" fill="white/70"/>
      <rect x="12" y="24" width="28" height="2" fill="white/70"/>
      <rect x="12" y="32" width="24" height="2" fill="white/70"/>
      <rect x="12" y="36" width="30" height="2" fill="white/70"/>
      <rect x="12" y="40" width="26" height="2" fill="white/70"/>
      <circle cx="48" cy="48" r="12" stroke="#14b8a6" strokeWidth="2" fill="black"/>
      <path d="M42 48 L46 52 L54 44" stroke="#14b8a6" strokeWidth="2" fill="none"/>
      <rect x="40" y="32" width="16" height="2" fill="white/50"/>
      <rect x="40" y="36" width="12" height="2" fill="white/50"/>
      <circle cx="16" cy="50" r="2" fill="#14b8a6"/>
      <circle cx="24" cy="50" r="2" fill="#14b8a6"/>
      <circle cx="32" cy="50" r="2" fill="#14b8a6"/>
    </svg>
  ),

  examPreparation: ({ className = "w-16 h-16" }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="2" fill="white/10"/>
      <circle cx="32" cy="32" r="20" stroke="#ef4444" strokeWidth="2" fill="black"/>
      <path d="M32 12 L36 20 L44 20 L38 26 L40 34 L32 30 L24 34 L26 26 L20 20 L28 20 Z" stroke="#ef4444" strokeWidth="2" fill="#ef4444"/>
      <rect x="30" y="48" width="4" height="8" fill="white"/>
      <rect x="26" y="52" width="12" height="4" rx="2" fill="white"/>
      <path d="M16 16 L20 12 M48 16 L44 12 M16 48 L20 52 M48 48 L44 52" stroke="#ef4444" strokeWidth="2"/>
      <circle cx="32" cy="32" r="4" fill="black"/>
      <rect x="30" y="30" width="4" height="4" fill="#ef4444"/>
      <path d="M8 32 L12 32 M52 32 L56 32 M32 8 L32 12 M32 52 L32 56" stroke="white" strokeWidth="2"/>
    </svg>
  ),

  presentation: ({ className = "w-16 h-16" }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="48" height="32" rx="4" stroke="white" strokeWidth="2" fill="white/10"/>
      <rect x="12" y="16" width="40" height="24" rx="2" stroke="white" strokeWidth="1" fill="black"/>
      <rect x="16" y="20" width="12" height="2" fill="#6366f1"/>
      <rect x="16" y="24" width="20" height="1" fill="white/70"/>
      <rect x="16" y="27" width="16" height="1" fill="white/70"/>
      <rect x="16" y="30" width="18" height="1" fill="white/70"/>
      <circle cx="42" cy="28" r="6" stroke="#6366f1" strokeWidth="2" fill="#6366f1/20"/>
      <rect x="39" y="25" width="6" height="6" fill="#6366f1"/>
      <line x1="4" y1="48" x2="60" y2="48" stroke="white" strokeWidth="2"/>
      <line x1="32" y1="44" x2="32" y2="52" stroke="white" strokeWidth="2"/>
      <rect x="28" y="52" width="8" height="4" rx="2" fill="white"/>
      <path d="M20 8 L24 4 L28 8" stroke="#6366f1" strokeWidth="2" fill="none"/>
      <path d="M36 8 L40 4 L44 8" stroke="#6366f1" strokeWidth="2" fill="none"/>
      <circle cx="6" cy="20" r="2" fill="#6366f1"/>
      <circle cx="58" cy="20" r="2" fill="#6366f1"/>
    </svg>
  ),


};

export default SectionIcons;