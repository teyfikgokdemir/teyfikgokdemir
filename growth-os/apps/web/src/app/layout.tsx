import './styles.css';
import './modules.css';
import './modules-v2.css';
import './report.css';
import NavigationPersistence from './components/NavigationPersistence';
import OverviewIntelligenceMount from './components/OverviewIntelligenceMount';

export const metadata = {
  title: 'Growth OS',
  description: 'Private growth intelligence and execution platform',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><NavigationPersistence/><OverviewIntelligenceMount/>{children}</body></html>;
}
