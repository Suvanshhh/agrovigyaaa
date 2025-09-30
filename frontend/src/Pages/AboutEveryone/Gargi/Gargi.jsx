import Navbar from '../../../components/Navbar/navbar';
import Footer from '../../../components/Footer/footer';
import styles from './Gargi.module.css';

const Gargi = () => {
  return (
    <>
       <Navbar />
      <div className={styles.profileBg}>
        <div className={styles.profileContainer}>
          <h1 className={styles.profileTitle}>Gargi Senad</h1>
          <div className={styles.profileCard}>
            <div className={styles.profileImageWrapper}>
              <img
                src="https://i.postimg.cc/L4QZ9nTk/gargi.jpg"
                alt="Gargi Senad"
                className={styles.profileImage}
              />
              <div className={styles.profileDetails}>
                {/* <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>location</span>
                  <span className={styles.detailValue}>Pune, Maharashtra</span>
                </div> */}
                {/* <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>phone</span>
                  <span className={styles.detailValue}>-</span>
                </div> */}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>UI/UX & Graphics Designer</span>
                  {/* <span className={styles.detailValue}>a</span> */}
                </div>
              </div>
            </div>
            <div className={styles.profileDesc}>
              <p>
              I am Gargi Senad, a dedicated member of research team of Agrovigya and a student of DES’s Shri Navalmal Firodia Law College, Pune, currently pursuing a degree in BALLB. With strong analytical skills and a collaborative mindset, I excel in team environments where problem-solving and innovation are key. I am always keen to learn new skills, adapt to challenges, and contribute effectively to any task at hand. My experience as a researcher has helped me develop a deeper understanding of critical thinking, attention to detail, and data-driven decision-making. I strive to bring both creativity and precision to every project, aiming to make a meaningful impact through continuous learning and dedicated teamwork.

              </p>
              <p>
              I believe that curiosity, collaboration, and consistency are the foundation of impactful work and I bring those values into everything I do.

              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />

    </>
  );
};

export default Gargi;
