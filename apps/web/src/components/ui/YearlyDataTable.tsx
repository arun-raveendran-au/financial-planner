import type { YearData } from '@financial-planner/types';

interface Props {
  data: YearData[];
  title: string;
}

export function YearlyDataTable({ data, title }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" data-testid="yearly-table">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 sticky top-0">
              <th className="p-3 text-left font-semibold text-gray-600">Year</th>
              <th className="p-3 text-right font-semibold text-gray-600">Opening</th>
              <th className="p-3 text-right font-semibold text-gray-600">Invested</th>
              <th className="p-3 text-right font-semibold text-gray-600">Withdrawn</th>
              <th className="p-3 text-right font-semibold text-gray-600">Growth</th>
              <th className="p-3 text-right font-semibold text-gray-600">Closing</th>
            </tr>
          </thead>
          <tbody>
            {data.map((y) => (
              <tr key={y.year} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-3 font-semibold text-gray-800">{y.year}</td>
                <td className="p-3 text-right text-gray-600">₹{Math.round(y.opening).toLocaleString('en-IN')}</td>
                <td className="p-3 text-right text-blue-600">+₹{Math.round(y.invested).toLocaleString('en-IN')}</td>
                <td className="p-3 text-right text-red-600">-₹{Math.round(y.withdrawn).toLocaleString('en-IN')}</td>
                <td className="p-3 text-right text-green-600">+₹{Math.round(y.growth).toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-bold text-gray-900">₹{Math.round(y.closing).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
