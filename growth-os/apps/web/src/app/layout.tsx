import './styles.css';
import './report.css';

export const metadata = {
  title: 'Growth OS',
  description: 'Private growth intelligence and execution platform',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
