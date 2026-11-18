import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export function Accordion({
  items,
  defaultOpenFirst = false,
  className,
}: {
  items: AccordionItem[];
  defaultOpenFirst?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface', className)}>
      {items.map((item, index) => (
        <details key={item.id} className="group" open={defaultOpenFirst && index === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-start text-[15px] font-medium text-ink transition hover:bg-surface-2/60 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">{item.question}</span>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-muted transition group-open:rotate-180 group-open:border-brand/30 group-open:text-brand">
              <ChevronDown className="size-4" aria-hidden="true" />
            </span>
          </summary>
          <div className="px-5 pb-5 pt-0 text-sm leading-7 text-muted">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
