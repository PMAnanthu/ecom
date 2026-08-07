'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Store { id: string; name: string }

interface StoreSelectorProps {
  readonly stores: Store[];
  readonly selectedId: string;
  readonly onChange: (id: string) => void;
  readonly configuredIds: Set<string>;
}

export function StoreSelector({ stores, selectedId, onChange, configuredIds }: StoreSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Select Store</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedId} onValueChange={v => onChange(v as string)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a store…" />
          </SelectTrigger>
          <SelectContent>
            {stores.map(s => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-2">
                  {s.name}
                  {configuredIds.has(s.id) && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">configured</Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
