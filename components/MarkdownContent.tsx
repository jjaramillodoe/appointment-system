'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface MarkdownContentProps {
  children: string;
  className?: string;
}

export default function MarkdownContent({ children, className = '' }: MarkdownContentProps) {
  if (!children?.trim()) return null;

  return (
    <div className={`text-sm text-gray-800 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mt-3 mb-2 first:mt-0">{children}</h2>,
          h2: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mt-3 mb-1.5 first:mt-0">{children}</h3>,
          h3: ({ children }) => <h4 className="text-sm font-semibold text-gray-900 mt-2.5 mb-1 first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="leading-relaxed mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
