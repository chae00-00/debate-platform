import React from 'react';

export function renderInlineBold(line, isMine, key) {
  return (
    <p key={key} className={`leading-relaxed tracking-tight ${isMine ? 'text-stone-100' : 'text-stone-800'}`}>
      {renderInlineNodes(line, isMine)}
    </p>
  );
}

function renderInlineNodes(line, isMine) {
  // 인식 순서: 마크다운 링크 → 볼드 → plain URL
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*\*[^*]+\*\*|https?:\/\/[^\s,)>\]]+)/g;
  const parts = [];
  let last = 0;
  let m;
  while ((m = tokenRegex.exec(line)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: line.slice(last, m.index) });
    const token = m[0];
    if (token.startsWith('[')) {
      // [텍스트](URL)
      parts.push({ type: 'link', label: m[2], href: m[3] });
    } else if (token.startsWith('**')) {
      parts.push({ type: 'bold', value: token.slice(2, -2) });
    } else {
      // plain URL
      parts.push({ type: 'link', label: token, href: token });
    }
    last = m.index + token.length;
  }
  if (last < line.length) parts.push({ type: 'text', value: line.slice(last) });

  return parts.map((p, j) => {
    if (p.type === 'bold') return <strong key={j} className={isMine ? 'font-extrabold text-white' : 'font-extrabold text-stone-950'}>{p.value}</strong>;
    if (p.type === 'link') return (
      <a key={j} href={p.href} target="_blank" rel="noopener noreferrer"
        className={`underline underline-offset-2 break-all ${isMine ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}>
        {p.label}
      </a>
    );
    return <React.Fragment key={j}>{p.value}</React.Fragment>;
  });
}

export function renderMarkdown(text, isMine) {
  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      elements.push(
        <div key={key++} className={`font-black text-[20px] leading-tight mt-3 mb-1.5 pb-1 border-b ${
          isMine ? 'text-white border-white/20' : 'text-stone-900 border-stone-200'
        }`}>
          {renderInlineNodes(line.slice(2), isMine)}
        </div>
      );
    } else if (line.startsWith('## ')) {
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
    } else if (line.startsWith('#### ')) {
      elements.push(
        <div key={key++} className={`font-semibold text-[14px] leading-tight mt-2 mb-1 ${
          isMine ? 'text-stone-200' : 'text-stone-700'
        }`}>
          {renderInlineNodes(line.slice(5), isMine)}
        </div>
      );
    } else if (line.trim() === '---') {
      elements.push(
        <hr key={key++} className={`my-2 border-0 border-t ${isMine ? 'border-white/20' : 'border-stone-200'}`} />
      );
    } else if (/^[-*] /.test(line)) {
      elements.push(
        <div key={key++} className="flex items-start gap-1.5 leading-relaxed">
          <span className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${isMine ? 'bg-stone-300' : 'bg-stone-500'}`} />
          <span className={`tracking-tight ${isMine ? 'text-stone-100' : 'text-stone-800'}`}>
            {renderInlineNodes(line.slice(2), isMine)}
          </span>
        </div>
      );
    } else if (/^\d+\. /.test(line)) {
      const m = line.match(/^(\d+)\. (.*)/);
      elements.push(
        <div key={key++} className="flex items-start gap-1.5 leading-relaxed">
          <span className={`shrink-0 font-bold text-[12px] min-w-[16px] mt-[2px] ${isMine ? 'text-stone-300' : 'text-stone-500'}`}>
            {m[1]}.
          </span>
          <span className={`tracking-tight ${isMine ? 'text-stone-100' : 'text-stone-800'}`}>
            {renderInlineNodes(m[2], isMine)}
          </span>
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
