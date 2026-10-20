import { BedDouble, Wine, UtensilsCrossed, Flame, Wallet, CheckCircle2, Clock } from 'lucide-react';
import { DashboardStatCard } from '../../shared/components/cards/DashboardStatCard';
import type { CardColor } from '../../shared/components/cards/statCardStyles';
import { formatCurrency } from '../../shared/utils/formatCurrency';

interface StatTilesProps {
  grandTotal: number;
  rooms: number;
  bar: number;
  food: number;
  sauna: number;
  submitted: number;
  pending: number;
}

export function StatTiles({ grandTotal, rooms, bar, food, sauna, submitted, pending }: StatTilesProps) {
  const tiles: { label: string; value: string; icon: typeof Wallet; color: CardColor; badge: string }[] = [
    { label: 'Grand Total', value: formatCurrency(grandTotal), icon: Wallet, color: 'blue', badge: 'Total' },
    { label: 'Rooms', value: formatCurrency(rooms), icon: BedDouble, color: 'indigo', badge: 'Rooms' },
    { label: 'Bar', value: formatCurrency(bar), icon: Wine, color: 'amber', badge: 'Bar' },
    { label: 'Food', value: formatCurrency(food), icon: UtensilsCrossed, color: 'green', badge: 'Food' },
    { label: 'Sauna', value: formatCurrency(sauna), icon: Flame, color: 'purple', badge: 'Sauna' },
    { label: 'Submitted', value: `${submitted}`, icon: CheckCircle2, color: 'green', badge: 'Reports' },
    { label: 'Pending', value: `${pending}`, icon: Clock, color: 'amber', badge: 'Reports' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {tiles.map(({ label, value, icon: Icon, color, badge }) => (
        <DashboardStatCard key={label} label={label} value={value} icon={Icon} color={color} badge={badge} />
      ))}
    </div>
  );
}
