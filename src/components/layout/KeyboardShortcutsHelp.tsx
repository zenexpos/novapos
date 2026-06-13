'use client';

import React, { useState, useEffect } from 'react';
import { getShortcutRegistry } from '@/hooks/useKeyboardShortcuts';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard, Command } from 'lucide-react';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<any>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        setShortcuts(getShortcutRegistry());
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sections = Object.entries(shortcuts).filter(([_, list]: any) => list.length > 0);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
            setShortcuts(getShortcutRegistry());
            setIsOpen(true);
        }}
        className="fixed bottom-20 right-6 z-50 h-12 w-12 rounded-full shadow-2xl border-primary/20 bg-background/80 backdrop-blur-md md:bottom-6 hover:scale-110 transition-all"
      >
        <Keyboard className="h-6 w-6 text-primary" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
          <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
                <Keyboard className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight">Raccourcis Clavier iPOS</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase text-primary/50">Efficacité Elite active</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
            <div className="grid gap-8">
              {sections.length > 0 ? sections.map(([id, list]: any) => (
                <div key={id} className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 border-b border-white/5 pb-2">
                    {id.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {list.map((s: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                        <span className="text-xs font-semibold text-muted-foreground">{s.description}</span>
                        <div className="flex gap-1">
                          {s.ctrl && <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-muted font-mono text-[10px]"><Command className="h-2.5 w-2.5" /></kbd>}
                          {s.alt && <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-muted font-mono text-[10px]">Alt</kbd>}
                          <kbd className="px-2 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary font-mono text-[10px] font-bold">{s.key}</kbd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center opacity-20">
                  <Keyboard className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-sm font-bold uppercase">Aucun raccourci chargé</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
