'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons';
import {
  LayoutDashboard,
  BookText,
  BrainCircuit,
  Notebook,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/words', label: 'Words', icon: BookText },
  { href: '/learn', label: 'Exam', icon: BrainCircuit },
  { href: '/notes', label: 'Notes', icon: Notebook },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-lg font-semibold md:text-base"
      >
        <Logo className="h-6 w-6 text-primary" />
        <span className="font-bold">WordPro</span>
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'transition-colors hover:text-foreground',
            pathname.startsWith(item.href)
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
