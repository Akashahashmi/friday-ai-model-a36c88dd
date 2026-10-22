import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { Preferences } from "@/lib/friday/types";

export function SettingsDialog({ open, onOpenChange, prefs, setPrefs, ttsSupported }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  ttsSupported: boolean;
}) {
  const set = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setPrefs({ ...prefs, [k]: v });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border">
        <DialogHeader>
          <DialogTitle className="font-display tracking-widest text-primary">SETTINGS</DialogTitle>
          <DialogDescription>Saved in this browser.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="anim">Animations</Label>
            <Switch id="anim" checked={prefs.animations} onCheckedChange={(v) => set("animations", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sounds">Interface sounds</Label>
            <Switch id="sounds" checked={prefs.uiSounds} onCheckedChange={(v) => set("uiSounds", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="voice">
              Read replies aloud
              {!ttsSupported && <span className="ml-2 text-xs text-muted-foreground">(unsupported here)</span>}
            </Label>
            <Switch id="voice" disabled={!ttsSupported} checked={prefs.voiceReplies && ttsSupported} onCheckedChange={(v) => set("voiceReplies", v)} />
          </div>
          <div className="space-y-2">
            <Label>Speech rate: {prefs.speechRate.toFixed(1)}×</Label>
            <Slider min={0.6} max={1.6} step={0.1} value={[prefs.speechRate]} onValueChange={([v]) => set("speechRate", v)} disabled={!ttsSupported} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
