import Navbar from '../../../components/Navbar/navbar';
import Footer from '../../../components/Footer/footer';
import styles from './Koena.module.css';

const Koena = () => {
  return (
    <>
       <Navbar />
      <div className={styles.profileBg}>
        <div className={styles.profileContainer}>
          <h1 className={styles.profileTitle}>Koena Ganguly</h1>
          <div className={styles.profileCard}>
            <div className={styles.profileImageWrapper}>
              <img
                src="https://i.postimg.cc/L5WqNbXQ/koena.jpg"
                alt="Koena Ganguly"
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
                  <span className={styles.detailLabel}>Researcher</span>
                  {/* <span className={styles.detailValue}>a</span> */}
                </div>
              </div>
            </div>
            <div className={styles.profileDesc}>
              <p>
              I am Koena Ganguly, a student of D.E.S. Shri Navalmal Firodia Law College, Pune and a member of the research team at Agrovigya. My strong interest in learning and knowing about India’s indigenous culture and traditions drives me to regularly enhance my research and analytical skills. Having worked on several articles and legal drafts, I love to analyze a given issue from several viewpoints, as it helps to develop a holistic understanding of the subject, along with that, making me equipped to work in a dynamic environment.

              </p>
              <p>
              I strive to make real changes in society by implementing the solutions proposed in research, rather than just restricting them to a plain piece of work.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />

    </>
  );
};

export default Koena;
