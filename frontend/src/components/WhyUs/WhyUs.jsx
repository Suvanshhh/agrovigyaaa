import React from "react";
import styles from "./WhyChooseUs.module.css";
import { useTranslation } from "react-i18next";

const WhyChooseUs = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.whyChooseUs}>
      <h2 className={styles.heading}>{t("whyChooseUs.whyagrovigya")}</h2>
      <div className={styles.cardContainer}>
        <div className={styles.card}>
          <img
            src="https://i.postimg.cc/FHm86dx1/picc.jpg"
            alt="Smart Farming"
            className={styles.cardImage}
          />
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{t("whyChooseUs.smartFarming")}</div>
            <div className={styles.cardDesc}>{t("whyChooseUs.smartFarmingDesc")}</div>
          </div>
        </div>
        <div className={styles.card}>
          <img
            src="https://i.pinimg.com/1200x/ef/d6/b9/efd6b9ba12e896a351c4a21c9893e382.jpg"
            alt="Financial Assistance"
            className={styles.cardImage}
          />
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{t("whyChooseUs.financialAssistance")}</div>
            <div className={styles.cardDesc}>{t("whyChooseUs.financialAssistanceDesc")}</div>
          </div>
        </div>
        <div className={styles.card}>
          <img
            src="https://i.pinimg.com/1200x/d9/b0/83/d9b0838c0ac6114b77f10401127f8c72.jpg"
            alt="Sustainable Agriculture"
            className={styles.cardImage}
          />
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{t("whyChooseUs.sustainableAgriculture")}</div>
            <div className={styles.cardDesc}>{t("whyChooseUs.sustainableAgricultureDesc")}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
