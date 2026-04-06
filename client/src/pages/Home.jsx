import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
 import JobListing from '../components/JobListing'
import Footer from '../components/Footer'
import Calltoaction from '../components/Calltoaction'
import WhatsAppContact from '../components/WhatsAppContact'

const Home = () => {

  return (
    <div>
      <Navbar />
      <Hero />
      <JobListing />
      <Calltoaction />
      <WhatsAppContact/>
      <Footer />
    </div>
  )
}

export default Home;
