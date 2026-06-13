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
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {connections.map((conn, i) => (
            <span
              key={i}
              className="bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full text-sm sm:text-base font-mono font-bold text-center leading-relaxed hover:bg-indigo-200 transition-colors cursor-default"
            >
              <span className="mr-1 opacity-50">▸</span>{conn.type}{conn.note ? <span className="ml-1 font-normal text-indigo-500 text-xs sm:text-sm">({conn.note})</span> : null}
            </span>
          ))}
        </div>
        <div className="text-lg sm:text-2xl font-bold text-indigo-400 shrink-0">+</div>
        <div className="text-lg sm:text-2xl font-bold text-indigo-600 font-mono break-all">
          {pattern}
        </div>
      </div>
    </div>
  );
}
