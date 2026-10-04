import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const KEY = "tile_cookie_consent_v1";
type Consent = { necessary: true; preferences: boolean; analytics: boolean; decidedAt: string };

export function getCookieConsent(): Consent | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
export function openCookieSettings() {
  window.dispatchEvent(new Event("tile:cookie-settings"));
}

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const c = getCookieConsent();
    if (!c) setOpen(true);
    const onOpen = () => {
      const cur = getCookieConsent();
      setPrefs(cur?.preferences ?? false);
      setAnalytics(cur?.analytics ?? false);
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener("tile:cookie-settings", onOpen);
    return () => window.removeEventListener("tile:cookie-settings", onOpen);
  }, []);

  const save = (p: boolean, a: boolean) => {
    localStorage.setItem(KEY, JSON.stringify({ necessary: true, preferences: p, analytics: a, decidedAt: new Date().toISOString() }));
    setOpen(false);
    setCustom(false);
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-label="Cookie consent" className="fixed inset-x-2 bottom-20 z-[60] mx-auto max-w-2xl rounded-xl border border-border bg-card p-4 text-card-foreground shadow-2xl md:bottom-4">
      <p className="font-semibold">We use cookies and similar technologies</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Tile uses necessary cookies for core functionality. With your permission, optional cookies may be used for preferences and analytics.{" "}
        <Link to="/cookies" className="text-primary underline">Cookie Policy</Link>
      </p>
      {custom && (
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center justify-between"><span>Necessary — always on</span><Switch checked disabled /></label>
          <label className="flex items-center justify-between"><span>Preferences — optional</span><Switch checked={prefs} onCheckedChange={setPrefs} /></label>
          <label className="flex items-center justify-between"><span>Analytics — optional</span><Switch checked={analytics} onCheckedChange={setAnalytics} /></label>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => save(true, true)}>Accept all</Button>
        <Button size="sm" variant="outline" onClick={() => save(false, false)}>Reject optional</Button>
        {custom ? (
          <Button size="sm" variant="secondary" onClick={() => save(prefs, analytics)}>Save choices</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setCustom(true)}>Customize</Button>
        )}
      </div>
    </div>
  );
}
