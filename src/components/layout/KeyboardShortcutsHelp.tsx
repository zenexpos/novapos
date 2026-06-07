'use client';

import React, { useState, useContext, useEffect } from 'react';
import { KeyboardShortcutsDataContext } from '@/contexts/KeyboardShortcutsContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard, Command } from 'lucide-react';

/**
 * Fenêtre d'aide pour les raccourcis clavier.
 * Consomme uniquement le contexte de données pour une performance optimale.
 */
export function KeyboardShortcutsHelp() {
  const allShortcuts = useContext(KeyboardShortcutsDataContext);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Activation de l'aide avec '?' (lorsqu'aucun champ n'est focalisé)
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sections = Object.entries(allShortcuts).filter(([_, list]) => list.length > 0);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-50 h-12 w-12 rounded-full shadow-2xl border-primary/20 bg-background/80 backdrop-blur-md md:bottom-6 hover:scale-110 transition-all"
        title="Aide des raccourcis (?)"
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
                <DialogDescription className="text-xs font-bold uppercase text-primary/50">Guide interactif d'efficacité Elite</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
            <div className="grid gap-8">
              {sections.length > 0 ? sections.map(([id, list]) => (
                <div key={id} className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 border-b border-white/5 pb-2">
                    {id.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {list.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 group hover:border-primary/20 transition-all">
                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{s.description}</span>
                        <div className="flex gap-1">
                          {s.ctrl && <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-muted font-mono text-[10px] shadow-sm"><Command className="h-2.5 w-2.5" /></kbd>}
                          {s.alt && <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-muted font-mono text-[10px] shadow-sm">Alt</kbd>}
                          {s.shift && <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-muted font-mono text-[10px] shadow-sm">⇧</kbd>}
                          <kbd className="px-2 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary font-mono text-[10px] font-bold shadow-sm">{s.key}</kbd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center opacity-20">
                  <Keyboard className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-sm font-bold uppercase">Aucun raccourci contextuel</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-muted/5 border-t border-white/5 text-center">
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Appuyez sur <span className="text-primary">ESC</span> pour fermer</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
