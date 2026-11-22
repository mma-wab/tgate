import { cn } from '../../lib/cn';
import { ChevronDownIcon } from './SketchIcons';

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
    <div className={cn('divide-y divide-dashed divide-line', className)}>
      {items.map((item, index) => (
        <details key={item.id} className="group" open={defaultOpenFirst && index === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start text-[14px] font-semibold text-ink transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">{item.question}</span>
            <span className="sketch-sm flex size-7 shrink-0 items-center justify-center text-muted transition-all duration-200 group-open:rotate-180 group-open:border-brand/40 group-open:text-brand">
              <ChevronDownIcon className="size-4" />
            </span>
          </summary>
          <div className="pb-4 pe-9 text-[13px] leading-6 text-muted">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
