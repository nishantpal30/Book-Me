import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLoginPageStyles as css } from "../utils/dummystyle";
import logo from "../assets/logo.png";
import { adminLogin } from "../api/admin";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data } = await adminLogin(form);
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
      }
      navigate("/admin/dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={css.pageContainer}>
      <div className={css.card}>
        {/* left panneel */}
        <div className={css.leftPanel}>
          <div className={css.leftContent}>
            <p className={css.leftEyebrow}>System Access</p>
            <div className={css.leftLogoRow}>
              <img src={logo} className={css.leftLogoImg} alt="brand logo" />
            </div>
            <h1 className={css.leftHeading}>
              BookMe
              <br />
              <span className={css.leftHeadingAccent}>Admin</span>
            </h1>
            <p className={css.leftDescription}>
              Money movement , user overview , and payout requests . Moniter the
              platform from one desk.
            </p>
          </div>
        </div>
        {/* Remain Pannel */}
        <div className={css.rightPanel}>
          <h2 className={css.formTitle}>Admin Login</h2>
          <p className={css.formSubtitle}>
            Enter Your credentials to access the dashboard!!
          </p>
          {message && <div className={css.messageBox}>{message}</div>}
          <form onSubmit={handleSubmit} className={css.form}>
            <div>
              <label className={css.inputLabel}>Email </label>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className={css.textInput}
                placeholder="Enter admin email"
              />
            </div>
            <div>
            <label className={css.inputLabel}>Password</label>
            <input type="password" value={form.password}
            onChange={(e) =>{
                setForm((prev)=>({...prev,password:e.target.value}))
            }} className={css.textInput} placeholder="********" required/>
            </div>
            <button type="submit" disabled={loading} className={css.submitButton}>
                {loading?"Aunthenticating...":"Secure Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
