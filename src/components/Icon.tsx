import {
  Utensils,
  Car,
  House,
  Zap,
  Smartphone,
  BookOpen,
  Heart,
  ShoppingBag,
  Coffee,
  Gift,
  Repeat,
  Receipt,
  Grid2X2,
  BriefcaseBusiness,
  Wallet,
} from 'lucide-react';
import type { Category } from '../models/finance';
const iconMap = {
  utensils: Utensils,
  car: Car,
  home: House,
  zap: Zap,
  phone: Smartphone,
  book: BookOpen,
  heart: Heart,
  bag: ShoppingBag,
  coffee: Coffee,
  gift: Gift,
  repeat: Repeat,
  receipt: Receipt,
  grid: Grid2X2,
  briefcase: BriefcaseBusiness,
  wallet: Wallet,
};
export function CategoryIcon({ category, size = 19 }: { category?: Category; size?: number }) {
  const Icon = category ? iconMap[category.icon] : Repeat;
  return (
    <span
      className="category-icon"
      style={{
        color: category?.color ?? '#8aafa0',
        backgroundColor: `${category?.color ?? '#8aafa0'}16`,
      }}
    >
      <Icon size={size} aria-hidden="true" />
    </span>
  );
}
export function NamedIcon({ name }: { name: Category['icon'] }) {
  const Icon = iconMap[name];
  return <Icon size={18} aria-hidden="true" />;
}
