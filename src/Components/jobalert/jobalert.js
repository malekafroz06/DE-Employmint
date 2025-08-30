import React from "react";
import "./jobalert.css";

const JobAlert = () => {
  return (
    <div className="job-alerts-wrapper">
      <h2 className="form-heading">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.7042 19.316C21.5254 17.691 24.5704 12.5448 21.9617 9.08601C21.6917 8.71101 22.0667 7.92351 22.3179 7.39226C22.9279 6.10726 22.7979 5.05726 21.5792 4.42976C20.3604 3.80226 19.4192 4.37976 18.7042 5.42976C18.3667 5.92976 17.8192 6.67976 17.4317 6.64101C13.1442 6.36726 10.5267 11.716 9.08041 12.4498C7.37041 13.3173 3.45541 13.896 2.79416 16.2735C1.93291 19.346 4.65666 22.4085 10.2367 25.446C15.8167 28.4835 19.8617 29.1035 21.9492 26.696C23.5679 24.8373 21.9154 21.2298 21.7042 19.316Z" fill="#191919" />
          <path d="M18.3748 29.1702C18.01 29.1692 17.6456 29.1467 17.2835 29.1027C15.2048 28.8527 12.7435 27.9452 9.7585 26.3202C6.7735 24.6952 4.67225 23.1252 3.331 21.5089C1.821 19.6914 1.316 17.8377 1.831 16.0002C2.46225 13.7502 5.10725 12.8327 7.03975 12.1664C7.57981 11.994 8.10909 11.7895 8.62475 11.5539C8.87475 11.4289 9.466 10.7327 9.93975 10.1789C11.5223 8.32016 13.886 5.53766 17.2798 5.62516C17.5019 5.39094 17.7011 5.13603 17.8748 4.86391C18.9848 3.23891 20.4998 2.75391 22.0323 3.54141C22.8098 3.94141 24.481 5.15891 23.2173 7.82266C23.0819 8.08965 22.9686 8.36724 22.8785 8.65266C24.8473 11.4552 23.8135 14.9902 23.1285 17.3439C22.9223 18.0477 22.666 18.9227 22.6985 19.2064C22.7847 19.7692 22.9041 20.3264 23.056 20.8752C23.5823 22.9739 24.2373 25.5864 22.7048 27.3477C21.6535 28.5614 20.1998 29.1702 18.3748 29.1702ZM17.1248 7.62516C14.7385 7.62516 12.8573 9.83766 11.471 11.4689C10.7323 12.3439 10.1485 13.0252 9.536 13.3352C8.93867 13.6139 8.32408 13.8539 7.696 14.0539C6.0985 14.6052 4.10975 15.2927 3.761 16.5377C3.07725 18.9764 5.4185 21.6764 10.7198 24.5627C16.021 27.4489 19.5423 27.9377 21.1985 26.0389C22.046 25.0639 21.5323 23.0139 21.1185 21.3652C20.942 20.7278 20.8063 20.0798 20.7123 19.4252C20.6373 18.7427 20.8898 17.8764 21.2123 16.7814C21.8373 14.6427 22.6948 11.7139 21.1673 9.68766L21.156 9.67266C20.5385 8.81891 21.0685 7.70266 21.4185 6.96391C21.9885 5.76266 21.4898 5.50641 21.126 5.31891C20.8123 5.15766 20.2873 4.88766 19.536 5.98891C18.9673 6.82391 18.286 7.70766 17.3635 7.63391C17.2798 7.62516 17.1998 7.62516 17.1248 7.62516Z" fill="#191919" />
          <path d="M21.7042 19.316C21.5254 17.691 24.5704 12.5448 21.9617 9.08601C21.6917 8.71101 22.0667 7.92351 22.3179 7.39226C22.9279 6.10726 22.7979 5.05726 21.5792 4.42976C20.3604 3.80226 19.4192 4.37976 18.7042 5.42976C18.3667 5.92976 17.8192 6.67976 17.4317 6.64101C13.1442 6.36726 10.5267 11.716 9.08041 12.4498C7.37041 13.3173 3.45541 13.896 2.79416 16.2735C1.93291 19.346 4.65666 22.4085 10.2367 25.446C15.8167 28.4835 19.8617 29.1035 21.9492 26.696C23.5679 24.8373 21.9154 21.2298 21.7042 19.316Z" fill="#FFD75E" />
          <path d="M10.3053 18.8889C10.7028 18.9151 15.759 21.6839 16.1065 21.9589C16.454 22.2339 15.559 23.3851 14.019 23.4989C12.479 23.6126 10.2765 22.6939 9.83403 21.9351C9.39153 21.1764 9.90778 18.8626 10.3053 18.8889Z" fill="#ED0006" />
          <path d="M15.8232 21.8089C15.5807 21.8227 13.9344 23.5302 12.1982 22.6277C9.79315 21.3777 10.7394 19.2852 10.5732 19.0027C10.4069 18.7202 5.79565 17.0727 5.26815 17.9502C4.7844 18.7564 7.4194 21.6139 11.2369 23.5902C15.1232 25.6014 18.6632 26.3127 19.1244 25.4927C19.6707 24.5102 16.0644 21.7952 15.8232 21.8089Z" fill="white" />
          <path d="M2.48001 9.8367C2.99126 7.8892 5.09001 6.0042 6.98001 5.52795C7.45001 5.41045 7.11126 4.2867 6.58126 4.40295C4.50876 4.86545 2.28251 6.6017 1.26001 9.3567C1.00001 10.0442 2.38376 10.2055 2.48001 9.8367Z" fill="#191919" />
          <path d="M5.84292 9.59303C6.68542 8.36053 7.80417 8.07803 8.86667 7.96803C9.33667 7.92053 9.33667 6.71803 8.84542 6.75678C7.54792 6.86053 6.02917 7.11428 4.79292 8.82053C4.37542 9.39178 5.60292 9.94553 5.84292 9.59303Z" fill="#191919" />
          <path d="M27.699 14.6729C29.2715 16.0091 30.074 18.7841 29.679 20.7454C29.579 21.2316 30.7202 21.5954 30.8465 21.0529C31.3465 18.9279 30.7215 15.8654 28.6365 13.6979C28.1152 13.1566 27.4015 14.4204 27.699 14.6729Z" fill="#191919" />
          <path d="M26.4837 18.0432C27.17 19.4107 26.8675 20.5532 26.4362 21.5607C26.2462 22.0057 27.3337 22.542 27.5425 22.0832C28.135 20.7795 28.5875 19.427 27.6475 17.417C27.3425 16.762 26.2887 17.6532 26.4837 18.0432Z" fill="#191919" />
        </svg>
        Create Job Alert
      </h2>

      <form action="#" method="GET" className="job-alerts-form">
        <div className="field-input">
          <label htmlFor="email">Your email <span>*</span></label>
          <input type="text" id="email" name="email" required placeholder="Your email" defaultValue="" />
        </div>

        <div className="field-input">
          <label htmlFor="tel">Your phone </label>
          <input type="tel" id="tel" name="phone" placeholder="Your phone" defaultValue="" />
        </div>

        <div className="field-select">
          <label htmlFor="category">Job category</label>
          <div className="form-select">
            <select name="category" id="category" className="civi-select2">
              <option value="">Select an option</option>
              <option value="40" data-level="1">Analytics</option>
              <option value="103" data-level="1">Customer Service</option>
              <option value="115" data-level="1">Design &amp; Creative</option>
              <option value="118" data-level="1">Development &amp; IT</option>
              <option value="159" data-level="1">Legal &amp; Finance</option>
              <option value="173" data-level="1">Marketing &amp; Sales</option>
              <option value="200" data-level="1">Product Management</option>
              <option value="262" data-level="1">Writing &amp; Translation</option>
            </select>
          </div>
        </div>

        <div className="field-select">
          <label htmlFor="location">Location</label>
          <div className="form-select">
            <select name="location" id="location" className="civi-select2">
              <option value="">Select an option</option>
              <option value="39" data-level="1">Ab e Kamari</option>
              <option value="42" data-level="1">Ashkasham</option>
              <option value="49" data-level="1">Aurora</option>
              <option value="65" data-level="1">Banu</option>
              <option value="70" data-level="1">Bellevue</option>
              <option value="71" data-level="1">Berkeley</option>
              <option value="74" data-level="1">Boston</option>
              <option value="81" data-level="1">Buffalo</option>
              <option value="87" data-level="1">California</option>
              <option value="90" data-level="1">Cambridge</option>
              <option value="99" data-level="1">Chicago</option>
              <option value="127" data-level="1">Evanston</option>
              <option value="128" data-level="1">Everett</option>
              <option value="147" data-level="1">Hai Chau</option>
              <option value="157" data-level="1">Joliet</option>
              <option value="161" data-level="1">Long Beach</option>
              <option value="165" data-level="1">Long Bien</option>
              <option value="183" data-level="1">Mountain View</option>
              <option value="185" data-level="1">New York</option>
              <option value="191" data-level="1">Newton</option>
              <option value="210" data-level="1">Rochester</option>
              <option value="214" data-level="1">Sacramento</option>
              <option value="217" data-level="1">San Diego</option>
              <option value="220" data-level="1">San Francisco</option>
              <option value="222" data-level="1">San Jose</option>
              <option value="228" data-level="1">Seatle</option>
              <option value="238" data-level="1">Syracuse</option>
              <option value="239" data-level="1">Tacoma</option>
              <option value="246" data-level="1">Thu Duc</option>
              <option value="261" data-level="1">Worcester</option>
              <option value="265" data-level="1">Yonkers</option>
            </select>
          </div>
        </div>

        <div className="field-select">
          <label htmlFor="experience">Job experience</label>
          <div className="form-select">
            <select name="experience" id="experience" className="civi-select2">
              <option value="">Select an option</option>
              <option value="18" data-level="1">1 - 2 Years</option>
              <option value="21" data-level="1">10+ Years</option>
              <option value="27" data-level="1">3 - 5 Years</option>
              <option value="35" data-level="1">6 - 9 Years</option>
            </select>
          </div>
        </div>

        <div className="field-input">
          <label htmlFor="skills">Job skills</label>
          <div className="form-select">
            <select data-placeholder="Select skills" className="civi-select2" name="skills" id="skills">
              <option value="">Select an option</option>
              <option value="55" data-level="1">BackEnd Developer</option>
              <option value="197" data-level="2">PHP</option>
              <option value="205" data-level="2">Python</option>
              <option value="82" data-level="1">Business Manager</option>
              <option value="268" data-level="2">Business Development</option>
              <option value="100" data-level="2">Consulting</option>
              <option value="101" data-level="1">Content Editor</option>
              <option value="105" data-level="1">Customer Support</option>
              <option value="272" data-level="2">Customer Service</option>
              <option value="242" data-level="2">Technical Support</option>
              <option value="109" data-level="1">Data Analytics</option>
              <option value="112" data-level="2">Data Visualization</option>
              <option value="175" data-level="2">Marketo</option>
              <option value="110" data-level="1">Data Management</option>
              <option value="131" data-level="2">Experimentation</option>
              <option value="234" data-level="2">Statistics</option>
              <option value="111" data-level="1">Data Scientist</option>
              <option value="269" data-level="2">Cloud Environments DBT</option>
              <option value="113" data-level="2">Data Visualization Tools</option>
              <option value="119" data-level="1">Director of Design</option>
              <option value="209" data-level="2">Responsive Design</option>
              <option value="257" data-level="2">Web Design</option>
              <option value="134" data-level="1">Finance Manager</option>
              <option value="135" data-level="2">Financial Analysis</option>
              <option value="136" data-level="2">Financial Planning</option>
              <option value="174" data-level="1">Marketing Manager</option>
              <option value="280" data-level="2">Market Research</option>
              <option value="199" data-level="2">Product Launch</option>
              <option value="181" data-level="1">Mobile Engineer</option>
              <option value="279" data-level="2">Kotlin</option>
              <option value="282" data-level="2">Mobile Design</option>
              <option value="201" data-level="1">Product Manager</option>
              <option value="233" data-level="1">Software Engineer</option>
              <option value="276" data-level="2">Domain Driven Design</option>
              <option value="281" data-level="2">Microservices</option>
              <option value="247" data-level="1">UI design</option>
              <option value="285" data-level="2">Sketch</option>
              <option value="259" data-level="2">Wireframing</option>
              <option value="249" data-level="1">User Experience</option>
              <option value="275" data-level="2">Design Research</option>
              <option value="251" data-level="2">User Experience Research</option>
              <option value="252" data-level="1">UX design</option>
              <option value="283" data-level="2">Prototyping</option>
              <option value="284" data-level="2">Quantitative Research</option>
              <option value="287" data-level="2">User Centered Design</option>
              <option value="253" data-level="1">UX research</option>
            </select>
          
          </div>
        </div>

        <div className="field-select">
          <label htmlFor="type">Job type</label>
          <div className="form-select">
            <select data-placeholder="Select an option" className="civi-select2" name="types" id="type">
              <option value="">Select an option</option>
              <option value="143" data-level="1">Full Time</option>
              <option value="154" data-level="1">Internship</option>
              <option value="196" data-level="1">Part Time</option>
              <option value="208" data-level="1">Remote</option>
            </select>
           
          </div>
        </div>

        <div className="field-select">
          <label htmlFor="frequency">Frequency</label>
          <div className="form-select">
            <select name="frequency" id="frequency" className="civi-select2">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="field-submit">
          <div className="notice" />
          <button className="civi-button" type="submit">
            <span className="bell-icon" aria-hidden>
              {/* inline bell SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 2C10.3431 2 9 3.34315 9 5V6.084C6.16263 7.16514 4 9.93319 4 13V17L2 19V20H22V19L20 17V13C20 9.93319 17.8374 7.16514 15 6.084V5C15 3.34315 13.6569 2 12 2Z" fill="#FFFFFF"/>
                <path d="M8.99999 20C8.99999 21.1046 9.89544 22 10.9999 22H13.0001C14.1046 22 15 21.1046 15 20H8.99999Z" fill="#FFFFFF"/>
              </svg>
            </span>
            <span>Create job alert</span>
            {/* <span className="btn-loading"><i className="fal fa-spinner fa-spin large" aria-hidden /></span> */}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobAlert;
