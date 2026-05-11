export const AccountCardSkeleton = () => (
  <div
    className="bg-white p-6 flex flex-col gap-4 animate-pulse"
    style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderTop: '3px solid #e5e7eb' }}
  >
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-16" />
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-28" />
      <div className="h-10 bg-gray-200 rounded w-40" />
    </div>
    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
      <div className="w-2 h-2 rounded-full bg-gray-200" />
      <div className="h-3 bg-gray-200 rounded w-12" />
    </div>
  </div>
);

export const TransactionRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-16" /></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-40" /></td>
    <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-24 ml-auto" /></td>
    <td className="px-6 py-4 text-center"><div className="h-6 bg-gray-200 rounded-full w-16 mx-auto" /></td>
  </tr>
);

export const ChartSkeleton = () => (
  <div
    className="bg-white p-6 animate-pulse"
    style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
  >
    <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
    <div className="h-3 bg-gray-200 rounded w-28 mb-6" />
    <div className="flex items-end gap-3 h-48">
      {[60, 80, 50, 90, 70, 85].map((h, i) => (
        <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);
