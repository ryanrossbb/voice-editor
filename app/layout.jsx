import './globals.css';

export const metadata = {
  title: 'MedTech Financial Marketing Dashboard',
  description: 'Editorial workspace for the MedTech Financial content team.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
