import './globals.css';

export const metadata = {
  title: 'Voice Editor',
  description: 'Revise drafts by speaking.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
