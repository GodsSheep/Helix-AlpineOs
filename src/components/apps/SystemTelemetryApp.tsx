import { useSystemMetrics } from '../../hooks/useSystemMetrics';

export const SystemTelemetryApp = () => {
  const { uptime, load } = useSystemMetrics(500); // 500ms polling

  return (
    <div className="p-4 bg-black text-green-500 font-mono text-xs">
      <div className="text-gray-400"># Container Kernel Telemetry</div>
      <div className="mt-2">Uptime: {uptime}</div>
      <div>LoadAvg: {load}</div>
    </div>
  );
};
