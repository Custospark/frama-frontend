import { BedDouble, Wine, UtensilsCrossed, Flame, Tag } from 'lucide-react';
import { DashboardStatCard } from '../../shared/components/cards/DashboardStatCard';
import type { CardColor } from '../../shared/components/cards/statCardStyles';
import { formatCurrencyCompact } from '../../shared/utils/formatCurrency';

interface StatTilesProps {
  rooms: number;
  bar: number;
  food: number;
  sauna: number;
  other: number;
}

/** The five revenue streams the client tracks across all branches. */
export function StatTiles({ rooms, bar, food, sauna, other }: StatTilesProps) {
  const tiles: { label: string; value: string; icon: typeof Tag; color: CardColor; badge: string }[] = [
    { label: 'Rooms', value: formatCurrencyCompact(rooms), icon: BedDouble, color: 'indigo', badge: 'Rooms' },
    { label: 'Bar', value: formatCurrencyCompact(bar), icon: Wine, color: 'amber', badge: 'Bar' },
    { label: 'Food', value: formatCurrencyCompact(food), icon: UtensilsCrossed, color: 'green', badge: 'Food' },
    { label: 'Sauna', value: formatCurrencyCompact(sauna), icon: Flame, color: 'purple', badge: 'Sauna' },
    { label: 'Other / Conference', value: formatCurrencyCompact(other), icon: Tag, color: 'blue', badge: 'Other' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map(({ label, value, icon: Icon, color, badge }) => (
        <DashboardStatCard key={label} label={label} value={value} icon={Icon} color={color} badge={badge} />
      ))}
    </div>
  );
}
