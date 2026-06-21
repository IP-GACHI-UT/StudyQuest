"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const navigationItems = [
  "Home",
  "Quests",
  "MyQuest",
  "Board",
  "Profile",
];

export const NavigationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* PC用ナビゲーション */}
      <nav className="hidden lg:block">
        <ul className="flex items-center gap-8">
          {navigationItems.map((item) => (
            <li key={item}>
              <button>{item}</button>
            </li>
          ))}
        </ul>
      </nav>

      {/* モバイル用ボタン */}
      <button
        className="lg:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 展開メニュー */}
      {isOpen && (
        <div className="absolute left-0 top-full w-full border-b bg-gray-800 shadow-md lg:hidden">
          <ul className="flex flex-col">
            {navigationItems.map((item) => (
              <li key={item}>
                <button className="w-full px-6 py-4 text-left text-white hover:bg-gray-500">
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};