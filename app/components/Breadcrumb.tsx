import Link from 'next/link';

type Segment = { href: string; label: string };

export default function Breadcrumb({ segments }: { segments: Segment[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
      <Link href="/" className="hover:text-gray-600">🏠</Link>
      {segments.map((seg, i) => (
        <span key={seg.href} className="flex items-center gap-1.5">
          <span>/</span>
          {i === segments.length - 1 ? (
            <span className="text-gray-600 font-medium">{seg.label}</span>
          ) : (
            <Link href={seg.href} className="hover:text-gray-600">{seg.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
