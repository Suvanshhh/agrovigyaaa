import Navbar from '../../../components/Navbar/navbar';
import Footer from '../../../components/Footer/footer';
import styles from './Urukriti.module.css';

const Urukriti = () => {
  return (
    <>
      <Navbar />
      <div className={styles.profileBg}>
        <div className={styles.profileContainer}>
          <h1 className={styles.profileTitle}>Urukriti Gupta</h1>
          <div className={styles.profileCard}>
            <div className={styles.profileImageWrapper}>
              <img
                src="https://i.postimg.cc/TYB99NgL/urukriti.jpg"
                alt="Urukriti Gupta"
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
                  <span className={styles.detailLabel}>Website Developer</span>
                  
                </div>
              </div>
            </div>
            <div className={styles.profileDesc}>
              <p>
                I'm Urukirti Gupta, a B.A. LL.B. student at DES's Shri. Navalmal Firodia Law College, Pune, and a passionate member of Agrovigya. We're a team that believes bridging age-old traditions and cutting-edge techniques. My journey with this project isn't just about managing tasks; it's about nurturing an idea from the ground up and transforming it into a living, breathing platform.
              </p>
              <p>
                I've learned that a team isn't a collection of fixed roles, but a force of shared passion. I thrive on the notion of perfection, I'm a person of the belief that every collective effort contributes to a flawless outcome. With Agrovigya, we're not just building an app; we're cultivating a community, and I'm here to ensure our platform is as substantial and impactful as the ideas it represents.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Urukriti;
