import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useListRegistry } from '@/hooks/useListRegistry';
import { SAMPLE_KEYS, getSampleList } from '@/lib/samples';
import { getSettings } from '@/lib/storage';
import { S } from '@/lib/strings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, Plus } from 'lucide-react';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { createList } = useListRegistry();
  const [openKey, setOpenKey] = useState<string | null>(null);

  function handleCreate(key: string) {
    const sample = getSampleList(key);
    if (!sample) return;
    const s = getSettings();
    const id = createList(
      sample.name,
      s.defaultKFactor,
      s.defaultSessionLength,
      sample.items.map((i) => i.name),
    );
    toast.success(S.templates.createSuccess(sample.name));
    navigate(`/list/${id}`);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{S.templates.title}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {S.templates.subtitle}
        </p>
      </div>

      <ul className="space-y-3">
        {SAMPLE_KEYS.map((key) => {
          const sample = getSampleList(key);
          if (!sample) return null;
          const isOpen = openKey === key;
          return (
            <li key={key}>
              <Card className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold truncate">
                      {sample.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {S.templates.itemCount(sample.items.length)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCreate(key)}
                  >
                    <Plus className="h-4 w-4" />
                    {S.templates.createButton}
                  </Button>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={`tpl-items-${key}`}
                  onClick={() => setOpenKey(isOpen ? null : key)}
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                  {isOpen ? S.templates.hideItems : S.templates.showItems}
                </button>
                {isOpen && (
                  <ul
                    id={`tpl-items-${key}`}
                    className="text-xs text-muted-foreground space-y-0.5 pl-4 list-disc"
                  >
                    {sample.items.map((item) => (
                      <li key={item.id}>{item.name}</li>
                    ))}
                  </ul>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
