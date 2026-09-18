import React, { useState } from 'react';
import { Database, Play, RefreshCw, Terminal, CheckCircle2, Table, PanelLeftClose, PanelLeft, Plus, History, Code } from 'lucide-react';

interface TableDef {
  name: string;
  rowCount: number;
  columns: string[];
  data: any[];
}

export const SqlClientApp: React.FC = () => {
  const [tables, setTables] = useState<Record<string, TableDef>>({
    users: {
      name: 'users',
      rowCount: 3,
      columns: ['id', 'username', 'role', 'shell', 'active'],
      data: [
        { id: 1, username: 'root', role: 'admin', shell: '/bin/ash', active: 1 },
        { id: 2, username: 'alpine', role: 'operator', shell: '/bin/sh', active: 1 },
        { id: 3, username: 'helix', role: 'developer', shell: '/bin/bash', active: 1 },
      ],
    },
    services: {
      name: 'services',
      rowCount: 4,
      columns: ['id', 'service_name', 'runlevel', 'status', 'pid'],
      data: [
        { id: 1, service_name: 'sshd', runlevel: 'default', status: 'running', pid: 482 },
        { id: 2, service_name: 'crond', runlevel: 'default', status: 'running', pid: 512 },
        { id: 3, service_name: 'nginx', runlevel: 'default', status: 'running', pid: 619 },
        { id: 4, service_name: 'iptables', runlevel: 'boot', status: 'active', pid: 102 },
      ],
    },
    cron_jobs: {
      name: 'cron_jobs',
      rowCount: 3,
      columns: ['id', 'schedule', 'command', 'user', 'enabled'],
      data: [
        { id: 1, schedule: '0 * * * *', command: '/usr/bin/sync-storage.sh', user: 'root', enabled: 1 },
        { id: 2, schedule: '*/15 * * * *', command: '/usr/sbin/logrotate /etc/logrotate.conf', user: 'root', enabled: 1 },
        { id: 3, schedule: '0 2 * * *', command: '/usr/bin/apk-autoupdate.sh', user: 'root', enabled: 0 },
      ],
    },
    sys_metrics: {
      name: 'sys_metrics',
      rowCount: 3,
      columns: ['id', 'metric_name', 'metric_value', 'unit', 'timestamp'],
      data: [
        { id: 1, metric_name: 'cpu_usage_pct', metric_value: 12.4, unit: '%', timestamp: '2026-09-18 10:00:00' },
        { id: 2, metric_name: 'mem_used_mb', metric_value: 384, unit: 'MB', timestamp: '2026-09-18 10:00:00' },
        { id: 3, metric_name: 'disk_free_gb', metric_value: 48.2, unit: 'GB', timestamp: '2026-09-18 10:00:00' },
      ],
    },
  });

  const [activeTable, setActiveTable] = useState('users');
  const [query, setQuery] = useState('SELECT * FROM users WHERE active = 1;');
  const [outputColumns, setOutputColumns] = useState<string[]>(['id', 'username', 'role', 'shell', 'active']);
  const [output, setOutput] = useState<any[]>(tables.users.data);
  const [statusMsg, setStatusMsg] = useState('Query executed successfully (3 rows returned in 0.4ms)');
  const [showSidebar, setShowSidebar] = useState(true);

  const handleSelectTable = (tblName: string) => {
    setActiveTable(tblName);
    const tbl = tables[tblName];
    if (tbl) {
      setQuery(`SELECT * FROM ${tblName};`);
      setOutputColumns(tbl.columns);
      setOutput(tbl.data);
      setStatusMsg(`Loaded table '${tblName}' (${tbl.data.length} rows)`);
    }
  };

  const handleRunQuery = () => {
    setStatusMsg('Executing SQL statement against SQLite in-memory VFS...');
    setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (q.startsWith('select')) {
        let matched = 'users';
        for (const k of Object.keys(tables)) {
          if (q.includes(k)) {
            matched = k;
            break;
          }
        }
        const tbl = tables[matched] || tables.users;
        setOutputColumns(tbl.columns);
        setOutput(tbl.data);
        setStatusMsg(`Query executed successfully (${tbl.data.length} rows returned in 0.3ms)`);
      } else if (q.startsWith('insert')) {
        const tbl = tables[activeTable];
        if (tbl) {
          const newRow = { ...tbl.data[0], id: tbl.data.length + 1 };
          tbl.data.push(newRow);
          tbl.rowCount = tbl.data.length;
          setTables({ ...tables });
          setOutput(tbl.data);
          setStatusMsg('INSERT 0 1 (1 row affected in 0.8ms)');
        }
      } else {
        setStatusMsg('Statement executed successfully.');
      }
    }, 200);
  };

  return (
    <div className="h-full flex flex-col bg-[#12141c] text-[#edf1f7] text-xs select-none overflow-hidden">
      {/* Toolbar */}
      <div className="px-3 py-2 bg-[#181b26] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showSidebar ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
            }`}
            title={showSidebar ? 'Collapse Tables Sidebar' : 'Expand Tables Sidebar'}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Database className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-white">SQLite 3 Database Manager</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">/var/lib/sqlite/helix.db</span>
        </div>
        <button
          onClick={handleRunQuery}
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Execute SQL (F5)</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Schema / Tables Sidebar */}
        {showSidebar && (
          <div className="w-56 bg-[#0f111a] border-r border-white/10 flex flex-col p-2 space-y-2 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-gray-400">Database Tables</span>
              <span className="text-[10px] text-purple-400 font-mono">{Object.keys(tables).length} tables</span>
            </div>
            <div className="space-y-1">
              {Object.values(tables).map((tbl) => {
                const isSelected = activeTable === tbl.name;
                return (
                  <button
                    key={tbl.name}
                    onClick={() => handleSelectTable(tbl.name)}
                    className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-500/40 text-white font-medium'
                        : 'bg-white/5 border-transparent hover:border-white/10 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Table className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`} />
                      <span className="font-mono text-xs">{tbl.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 px-1.5 py-0.5 rounded bg-black/40">
                      {tbl.rowCount}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10 mt-auto px-2 space-y-1 text-[10px] text-gray-400 font-mono">
              <div>Engine: SQLite 3.45.0</div>
              <div>Journal Mode: WAL</div>
              <div>Page Size: 4096 bytes</div>
            </div>
          </div>
        )}

        {/* Main SQL Editor + Results Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Table Switcher when sidebar collapsed */}
          {!showSidebar && (
            <div className="flex items-center gap-1.5 px-4 pt-2 overflow-x-auto shrink-0">
              {Object.values(tables).map((tbl) => (
                <button
                  key={tbl.name}
                  onClick={() => handleSelectTable(tbl.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                    activeTable === tbl.name
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3 h-3" />
                  <span>{tbl.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* SQL Editor */}
          <div className="p-3 bg-black/30 border-b border-white/10 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>SQL Query Editor</span>
              <button
                onClick={() => setQuery('SELECT * FROM users WHERE active = 1;')}
                className="hover:text-purple-300 transition cursor-pointer"
              >
                Reset Example
              </button>
            </div>
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 font-mono text-xs text-[#6ee7b7] focus:outline-none focus:border-purple-400 leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {statusMsg}
              </span>
              <span>Active Target: <strong className="text-white">{activeTable}</strong></span>
            </div>
          </div>

          {/* Results Table */}
          <div className="flex-1 overflow-auto p-3">
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-[#181b28] text-gray-400 border-b border-white/10 sticky top-0">
                  <tr>
                    {outputColumns.map((col) => (
                      <th key={col} className="p-2.5 font-bold uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {output.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/10 transition">
                      {outputColumns.map((col) => (
                        <td key={col} className="p-2.5 text-gray-200">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
