import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";

type LegendCardProps = {
  title: string;
  items: Array<{
    label: string;
    description: string;
    color: string;
  }>;
};

export function LegendCard({ title, items }: LegendCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
          {title}
        </h3>
        <Badge>Legend</Badge>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex gap-3">
            <span
              className="mt-1.5 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-sm leading-6 text-slate-400">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
