import "./App.css";
import Home from "./Components/Home/Home";
import Candidatedashboard from "./Components/Candidatedashboard/Candidatedashboard";
import About from "./Components/About";
import JobSearch from "./Components/Jobsearch/Jobsearch";
import ProfilePage from "./Components/ProfilePage/ProfilePage";
import Navbar from "./Components/Navbar/Navbar";
import Workk from "./Components/Workk/Workk";
import Testimonial from "./Components/Testimonial/Testimonial";
import JobAlert from "./Components/jobalert/jobalert";
import Contact from "./Components/Contact";
import Footer from "./Components/Footer/Footer";
import RoleSection from "./Components/RoleSection/RoleSection";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
function App() {
  return (
    <div className="App">
      <Navbar/>
        <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/candidatedashboard" element={<Candidatedashboard />} />
      <Route path="/rolesection" element={<RoleSection />} />
            <Route path="/profilepage" element={<ProfilePage />} />
       <Route path="/workk" element={<Workk />} />
         <Route path="/jobalert" element={<JobAlert />} />
        <Route path="/testimonial" element={<Testimonial />} />
         <Route path="/contact" element={<Contact />} />
    </Routes>

     
      <Footer />
    </div>
  );
}

export default App;
