interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="w-full py-6 px-4 bg-gradient-to-r from-green-600 to-emerald-700 shadow-lg">
      <h1 className="text-3xl md:text-5xl font-bold text-white text-center tracking-wide">
        {title}
      </h1>
    </header>
  );
}
