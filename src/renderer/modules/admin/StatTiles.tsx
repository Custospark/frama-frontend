import { BedDouble, CalendarRange, Coins, Flame, UtensilsCrossed, Wine } from 'lucide-react';
import { DashboardStatCard } from '../../shared/components/cards/DashboardStatCard';
import type { CardColor } from '../../shared/components/cards/statCardStyles';
import { formatCurrency } from '../../shared/utils/formatCurrency';

interface StatTilesProps {
  monthTotal: number;
  total: number;
  rooms: number;
  bar: number;
  food: number;
  sauna: number;
}

/** Month-to-date total first, followed by today's collected total and streams. */
export function StatTiles({ monthTotal, total, rooms, bar, food, sauna }: StatTilesProps) {
  const tiles: { label: string; value: string; icon: typeof Coins; color: CardColor; badge: string }[] = [
    { label: 'Total This Month', value: formatCurrency(monthTotal), icon: CalendarRange, color: 'green', badge: 'Month' },
    { label: 'Total Collected Today', value: formatCurrency(total), icon: Coins, color: 'blue', badge: 'Total' },
    { label: 'Rooms Today', value: formatCurrency(rooms), icon: BedDouble, color: 'indigo', badge: 'Rooms' },
    { label: 'Bar Today', value: formatCurrency(bar), icon: Wine, color: 'amber', badge: 'Bar' },
    { label: 'Food Today', value: formatCurrency(food), icon: UtensilsCrossed, color: 'green', badge: 'Food' },
    { label: 'Sauna Today', value: formatCurrency(sauna), icon: Flame, color: 'purple', badge: 'Sauna' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {tiles.map(({ label, value, icon: Icon, color, badge }) => (
        <DashboardStatCard key={label} label={label} value={value} icon={Icon} color={color} badge={badge} />
      ))}
    </div>
  );
}
