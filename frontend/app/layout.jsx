// app/layout.jsx
import './globals.css';

export const metadata = {
  title: 'AI Travel Companion',
  description: 'Gen-Z styled AI travel itineraries based on your vibes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
