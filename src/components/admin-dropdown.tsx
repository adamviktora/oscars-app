'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';

interface DropdownItem {
  href: string;
  label: string;
  icon: string;
}

interface Props {
  label: string;
  items: DropdownItem[];
}

export function AdminDropdown({ label, items }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        detailsRef.current &&
        !detailsRef.current.contains(event.target as Node)
      ) {
        detailsRef.current.open = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  return (
    <details ref={detailsRef} className="dropdown">
      <summary className="btn btn-ghost btn-sm">
        {label} <span className="ml-2 text-xs align-middle">▼</span>
      </summary>
      <ul className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} onClick={handleLinkClick}>
              {item.icon} {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
