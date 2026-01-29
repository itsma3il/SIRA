/**
 * Skip to Main Content Component
 * Provides keyboard navigation shortcut for accessibility
 * WCAG 2.1 Level A requirement
 */

"use client";

export function SkipToMain() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="skip-to-main"
    >
      Skip to main content
    </a>
  );
}
