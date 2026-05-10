import React from 'react';

export function renderInlineBold(line, isMine, key) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className={`leading-relaxed tracking-tight ${isMine ? 'text-stone-100' : 'text-stone-800'}`}>
      {parts.map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j} className={isMine ? 'font-extrabold text-white' : 'font-extrabold text-stone-950'}>{part.slice(2, -2)}</strong>
          : part
      )}
    </p>
  );
}

function renderInlineNodes(line, isMine) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, j) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={j} className={isMine ? 'font-extrabold text-white' : 'font-extrabold text-stone-950'}>{part.slice(2, -2)}</strong>
      : <React.Fragment key={j}>{part}</React.Fragment>
  );
}

export function renderMarkdown(text, isMine) {
  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      elements.push(
        <div key={key++} className={`font-extrabold text-[18px] leading-tight mt-3 mb-1.5 pb-1 border-b ${
          isMine ? 'text-white/90 border-white/20' : 'text-stone-800 border-stone-200'
        }`}>
          {renderInlineNodes(line.slice(3), isMine)}
        </div>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <div key={key++} className={`font-bold text-[16px] leading-tight mt-2.5 mb-1.5 pb-1 border-b ${
          isMine ? 'text-stone-100 border-white/20' : 'text-stone-800 border-stone-200'
        }`}>
          {renderInlineNodes(line.slice(4), isMine)}
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1.5" />);
    } else {
      elements.push(renderInlineBold(line, isMine, key++));
    }
  }
  return elements;
}
