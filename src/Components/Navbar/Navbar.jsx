/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";
import DEEmploymint from "../../Assets/DEEmploymint.png";
import { HiOutlineBars3 } from "react-icons/hi2";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import AuthModal from "../Auth/AuthModal"; // Import the AuthModal component
import Postajob from "../Postajob/Postajob";
import './Navbar.css';

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false); // Add state for auth modal

  const menuOptions = [
    {
      text: "Home",
      icon: <HomeIcon />,
    },
    {
      text: "Job Categories",
      icon: <InfoIcon />,
    },
    {
      text: "Job Industries",
      icon: <CommentRoundedIcon />,
    },
    {
      text: "Latest Jobs",
      icon: <PhoneRoundedIcon />,
    },
    {
      text: "Job Alert",
      icon: <ShoppingCartRoundedIcon />,
    },
      {
      element:<button className="primary-button">Post a job</button>,
      icon: <ShoppingCartRoundedIcon />,
    },
  ];
 const handlepost= () => {
   
     window.location.href = "/postajob"; 
  };
  const handleLoginClick = () => {
    setOpenAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setOpenAuthModal(false);
  };

  return (
    <>
      <nav>
        <div className="nav-logo-container">
          <img src={DEEmploymint} alt="" />
        </div>
        <div className="navbar-links-container">
          <a href="/">Home</a>
          <a href="jobcategories">Job Categories</a>
          <a href="">Job Industries</a>
          <a href="">Latest Jobs</a>
          <a href="/JobAlert">Job Alert</a>
          <a href="#" onClick={handleLoginClick}>
            Login
          </a>
          <button onClick={handlepost} className="primary-button">Post a Job</button>
        </div>
        <div className="navbar-menu-container">
          <HiOutlineBars3 onClick={() => setOpenMenu(true)} />
        </div>
        <Drawer open={openMenu} onClose={() => setOpenMenu(false)} anchor="right">
          <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={() => setOpenMenu(false)}
            onKeyDown={() => setOpenMenu(false)}
          >
            <List>
              {menuOptions.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                     
                  </ListItemButton>
                  
                </ListItem>
              ))}
              
            </List>
            <Divider />
          </Box>
        </Drawer>
      </nav>

      {/* Auth Modal */}
      <AuthModal open={openAuthModal} onClose={handleCloseAuthModal} />
    </>
  );
};

export default Navbar;