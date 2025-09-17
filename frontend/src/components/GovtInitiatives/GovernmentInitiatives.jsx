import styles from './GovernmentInitiatives.module.css';

const initiatives = [
  {
    name: "Right To Information Act 2005",
    url: "https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=4f332a83-5251-4b3c-b947-e0ed02e6f4a8",
  },
  {
    name: "Citizen Charter",
    url: "https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=1bd884c2-8612-47e8-8aa1-fe3aac774fa5",
  },
  {
    name: "Maharashtra Right To Public Service Ordinance, 2015",
    url: "https://krishi.maharashtra.gov.in/Site/Upload/Pdf/New%20RTS%20File-2.pdf",
  },
  {
    name: "Maharashtra State Weather Report (IMD)",
    url: "https://krishi.maharashtra.gov.in/Site/Common/ViewGr.aspx?Doctype=e6e8e25c-6c5b-4755-9319-3bfe0e6bf5f6",
  },
  {
    name: "Soil Health Card",
    url: "https://soilhealth.dac.gov.in/home",
  },
  {
    name: "PMFME",
    url: "https://pmfme.mofpi.gov.in/",
  },
  {
    name: "Crop Insurance Scheme",
    url: "https://pmfby.gov.in/",
  },
  {
    name: "Restructed Weather Based Crop Insurance Scheme",
    url: "https://krishi.maharashtra.gov.in/Site/Upload/Pdf/restructured%20weather%20based%20fruit%20crop%20insurence%20scheme%20GR_2024.pdf",
  },
  {
    name: "Krishak Application",
    url: "https://play.google.com/store/apps/details?id=com.rtc.krushik&hl=en_IN&gl=US",
  },
  {
    name: "The Project on Climate Resilient Agriculture",
    url: "https://mahapocra.gov.in/",
  },
  {
    name: "SMART Project",
    url: "https://www.smart-mh.org/",
  },
];

export default function GovernmentInitiatives() {
  return (
    <section className={styles.initiativesSection}>
      <h2 className={styles.heading}>Government Initiatives</h2>
      <div className={styles.cardGrid}>
        {initiatives.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.initiativeCard}
            tabIndex={0}
          >
            <span className={styles.initiativeName}>{item.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
