"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { createPortal } from "react-dom";
import { IconWrapper } from "@/components/icon";

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm lg:hidden"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />
          <m.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-zinc-950 p-6 sm:p-8 flex flex-col items-center justify-center lg:hidden overflow-auto"
            style={{ zIndex: 9999 }}
          >
            <IconWrapper
              icon={X}
              size={28}
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white p-2 hover:text-amber-400 transition-colors"
              aria-label="Close menu"
            />
            <nav className="flex flex-col gap-4 sm:gap-6 w-full max-w-sm">
              {["Subastas", "Vender", "Artistas", "Nosotros"].map((item) => (
                <Link 
                  key={item} 
                  href="#" 
                  className="text-xl sm:text-2xl font-bold text-zinc-300 hover:text-white transition-colors py-2 sm:py-3 text-center w-full"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <Link 
                href="/dashboard" 
                className="text-xl sm:text-2xl font-bold text-amber-400 hover:text-amber-300 transition-colors pt-6 sm:pt-9 pb-2 sm:pb-3 border-t border-white/10 text-center w-full"
                onClick={() => setIsOpen(false)}
              >
                Mi Cuenta
              </Link>
            </nav>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <IconWrapper 
        icon={isOpen ? X : Menu}
        size={28}
        className="lg:hidden text-white p-2 relative"
        style={{ zIndex: 10000 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      />

      {mounted && createPortal(menuContent, document.body)}
    </>
  );
};
