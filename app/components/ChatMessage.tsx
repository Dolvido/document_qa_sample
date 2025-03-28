import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { Message } from '@/app/types/chat';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { text, isAi, citations } = message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 ${!isAi ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isAi ? 'bg-primary/20' : 'bg-slate-700'
        }`}
      >
        {isAi ? (
          <Bot className="h-5 w-5 text-primary" />
        ) : (
          <User className="h-5 w-5 text-slate-300" />
        )}
      </div>

      <div className={`flex max-w-[80%] flex-col gap-2 ${!isAi ? 'items-end' : ''}`}>
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className={`relative rounded-2xl ${
            isAi
              ? 'bg-slate-800/50 text-slate-300 rounded-tl-sm'
              : 'bg-primary text-white rounded-tr-sm'
          } px-5 py-3 shadow-lg`}
        >
          {/* Chat bubble pointer */}
          <div
            className={`absolute top-4 ${
              isAi ? '-left-2' : '-right-2'
            } h-4 w-4 transform ${
              isAi ? 'bg-slate-800/50' : 'bg-primary'
            } rotate-45`}
          />
          
          {/* Message text */}
          <div className="relative">
            <p className="text-sm leading-relaxed">{text}</p>
          </div>
        </motion.div>

        {citations && citations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2 w-full"
          >
            <p className="text-xs font-medium text-slate-400">Citations:</p>
            {citations.map((citation, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: isAi ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={`rounded-xl bg-slate-800/30 p-3 text-xs ${
                  !isAi ? 'text-right' : ''
                }`}
              >
                <p className="mb-2 italic text-slate-300">&quot;{citation.text}&quot;</p>
                <p className="text-slate-500">
                  Source: {citation.source}, Page {citation.page}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 