import { Building2, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TeiaContact } from "@/types";

const NO_FIELD_COLUMN = "Sem ramo definido";

export function ContactKanban({
  contacts,
  onRequest,
  requestPending,
}: {
  contacts: TeiaContact[];
  onRequest?: (contactId: string) => void;
  requestPending?: boolean;
}) {
  const columns = new Map<string, TeiaContact[]>();
  for (const contact of contacts) {
    const key = contact.field || NO_FIELD_COLUMN;
    const list = columns.get(key) ?? [];
    list.push(contact);
    columns.set(key, list);
  }
  const orderedColumns = [...columns.entries()].sort((a, b) => b[1].length - a[1].length);

  if (orderedColumns.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Nenhum contato encontrado com esses filtros.
      </Card>
    );
  }

  return (
    <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
      {orderedColumns.map(([field, items]) => (
        <div key={field} className="w-72 shrink-0">
          <div className="flex items-center justify-between px-1 pb-3">
            <p className="text-sm font-medium">{field}</p>
            <Badge variant="secondary" className="font-normal">
              {items.length}
            </Badge>
          </div>
          <div className="scrollbar-thin max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {items.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onRequest={onRequest}
                requestPending={requestPending}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactCard({
  contact: c,
  onRequest,
  requestPending,
}: {
  contact: TeiaContact;
  onRequest?: (contactId: string) => void;
  requestPending?: boolean;
}) {
  return (
    <Card className="gap-2.5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{c.name}</p>
          {c.companyName && <p className="text-xs text-muted-foreground">{c.companyName}</p>}
        </div>
        {c.unlocked && (
          <Badge className="shrink-0 bg-success/15 text-[10px] text-success hover:bg-success/15">
            Liberado
          </Badge>
        )}
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        {c.city && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" /> {c.city}
          </p>
        )}
        {c.unlocked && c.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> {c.phone}
          </p>
        )}
        {c.unlocked && c.email && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" /> {c.email}
          </p>
        )}
      </div>
      {onRequest && !c.isOwner && !c.unlocked && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          disabled={c.myRequestStatus === "pendente" || requestPending}
          onClick={() => onRequest(c.id)}
        >
          <Share2 className="mr-1.5 h-3 w-3" />
          {c.myRequestStatus === "pendente" ? "Solicitação enviada" : "Solicitar apresentação"}
        </Button>
      )}
    </Card>
  );
}

export function ContactListItem({
  contact: c,
  onRequest,
  requestPending,
}: {
  contact: TeiaContact;
  onRequest?: (contactId: string) => void;
  requestPending?: boolean;
}) {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{c.name}</p>
          {c.companyName && <p className="text-xs text-muted-foreground">{c.companyName}</p>}
        </div>
        {c.unlocked && (
          <Badge className="shrink-0 bg-success/15 text-success hover:bg-success/15">
            Contato liberado
          </Badge>
        )}
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        {c.field && (
          <p className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> {c.field}
          </p>
        )}
        {c.city && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {c.city}
          </p>
        )}
        {c.unlocked && c.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {c.phone}
          </p>
        )}
        {c.unlocked && c.email && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> {c.email}
          </p>
        )}
      </div>
      {onRequest && !c.isOwner && !c.unlocked && (
        <Button
          size="sm"
          variant="outline"
          disabled={c.myRequestStatus === "pendente" || requestPending}
          onClick={() => onRequest(c.id)}
        >
          <Share2 className="mr-1.5 h-3.5 w-3.5" />
          {c.myRequestStatus === "pendente" ? "Solicitação enviada" : "Solicitar apresentação"}
        </Button>
      )}
    </Card>
  );
}
