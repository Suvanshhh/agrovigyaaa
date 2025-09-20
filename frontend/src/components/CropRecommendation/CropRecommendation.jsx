import React, { useState } from "react";
import styles from "./CropRecommendation.module.css";
import { useTranslation } from "react-i18next";
import { getAuth } from "firebase/auth";

const CropRecommendation = () => {
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState({
    pH: "",
    state: "Maharashtra",
    district: "",
    season: "Kharif",
    irrigation: "Regular",
    soil_type: "",
    previous_crop: "",
    rainfall_band: "Normal",
    goal: "",
    // Advanced
    Nitrogen: "",
    Phosphorus: "",
    Potassium: "",
    Temperature: "",
    Humidity: "",
    Rainfall: "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [result, setResult] = useState("");
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setResult("");

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setResult("Please log in to use this feature.");
        setIsLoading(false);
        return;
      }
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/crop-recommendation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "X-Lang": i18n.language || "en",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.error) {
        setResult(t("crop_recom.resultError", { error: data.error }));
        setDetails(null);
      } else {
        setResult(t("crop_recom.resultSuccess", { crop: data.crop }));
        setDetails(data);
      }
    } catch (error) {
      console.error("Error:", error);
      setResult(t("crop_recom.resultFail"));
      setDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Basic fields */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t("crop_recom.form.pH")}:</label>
          <input
            type="number"
            name="pH"
            className={styles.input}
            value={formData.pH}
            onChange={handleChange}
            placeholder={t("formPlaceholders.pH")}
          />
        </div>
        {/* Context fields (basic) */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t("crop_recom.form.state")}:</label>
          <select name="state" className={styles.input} value={formData.state} onChange={handleChange}>
            <option value="Maharashtra">Maharashtra</option>
            <option value="">{t("crop_recom.form.otherState")}</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t("crop_recom.form.district")}:</label>
          <input name="district" className={styles.input} value={formData.district} onChange={handleChange} placeholder={t("crop_recom.form.districtPlaceholder")} />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t("crop_recom.form.season")}:</label>
          <select name="season" className={styles.input} value={formData.season} onChange={handleChange}>
            <option value="Kharif">Kharif</option>
            <option value="Rabi">Rabi</option>
            <option value="Zaid">Zaid</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t("crop_recom.form.irrigation")}:</label>
          <select name="irrigation" className={styles.input} value={formData.irrigation} onChange={handleChange}>
            <option value="None">{t("crop_recom.form.irrigationNone")}</option>
            <option value="Occasional">{t("crop_recom.form.irrigationOccasional")}</option>
            <option value="Regular">{t("crop_recom.form.irrigationRegular")}</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t("crop_recom.form.soil_type")}:</label>
          <select name="soil_type" className={styles.input} value={formData.soil_type} onChange={handleChange}>
            <option value="">{t("crop_recom.form.selectSoil")}</option>
            <option value="Sandy">Sandy</option>
            <option value="Loam">Loam</option>
            <option value="Clay">Clay</option>
            <option value="Black (Regur)">Black (Regur)</option>
            <option value="Laterite">Laterite</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t("crop_recom.form.previous_crop")}:</label>
          <input name="previous_crop" className={styles.input} value={formData.previous_crop} onChange={handleChange} placeholder={t("crop_recom.form.previousCropPlaceholder")} />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t("crop_recom.form.rainfall_band")}:</label>
          <select name="rainfall_band" className={styles.input} value={formData.rainfall_band} onChange={handleChange}>
            <option value="Low">{t("crop_recom.form.rainLow")}</option>
            <option value="Normal">{t("crop_recom.form.rainNormal")}</option>
            <option value="High">{t("crop_recom.form.rainHigh")}</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t("crop_recom.form.goal")}:</label>
          <select name="goal" className={styles.input} value={formData.goal} onChange={handleChange}>
            <option value="">{t("crop_recom.form.selectGoal")}</option>
            <option value="Cereal">Cereal</option>
            <option value="Pulse">Pulse</option>
            <option value="Oilseed">Oilseed</option>
            <option value="Cash">Cash</option>
            <option value="Horticulture">Horticulture</option>
            <option value="Fodder">Fodder</option>
          </select>
        </div>

        {/* Toggle for Advanced */}
        <div className={styles.inputGroup} style={{gridColumn: '1 / -1'}}>
          <button type="button" className={styles.secondaryButton} onClick={() => setShowAdvanced((s) => !s)}>
            {showAdvanced ? t("crop_recom.hideAdvanced") : t("crop_recom.showAdvanced")}
          </button>
        </div>

        {/* Advanced fields (optional) */}
        {showAdvanced && (
          <>
            {[
              "Nitrogen","Phosphorus","Potassium","Temperature","Humidity","Rainfall"
            ].map((key) => (
              <div className={styles.inputGroup} key={key}>
                <label className={styles.label}>
                  {t(`crop_recom.form.${key}`)}:
                </label>
                <input
                  type="number"
                  name={key}
                  className={styles.input}
                  value={formData[key]}
                  onChange={handleChange}
                  placeholder={t(`formPlaceholders.${key}`)}
                />
              </div>
            ))}
          </>
        )}

        <button className={styles.button} type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className={styles.spinner} /> {t("crop_recom.predicting")}
            </>
          ) : (
            t("crop_recom.predictButton")
          )}
        </button>
      </form>
      {result && <h2 className={styles.result}>{result}</h2>}
      {details && (
        <div className={styles.details}>
          {details.category && (
            <p><strong>{t("crop_recom.category")}:</strong> {details.category}</p>
          )}
          {typeof details.suitability_score === "number" && !Number.isNaN(details.suitability_score) && (
            <p><strong>{t("crop_recom.suitability")}:</strong> {Math.round(details.suitability_score)}/100</p>
          )}
          {typeof details.confidence === "number" && (
            <p><strong>{t("crop_recom.confidence")}:</strong> {(details.confidence*100).toFixed(0)}%</p>
          )}
          {details.rationale && (
            <p><strong>{t("crop_recom.why")}:</strong> {details.rationale}</p>
          )}
          {Array.isArray(details.top_alternatives) && details.top_alternatives.length > 0 && (
            <div>
              <p><strong>{t("crop_recom.alternatives")}:</strong></p>
              <ul>
                {details.top_alternatives.map((alt, idx) => (
                  <li key={idx}><strong>{alt.crop}:</strong> {alt.reason}</li>
                ))}
              </ul>
            </div>
          )}
          {details.fertilizer_advice && (
            <p><strong>{t("crop_recom.fertilizerAdvice")}:</strong> {details.fertilizer_advice}</p>
          )}
          {Array.isArray(details.warnings) && details.warnings.length > 0 && (
            <div>
              <p><strong>{t("crop_recom.warnings")}:</strong></p>
              <ul>
                {details.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CropRecommendation;
