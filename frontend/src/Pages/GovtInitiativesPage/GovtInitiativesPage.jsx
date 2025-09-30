import styles from './GovtInitiativesPage.module.css';
import { useTranslation } from 'react-i18next';
import {
  Landmark,
  FileText,
  ShieldCheck,
  CloudSun,
  Sprout,
  Factory,
  HeartHandshake,
  Apple,
  Smartphone,
  Tractor,
  Warehouse
} from 'lucide-react';

// Keep URLs stable in code; translate names via i18n using these IDs
const initiativeItems = [
  { id: 'rti_2005', url: 'https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=4f332a83-5251-4b3c-b947-e0ed02e6f4a8', icon: <FileText size={48} /> },
  { id: 'citizen_charter', url: 'https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=1bd884c2-8612-47e8-8aa1-fe3aac774fa5', icon: <Landmark size={48} /> },
  { id: 'maha_rts_2015', url: 'https://krishi.maharashtra.gov.in/Site/Upload/Pdf/New%20RTS%20File-2.pdf', icon: <ShieldCheck size={48} /> },
  { id: 'maha_weather_imd', url: 'https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=e6e8e25c-6c5b-4755-9319-3bfe0e6bf5f6', icon: <CloudSun size={48} /> },
  { id: 'soil_health_card', url: 'https://soilhealth.dac.gov.in/home', icon: <Sprout size={48} /> },
  { id: 'pmfme', url: 'https://pmfme.mofpi.gov.in/', icon: <Factory size={48} /> },
  { id: 'pmfby', url: 'https://pmfby.gov.in/', icon: <HeartHandshake size={48} /> },
  { id: 'restructured_wbci', url: 'https://krishi.maharashtra.gov.in/Site/Upload/Pdf/restructured%20weather%20based%20fruit%20crop%20insurence%20scheme%20GR_2024.pdf', icon: <Apple size={48} /> },
  { id: 'krishak_app', url: 'https://play.google.com/store/apps/details?id=com.rtc.krushik&hl=en_IN&gl=US', icon: <Smartphone size={48} /> },
  { id: 'pocra', url: 'https://mahapocra.gov.in/', icon: <Tractor size={48} /> },
  { id: 'smart_project', url: 'https://www.smart-mh.org/', icon: <Warehouse size={48} /> },
];

export default function GovtInitiativesPage() {
  const { t } = useTranslation();

  return (
    <section className={styles.initiativesSection}>
      <h2 className={styles.heading}>{t('govt_initiatives.title')}</h2>
      <div className={styles.cardGrid}>
        {initiativeItems.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.initiativeCard}
            tabIndex={0}
            aria-label={t(`govt_initiatives.names.${item.id}`)}
          >
            <div className={styles.iconWrapper}>{item.icon}</div>
            <span className={styles.initiativeName}>{t(`govt_initiatives.names.${item.id}`)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
