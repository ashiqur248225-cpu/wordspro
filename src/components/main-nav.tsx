'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/nav-items';
import './main-nav.css';

export function MainNav() {

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="main-nav-link flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
