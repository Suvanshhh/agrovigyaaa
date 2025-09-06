import React, { useState } from "react";
import CropRecommendation from "../../components/CropRecommendation/CropRecommendation";
import Navbar from "../../components/Navbar/navbar";
import Footer from "../../components/Footer/footer";
import styles from "./CropRecommendationPage.module.css";
import { useTranslation } from "react-i18next";
import FarmerGuidePopup from "../../components/FarmerGuidePopup/FarmerGuidePopup";
import confusedCharacter from "../CropRecomPage/confused-character.gif"; // Adjust the path as necessary

const CropRecommendationPage = () => {
  const { t } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>{t("crop.title")}</h1>
        <p className={styles.pageSubtitle}>{t("crop.subtitle")}</p>
        <button
          className={styles.helpButton}
          onClick={() => setShowGuide(true)}
          aria-label="How to test your soil?"
        >
          <img
            src={confusedCharacter}
            alt="Confused character"
            className={styles.animatedIcon}
          />
         {t("labour.helpButton")}
        </button>
        <FarmerGuidePopup show={showGuide} onClose={() => setShowGuide(false)} />
        <div className={styles.contentContainer}>
          <div className={styles.formSection}>
            <CropRecommendation />
          </div>
          <div className={styles.imageSection}>
            <img
              src="https://i.postimg.cc/9MgBBgNs/log-in-signup.png"
              alt={t("crop.imageAlt")}
              className={styles.sideImage}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CropRecommendationPage;
