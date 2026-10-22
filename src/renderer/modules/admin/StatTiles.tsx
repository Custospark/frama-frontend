import { BedDouble, Coins, Flame, Tag, UtensilsCrossed, Wine } from 'lucide-react';
import { DashboardStatCard } from '../../shared/components/cards/DashboardStatCard';
import type { CardColor } from '../../shared/components/cards/statCardStyles';
import { formatCurrency } from '../../shared/utils/formatCurrency';

interface StatTilesProps {
  total: number;
  rooms: number;
  bar: number;
  food: number;
  sauna: number;
  other: number;
}

/** Total collected plus the five revenue streams the client tracks. */
export function StatTiles({ total, rooms, bar, food, sauna, other }: StatTilesProps) {
  const tiles: { label: string; value: string; icon: typeof Tag; color: CardColor; badge: string }[] = [
    { label: 'Total Collected', value: formatCurrency(total), icon: Coins, color: 'blue', badge: 'Total' },
    { label: 'Rooms', value: formatCurrency(rooms), icon: BedDouble, color: 'indigo', badge: 'Rooms' },
    { label: 'Bar', value: formatCurrency(bar), icon: Wine, color: 'amber', badge: 'Bar' },
    { label: 'Food', value: formatCurrency(food), icon: UtensilsCrossed, color: 'green', badge: 'Food' },
    { label: 'Sauna', value: formatCurrency(sauna), icon: Flame, color: 'purple', badge: 'Sauna' },
    { label: 'Other / Conference', value: formatCurrency(other), icon: Tag, color: 'blue', badge: 'Other' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {tiles.map(({ label, value, icon: Icon, color, badge }) => (
        <DashboardStatCard key={label} label={label} value={value} icon={Icon} color={color} badge={badge} />
      ))}
    </div>
  );
}
