import styles from './GovernmentInitiatives.module.css';
import { useTranslation } from 'react-i18next';

// Keep URLs stable in code; translate names via i18n using these IDs
const initiativeItems = [
  { id: 'rti_2005', url: 'https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=4f332a83-5251-4b3c-b947-e0ed02e6f4a8' },
  { id: 'citizen_charter', url: 'https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=1bd884c2-8612-47e8-8aa1-fe3aac774fa5' },
  { id: 'maha_rts_2015', url: 'https://krishi.maharashtra.gov.in/Site/Upload/Pdf/New%20RTS%20File-2.pdf' },
  { id: 'maha_weather_imd', url: 'https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=e6e8e25c-6c5b-4755-9319-3bfe0e6bf5f6' },
  { id: 'soil_health_card', url: 'https://soilhealth.dac.gov.in/home' },
  { id: 'pmfme', url: 'https://pmfme.mofpi.gov.in/' },
  { id: 'pmfby', url: 'https://pmfby.gov.in/' },
  { id: 'restructured_wbci', url: 'https://krishi.maharashtra.gov.in/Site/Upload/Pdf/restructured%20weather%20based%20fruit%20crop%20insurence%20scheme%20GR_2024.pdf' },
  { id: 'krishak_app', url: 'https://play.google.com/store/apps/details?id=com.rtc.krushik&hl=en_IN&gl=US' },
  { id: 'pocra', url: 'https://mahapocra.gov.in/' },
  { id: 'smart_project', url: 'https://www.smart-mh.org/' },
];

export default function GovernmentInitiatives() {
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
            <span className={styles.initiativeName}>{t(`govt_initiatives.names.${item.id}`)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
