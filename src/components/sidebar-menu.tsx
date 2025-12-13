'use client';

import Link from 'next/link';
import { useState } from 'react';

export function SidebarMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: 'Prenominační kolo',
      href: '/prenomination',
      enabled: true,
    },
    {
      label: 'Prenominační kolo 2.0',
      href: '/prenomination-2',
      enabled: false,
    },
    {
      label: 'Nominační kolo',
      href: '/nomination',
      enabled: false,
    },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-ghost btn-square text-gray-900 hover:bg-amber-300"
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-base-100 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost btn-square btn-sm text-gray-900"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <ul className="menu p-4 gap-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              {item.enabled ? (
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-base-200"
                >
                  <span className="text-amber-500">🎬</span>
                  {item.label}
                </Link>
              ) : (
                <span className="flex items-center gap-3 py-3 px-4 rounded-lg text-base-content/40 cursor-not-allowed">
                  <span className="opacity-40">🎬</span>
                  {item.label}
                  <span className="badge badge-sm badge-ghost ml-auto">Již brzy</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

