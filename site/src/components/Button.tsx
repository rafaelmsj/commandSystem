import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'instagram' | 'whatsapp';
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

export default function Button({
  children,
  onClick,
  href,
  variant = 'primary',
  fullWidth = false,
  type = 'button'
}: ButtonProps) {
  const baseClasses = "py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95";

  const variantClasses = {
    primary: "bg-green-600 hover:bg-green-700 text-white",
    secondary: "bg-gray-800 hover:bg-gray-900 text-white",
    instagram: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white",
    whatsapp: "bg-green-500 hover:bg-green-600 text-white"
  };

  const widthClass = fullWidth ? "w-full" : "";
  const classes = `${baseClasses} ${variantClasses[variant]} ${widthClass}`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  );
}
