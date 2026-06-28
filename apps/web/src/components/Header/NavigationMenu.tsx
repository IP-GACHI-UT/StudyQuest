'use client';

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { navigationItems } from "@/constants/navigation";

export const NavigationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* PC */}
      <nav className="hidden lg:block">
        <ul className="flex items-center gap-8">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="font-medium text-gray-600 hover:text-gray-900"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* モバイル */}
      <div className="lg:hidden">
        <button onClick={() => setIsOpen((prev) => !prev)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full w-full border-b bg-gray-800 shadow-md">
            <ul className="flex flex-col">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-6 py-4 hover:bg-gray-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};
