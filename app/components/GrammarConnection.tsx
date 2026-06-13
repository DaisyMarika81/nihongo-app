'use client';

type Connection = {
  type: string;
  note?: string;
};

export default function GrammarConnection({
  connections,
  pattern,
  index,
}: {
  connections: Connection[];
  pattern: string;
  index?: number;
}) {
  if (!connections || connections.length === 0) return null;

  return (
    <div style={{ background: '#F8F7FF', border: '1px solid #DDD6FE' }} className="rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[12px] font-bold text-indigo-400 tracking-wider">CẤU TRÚC</div>
        {index !== undefined && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#F3F0FF', color: '#6D5DF6' }}>#{index}</span>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1.5">
          {connections.map((conn, i) => (
            <span
              key={i}
              className="bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full text-base font-mono font-bold whitespace-nowrap text-center leading-relaxed hover:bg-indigo-200 transition-colors cursor-default"
            >
              <span className="mr-1 opacity-50">▸</span>{conn.type}{conn.note ? <span className="ml-1 font-normal text-indigo-500 text-sm">({conn.note})</span> : null}
            </span>
          ))}
        </div>
        <div className="text-2xl font-bold text-indigo-400 flex-shrink-0 self-center">+</div>
        <div className="text-2xl font-bold text-indigo-600 font-mono self-center leading-snug">
          {pattern}
        </div>
      </div>
    </div>
  );
}
