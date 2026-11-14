import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, QrCode, Smartphone, Wifi, X } from 'lucide-react';
import type { MarsSite } from '../types/mars';

interface QrShareModalProps {
  activeSite: MarsSite;
  onClose: () => void;
}

type QrTargetMode = 'mission' | 'rover' | 'telemetry';

export function QrShareModal({ activeSite, onClose }: QrShareModalProps) {
  const [targetMode, setTargetMode] = useState<QrTargetMode>('mission');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== 'undefined' ? "https://study180000-tech.github.io/areswalk" : 'http://localhost:3000';

  const targetUrl =
    targetMode === 'mission'
      ? `${origin}/?site=${activeSite.id}&view=panorama`
      : targetMode === 'rover'
        ? `${origin}/?site=${activeSite.id}&mode=rover`
        : `${origin}/api/telemetry`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(targetUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#090D14',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [targetUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked in restricted browser contexts
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="w-full max-w-lg border border-white/15 bg-[#090C12] rounded-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <h2 id="qr-modal-title" className="font-display text-base font-bold text-slate-50">
                Mission QR &amp; Mobile Sync
              </h2>
              <p className="text-xs text-slate-400">
                Scan on phone, tablet, or helmet companion display
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR dialog"
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Segmented QR Target Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#04060A] border border-white/10 rounded">
            <button
              type="button"
              onClick={() => setTargetMode('mission')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-xs transition-colors whitespace-nowrap ${
                targetMode === 'mission'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Site + 360°</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetMode('rover')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-xs transition-colors whitespace-nowrap ${
                targetMode === 'rover'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Live Rover</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetMode('telemetry')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-xs transition-colors whitespace-nowrap ${
                targetMode === 'telemetry'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>ESP32 API</span>
            </button>
          </div>

          {/* Crisp QR Code Card */}
          <div className="flex flex-col sm:flex-row items-center gap-5 border border-white/10 bg-[#04060A] p-4 rounded">
            <div className="bg-white p-2.5 rounded shrink-0">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${targetUrl}`}
                  className="w-40 h-40 block"
                />
              ) : (
                <div className="w-40 h-40 bg-slate-200 rounded-xs" />
              )}
            </div>
            <div className="space-y-2.5 min-w-0 flex-1 text-center sm:text-left">
              <div className="text-xs font-semibold text-slate-100">
                {targetMode === 'mission'
                  ? `360° Surface + Dossier: ${activeSite.name}`
                  : targetMode === 'rover'
                    ? `Live Telemetry Link: ${activeSite.name}`
                    : 'ESP32 / Arduino Telemetry Endpoint'}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {targetMode === 'mission'
                  ? 'Opens this exact Martian territory straight into its 3D 360° surface panorama and NASA mission dossier.'
                  : targetMode === 'rover'
                    ? 'Launches directly into real-time WebSocket rover tracking and anomaly alerts for field testing.'
                    : 'Point your hardware configuration portal or companion device to this live JSON ingestion endpoint.'}
              </p>
              <div className="font-mono-tabular text-[11px] text-amber-300 break-all bg-[#090C12] border border-white/10 px-2.5 py-1.5 rounded">
                {targetUrl}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-slate-100 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Link Copied' : 'Copy Target URL'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}