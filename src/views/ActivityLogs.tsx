import React, { useState, useMemo } from 'react';
import { useStore, ActivityLog } from '../store/useStore';
import { Card, CardContent } from '../components/ui/card';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  X,
  FileSpreadsheet
} from 'lucide-react';

export default function ActivityLogs() {
  const { activityLogs } = useStore();

  // Filters State
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Selected Log State
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Dynamic modules list
  const modules = useMemo(() => {
    const mods = new Set(activityLogs.map(l => l.module));
    return ['All', ...Array.from(mods)];
  }, [activityLogs]);

  // Filter logs list
  const filteredLogs = useMemo(() => {
    let list = [...activityLogs];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => 
        l.action.toLowerCase().includes(q) || 
        l.user.toLowerCase().includes(q) || 
        l.ip.includes(q)
      );
    }

    if (filterModule !== 'All') {
      list = list.filter(l => l.module === filterModule);
    }

    if (filterStatus !== 'All') {
      list = list.filter(l => l.status === filterStatus);
    }

    return list;
  }, [activityLogs, search, filterModule, filterStatus]);

  // Paginated logs
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filterModule, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-805 dark:text-zinc-100">System Activity Logs</h2>
          <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold font-medium">Chronological audit ledger of user inputs, database actions, print jobs, and session attempts.</p>
        </div>
        <button className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold px-3 py-2 rounded-lg hover:bg-zinc-50 active:scale-95 transition-all">
          <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          Export Logs CSV
        </button>
      </div>

      {/* Filter and Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search logs by action keywords, user emails, client IPs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2">
              <span className="text-zinc-400 font-medium">Module:</span>
              <select 
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="bg-transparent py-1.5 focus:outline-none text-zinc-700 dark:text-zinc-300"
              >
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2">
              <span className="text-zinc-400 font-medium">State:</span>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent py-1.5 focus:outline-none text-zinc-700 dark:text-zinc-300"
              >
                <option value="All">All States</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Logs Table */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-zinc-500 font-semibold select-none whitespace-nowrap">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Module Action</th>
                <th className="p-4">Operation Category</th>
                <th className="p-4">Client IP</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Audit details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium text-zinc-700 dark:text-zinc-355">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10">
                  <td className="p-4 font-bold text-zinc-900 dark:text-white whitespace-nowrap">{log.user}</td>
                  <td className="p-4 truncate max-w-[280px] whitespace-nowrap" title={log.action}>{log.action}</td>
                  <td className="p-4 font-mono uppercase text-[10px] whitespace-nowrap">{log.module}</td>
                  <td className="p-4 font-mono text-zinc-405 whitespace-nowrap">{log.ip}</td>
                  <td className="p-4 text-zinc-405 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      log.status === 'success' ? 'bg-emerald-100 text-emerald-805 dark:bg-emerald-950/20 dark:text-emerald-450' : 'bg-red-100 text-red-805 dark:bg-red-955/20 dark:text-red-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="bg-zinc-150 hover:bg-indigo-600 hover:text-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded transition-all active:scale-95"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-150 dark:border-zinc-800 px-4 py-3 flex items-center justify-between text-xs font-semibold">
          <span className="text-zinc-500">Showing page {currentPage} of {totalPages} ({filteredLogs.length} total activity logs)</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* DETAIL DRAWER DIALOG */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            onClick={() => setSelectedLog(null)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
            <div className="w-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-2xl text-xs font-semibold">
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <span className="bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wider text-zinc-500">
                      Activity Inspection
                    </span>
                    <h3 className="text-sm font-black mt-2 text-zinc-900 dark:text-white">Audit Log: {selectedLog.id}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedLog(null)}
                    aria-label="Close"
                    className="p-1 rounded-full hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 divide-y divide-zinc-100 dark:divide-zinc-800 text-[11px]">
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">User Identity:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">{selectedLog.user}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">Adjustment Action:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200 text-right max-w-[200px]">{selectedLog.action}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">Operation Module:</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-300 uppercase">{selectedLog.module}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">Client Host IP:</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-350">{selectedLog.ip}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">Exact Timestamp:</span>
                    <span className="text-zinc-800 dark:text-zinc-350">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">Verification Result:</span>
                    <span className={`font-black uppercase ${selectedLog.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="w-full bg-zinc-950 dark:bg-zinc-800 text-white font-bold py-2 rounded-lg hover:bg-zinc-900 dark:hover:bg-zinc-700 flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
