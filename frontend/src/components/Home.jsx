import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import axios from 'axios';

const Home = () => {
  const [stats, setStats] = useState({
    totalPets: 1000,
    totalDoctors: 50,
    supportAvailable: '24/7'
  });
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    // Fetch live statistics from backend
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/chatbot/stats/public');
        setStats(response.data);
        setLoading(false);
      } catch (error) {
        console.log('Using default stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Pet Parent',
      text: 'PetCare made booking a vet appointment so easy! The entire process was smooth and transparent.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
      name: 'Michael Chen',
      role: 'Dog Owner',
      text: 'The best platform for pet healthcare. My vets are always responsive and professional.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    },
    {
      name: 'Emma Williams',
      role: 'Cat Enthusiast',
      text: 'I love how I can track my pet\'s health records all in one place. Perfect app!',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
    }
  ];

  return (
    <div className="landing-premium home">
      {/* NAVBAR */}
      <nav className="home-nav-premium">
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/">Pet Place</Link>
          </div>
          
          <ul className="nav-menu">
            <li><Link to="/" className="nav-link active">Home</Link></li>
            <li><Link to="/login" className="nav-link">Login / Register</Link></li>
            <li><Link to="/login" className="nav-link">Products</Link></li>
            <li><Link to="#about" className="nav-link">About</Link></li>
            <li><Link to="#contact" className="nav-link">Contact</Link></li>
          </ul>

          <div className="nav-buttons">
            <Link to="/login" className="btn-nav btn-login">Login</Link>
            <Link to="/register" className="btn-nav btn-register">Sign Up</Link>
          </div>

          <div className="nav-mobile-btn">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-premium">
        <div className="hero-background"></div>
        <div className="hero-content-wrapper">
          <div className="hero-text">
            <h1 className="hero-title">
              Because Your Pet Deserves the <span className="hero-highlight">Best Care</span>
            </h1>
            <p className="hero-subtitle">Connect with expert veterinarians, manage your pet's health, and shop pet supplies—all in one trusted platform.</p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary">Book Appointment</Link>
              <Link to="/login" className="btn btn-secondary">Explore Marketplace</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="pet-collage">
              <img
                src="https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=600&fit=crop"
                alt="Happy dog"
                className="pet-image pet-image-primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* INTRO SECTION */}
      <section className="intro-section reveal">
        <div className="section-top">
          <p className="section-subheader">Intro</p>
          <h2 className="section-title">Get to know us <span className="title-highlight">more</span></h2>
        </div>

        <div className="intro-grid">
          <div className="intro-card glass-card">
            <div className="intro-image">
              <img src="/src/assets/intro-1.png" alt="intro" />
            </div>
            <h3>Pet Experts</h3>
            <p>Meet our team of skilled veterinarians, dedicated to your pet's well-being.</p>
            <Link to="#" className="intro-link">Read More →</Link>
          </div>

          <div className="intro-card glass-card">
            <div className="intro-image">
              <img src="/src/assets/intro-2.png" alt="intro" />
            </div>
            <h3>Vet Services</h3>
            <p>Offering a wide range of veterinary services to keep your pets healthy and happy.</p>
            <Link to="#" className="intro-link">Read More →</Link>
          </div>

          <div className="intro-card glass-card">
            <div className="intro-image">
              <img src="/src/assets/intro-3.png" alt="intro" />
            </div>
            <h3>Contact Us</h3>
            <p>Reach out to us for any inquiries or schedule an appointment for your pet's care.</p>
            <Link to="#" className="intro-link">Read More →</Link>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="about-section reveal">
        <div className="section-top">
          <p className="section-subheader">About Us</p>
          <h2 className="section-title">What we can do <span className="title-highlight">for you</span></h2>
        </div>

        <div className="about-container">
          <div className="about-row">
            <div className="about-image">
              <img src="/src/assets/about-1.jpg" alt="about" />
            </div>
            <div className="about-content">
              <span className="about-icon">
                <img src="/src/assets/about-1-icon.png" alt="icon" />
              </span>
              <h3>Let us help you with your pet health</h3>
              <p>Our expert veterinarians are here to provide comprehensive care and guidance to ensure your pet stays in perfect health.</p>
            </div>
          </div>

          <div className="about-row reverse">
            <div className="about-image">
              <img src="/src/assets/about-2.jpg" alt="about" />
            </div>
            <div className="about-content">
              <span className="about-icon">
                <img src="/src/assets/about-2-icon.png" alt="icon" />
              </span>
              <h3>Caring personal will take care of your pet</h3>
              <p>Your pet will be in good hands with our compassionate and well-trained staff, who treat every pet like family.</p>
            </div>
          </div>

          <div className="about-row">
            <div className="about-image">
              <img src="/src/assets/about-3.jpg" alt="about" />
            </div>
            <div className="about-content">
              <span className="about-icon">
                <img src="/src/assets/about-3-icon.png" alt="icon" />
              </span>
              <h3>Let us groom your precious and loved pet</h3>
              <p>From bathing to styling, we offer professional grooming services to keep your pet looking and feeling their best.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      <section id="store" className="products-section reveal">
        <div className="section-top">
          <p className="section-subheader">Products</p>
          <h2 className="section-title">Featured <span className="title-highlight">pet products</span></h2>
        </div>

        <div className="products-grid">
          <div className="product-card glass-card">
            <img src="/src/assets/product-1.jpg" alt="product" />
            <h4>Dog Trash Bag</h4>
            <p>Convenient and eco-friendly trash bags for easy pet waste disposal.</p>
            <h3>$29.00 USD</h3>
          </div>

          <div className="product-card glass-card">
            <img src="/src/assets/product-2.jpg" alt="product" />
            <h4>Pet Accessories</h4>
            <p>Explore our range of stylish and functional accessories for your furry friends.</p>
            <h3>$49.00 USD</h3>
          </div>

          <div className="product-card glass-card">
            <img src="/src/assets/product-3.jpg" alt="product" />
            <h4>Dog Food</h4>
            <p>Nutritious and delicious dog food to keep your pet healthy and happy.</p>
            <h3>$79.00 USD</h3>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="service" className="services-section reveal">
        <div className="section-top">
          <p className="section-subheader">Services</p>
          <h2 className="section-title">What we can do <span className="title-highlight">for you</span></h2>
        </div>

        <div className="services-flex">
          {[
            { name: "Emergency Care", icon: "🚑" },
            { name: "Vaccination Services", icon: "💉" },
            { name: "Nutrition Counseling", icon: "🥗" },
            { name: "Behavioral Consultation", icon: "🐕" },
            { name: "Pet Boarding Services", icon: "🏠" },
          ].map((service, i) => (
            <div className="service-card" key={i}>
              <div className="service-icon">
                <span>{service.icon}</span>
              </div>
              <p>{service.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="stats-section reveal">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : `${stats.totalPets}+`}</div>
            <div className="stat-label">Happy Pets Cared</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : `${Math.max(4, stats.totalDoctors || 0)}+`}</div>
            <div className="stat-label">Expert Veterinarians</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">99.8%</div>
            <div className="stat-label">Customer Satisfaction</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : stats.supportAvailable}</div>
            <div className="stat-label">Available Support</div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials-section reveal">
        <div className="section-top">
          <h2 className="section-title">What Pet <span className="title-highlight">Parents Say</span></h2>
          <p className="section-subtitle">Real reviews from real pet families</p>
        </div>
        <div className="testimonials-container">
          <div className="testimonials-slide">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className={`testimonial-card ${activeTestimonial === index ? 'active' : ''}`}
              >
                <div className="testimonial-text">"{testimonial.text}"</div>
                <div className="testimonial-author">
                  <img src={testimonial.image} alt={testimonial.name} className="author-image" />
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="testimonials-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${activeTestimonial === index ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(index)}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-premium reveal">
        <div className="cta-content">
          <h2>Ready to Give Your Pet the Care They Deserve?</h2>
          <p>Join thousands of pet families already using Pet Place</p>
          <Link to="/login" className="btn btn-cta">Get Started Today</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="footer-premium">
        <div className="footer-container">
          <div className="footer-col">
            <div className="footer-logo">
              <Link to="/">Pet Place</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="#about">About Us</Link></li>
              <li><Link to="#service">Services</Link></li>
              <li><Link to="#store">Store</Link></li>
              <li><Link to="#">Pricing</Link></li>
              <li><Link to="#">Blog</Link></li>
              <li><Link to="#">Faq</Link></li>
              <li><Link to="#contact">Contact Us</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Address</h4>
            <p>New Delhi, India</p>
            <Link to="#">View on Maps</Link>

            <h4 style={{ marginTop: "1.5rem" }}>Inquiries</h4>
            <p>+91 0987654321</p>
            <p>info@website.com</p>
          </div>

          <div className="footer-col">
            <h4>Newsletter</h4>
            <p>Stay updated with our latest news</p>

            <form className="footer-form">
              <input type="email" placeholder="Your email" />
              <button type="submit">→</button>
            </form>

            <h4 style={{ marginTop: "1.5rem" }}>Follow Us</h4>
            <div className="footer-socials">
              <a href="#">G</a>
              <a href="#">t</a>
              <a href="#">▶</a>
              <a href="#">p</a>
              <a href="#">i</a>
              <a href="#">♪</a>
            </div>
          </div>
        </div>

        <div className="footer-bar">
          Copyright © 2024 Pet Place. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default Home;