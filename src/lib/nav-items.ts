'use client';
import {
  LayoutDashboard,
  BookText,
  BrainCircuit,
  Notebook,
  Activity,
} from 'lucide-react';

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/words', label: 'Words', icon: BookText },
  { href: '/learn', label: 'Exam', icon: BrainCircuit },
  { href: '/notes', label: 'Notes', icon: Notebook },
  { href: '/performance', label: 'Performance', icon: Activity },
];
