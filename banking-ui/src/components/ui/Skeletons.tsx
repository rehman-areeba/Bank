export const AccountCardSkeleton = () => (
  <div
    className="bg-white p-6 flex flex-col gap-4"
    style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderTop: '3px solid var(--border-color)', background: 'var(--card-bg)' }}
  >
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-4 w-32" />
      </div>
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton h-10 w-40" />
    </div>
    <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
      <div className="skeleton w-2 h-2 rounded-full" />
      <div className="skeleton h-3 w-12" />
    </div>
  </div>
);

export const TransactionRowSkeleton = () => (
  <tr>
    <td className="px-6 py-4"><div className="skeleton h-4 w-20" /></td>
    <td className="px-6 py-4"><div className="skeleton h-6 w-16 rounded-full" /></td>
    <td className="px-6 py-4"><div className="skeleton h-4 w-40" /></td>
    <td className="px-6 py-4 text-right"><div className="skeleton h-4 w-24 ml-auto" /></td>
    <td className="px-6 py-4 text-center"><div className="skeleton h-6 w-16 mx-auto rounded-full" /></td>
  </tr>
);

export const ChartSkeleton = () => (
  <div
    className="p-6"
    style={{ borderRadius: '12px', boxShadow: 'var(--shadow-card)', background: 'var(--card-bg)' }}
  >
    <div className="skeleton h-5 w-40 mb-2" />
    <div className="skeleton h-3 w-28 mb-6" />
    <div className="flex items-end gap-3 h-48">
      {[60, 80, 50, 90, 70, 85].map((h, i) => (
        <div key={i} className="skeleton flex-1 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);
