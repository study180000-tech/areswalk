import { useState } from 'react';
import { Check, Copy, QrCode, X } from 'lucide-react';

interface HardwareApiModalProps {
  activeSiteId: string;
  onClose: () => void;
  onOpenQr?: () => void;
}

export function HardwareApiModal({ activeSiteId, onClose, onOpenQr }: HardwareApiModalProps) {
  const [copied, setCopied] = useState(false);
  const origin =
    typeof window !== 'undefined' ? "https://study180000-tech.github.io/areswalk" : 'http://localhost:3000';

  const esp32Snippet = `// ESP32 / Arduino Wi-Fi Rover Telemetry & ESP32-CAM Integration
// 1. Send Ultrasonic + CO2 + MPU6050 Incline every 500ms:
//    POST ${origin}/api/telemetry
//    Content-Type: application/json
{
  "siteId": "${activeSiteId}",
  "distanceCm": 16.5,
  "co2Ppm": 2450,
  "pitchDeg": 24.0,
  "rollDeg": 5.2,
  "x": 45.0,
  "y": 58.0,
  "headingDeg": 32,
  "batteryPct": 91
}

// 2. When distanceCm <= 38, ESP32-CAM captures JPEG and sends:
//    POST ${origin}/api/camera-frame
//    Content-Type: image/jpeg  (or JSON { "imageBase64": "..." })`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(esp32Snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard restricted in some sandboxes
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hardware-modal-title"
    >
      <div className="w-full max-w-2xl border border-white/15 bg-[#090C12] rounded-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 id="hardware-modal-title" className="font-display text-base font-bold text-slate-50">
              Physical Rover Hardware API (ESP32 + ESP32-CAM)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect HC-SR04 Ultrasonic, MQ-135/MH-Z19 CO₂, MPU6050 IMU &amp; ESP32-CAM directly to live WebSocket server
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenQr && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQr();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-slate-200 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Endpoint QR</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close hardware dialog"
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="border border-white/10 bg-[#04060A] p-3 rounded">
              <div className="font-semibold text-emerald-400">1. Ultrasonic HC-SR04</div>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Triggers instant obstacle alert when distance &le; 38 cm and requests ESP32-CAM snapshot.
              </p>
            </div>
            <div className="border border-white/10 bg-[#04060A] p-3 rounded">
              <div className="font-semibold text-amber-400">2. MPU6050 Incline</div>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Compares live pitch/roll tilt against NASA MOLA slope baseline; alerts at &ge; 14°.
              </p>
            </div>
            <div className="border border-white/10 bg-[#04060A] p-3 rounded">
              <div className="font-semibold text-cyan-400">3. CO₂ Gas Sensor</div>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Detects sudden gas plumes (e.g. lighter test &ge; 900 ppm or 2× baseline).
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <pre className="p-4 rounded border border-white/10 bg-[#04060A] text-xs font-mono-tabular text-slate-300 overflow-x-auto leading-relaxed">
              {esp32Snippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}