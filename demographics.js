"use strict";

window.SurveyDemographics = (() => {
  const GROWING_UP_COUNTRIES = [["AF","Afghanistan"],["AX","Åland Islands"],["AL","Albania"],["DZ","Algeria"],["AS","American Samoa"],["AD","Andorra"],["AO","Angola"],["AI","Anguilla"],["AQ","Antarctica"],["AG","Antigua & Barbuda"],["AR","Argentina"],["AM","Armenia"],["AW","Aruba"],["AU","Australia"],["AT","Austria"],["AZ","Azerbaijan"],["BS","Bahamas"],["BH","Bahrain"],["BD","Bangladesh"],["BB","Barbados"],["BY","Belarus"],["BE","Belgium"],["BZ","Belize"],["BJ","Benin"],["BM","Bermuda"],["BT","Bhutan"],["BO","Bolivia"],["BA","Bosnia & Herzegovina"],["BW","Botswana"],["BV","Bouvet Island"],["BR","Brazil"],["IO","British Indian Ocean Territory"],["VG","British Virgin Islands"],["BN","Brunei"],["BG","Bulgaria"],["BF","Burkina Faso"],["BI","Burundi"],["KH","Cambodia"],["CM","Cameroon"],["CA","Canada"],["CV","Cape Verde"],["BQ","Caribbean Netherlands"],["KY","Cayman Islands"],["CF","Central African Republic"],["TD","Chad"],["CL","Chile"],["CN","China"],["CX","Christmas Island"],["CC","Cocos (Keeling) Islands"],["CO","Colombia"],["KM","Comoros"],["CG","Congo - Brazzaville"],["CD","Congo - Kinshasa"],["CK","Cook Islands"],["CR","Costa Rica"],["CI","Côte d’Ivoire"],["HR","Croatia"],["CU","Cuba"],["CW","Curaçao"],["CY","Cyprus"],["CZ","Czechia"],["DK","Denmark"],["DJ","Djibouti"],["DM","Dominica"],["DO","Dominican Republic"],["EC","Ecuador"],["EG","Egypt"],["SV","El Salvador"],["GQ","Equatorial Guinea"],["ER","Eritrea"],["EE","Estonia"],["SZ","Eswatini"],["ET","Ethiopia"],["FK","Falkland Islands (Islas Malvinas)"],["FO","Faroe Islands"],["FJ","Fiji"],["FI","Finland"],["FR","France"],["GF","French Guiana"],["PF","French Polynesia"],["TF","French Southern Territories"],["GA","Gabon"],["GM","Gambia"],["GE","Georgia"],["DE","Germany"],["GH","Ghana"],["GI","Gibraltar"],["GR","Greece"],["GL","Greenland"],["GD","Grenada"],["GP","Guadeloupe"],["GU","Guam"],["GT","Guatemala"],["GG","Guernsey"],["GN","Guinea"],["GW","Guinea-Bissau"],["GY","Guyana"],["HT","Haiti"],["HM","Heard & McDonald Islands"],["HN","Honduras"],["HK","Hong Kong"],["HU","Hungary"],["IS","Iceland"],["IN","India"],["ID","Indonesia"],["IR","Iran"],["IQ","Iraq"],["IE","Ireland"],["IM","Isle of Man"],["IL","Israel"],["IT","Italy"],["JM","Jamaica"],["JP","Japan"],["JE","Jersey"],["JO","Jordan"],["KZ","Kazakhstan"],["KE","Kenya"],["KI","Kiribati"],["KW","Kuwait"],["KG","Kyrgyzstan"],["LA","Laos"],["LV","Latvia"],["LB","Lebanon"],["LS","Lesotho"],["LR","Liberia"],["LY","Libya"],["LI","Liechtenstein"],["LT","Lithuania"],["LU","Luxembourg"],["MO","Macao"],["MG","Madagascar"],["MW","Malawi"],["MY","Malaysia"],["MV","Maldives"],["ML","Mali"],["MT","Malta"],["MH","Marshall Islands"],["MQ","Martinique"],["MR","Mauritania"],["MU","Mauritius"],["YT","Mayotte"],["MX","Mexico"],["FM","Micronesia"],["MD","Moldova"],["MC","Monaco"],["MN","Mongolia"],["ME","Montenegro"],["MS","Montserrat"],["MA","Morocco"],["MZ","Mozambique"],["MM","Myanmar (Burma)"],["NA","Namibia"],["NR","Nauru"],["NP","Nepal"],["NL","Netherlands"],["NC","New Caledonia"],["NZ","New Zealand"],["NI","Nicaragua"],["NE","Niger"],["NG","Nigeria"],["NU","Niue"],["NF","Norfolk Island"],["KP","North Korea"],["MK","North Macedonia"],["MP","Northern Mariana Islands"],["NO","Norway"],["OM","Oman"],["PK","Pakistan"],["PW","Palau"],["PS","Palestine"],["PA","Panama"],["PG","Papua New Guinea"],["PY","Paraguay"],["PE","Peru"],["PH","Philippines"],["PN","Pitcairn Islands"],["PL","Poland"],["PT","Portugal"],["PR","Puerto Rico"],["QA","Qatar"],["RE","Réunion"],["RO","Romania"],["RU","Russia"],["RW","Rwanda"],["WS","Samoa"],["SM","San Marino"],["ST","São Tomé & Príncipe"],["SA","Saudi Arabia"],["SN","Senegal"],["RS","Serbia"],["SC","Seychelles"],["SL","Sierra Leone"],["SG","Singapore"],["SX","Sint Maarten"],["SK","Slovakia"],["SI","Slovenia"],["SB","Solomon Islands"],["SO","Somalia"],["ZA","South Africa"],["GS","South Georgia & South Sandwich Islands"],["KR","South Korea"],["SS","South Sudan"],["ES","Spain"],["LK","Sri Lanka"],["BL","St. Barthélemy"],["SH","St. Helena"],["KN","St. Kitts & Nevis"],["LC","St. Lucia"],["MF","St. Martin"],["PM","St. Pierre & Miquelon"],["VC","St. Vincent & Grenadines"],["SD","Sudan"],["SR","Suriname"],["SJ","Svalbard & Jan Mayen"],["SE","Sweden"],["CH","Switzerland"],["SY","Syria"],["TW","Taiwan"],["TJ","Tajikistan"],["TZ","Tanzania"],["TH","Thailand"],["TL","Timor-Leste"],["TG","Togo"],["TK","Tokelau"],["TO","Tonga"],["TT","Trinidad & Tobago"],["TN","Tunisia"],["TR","Türkiye"],["TM","Turkmenistan"],["TC","Turks & Caicos Islands"],["TV","Tuvalu"],["UM","U.S. Outlying Islands"],["VI","U.S. Virgin Islands"],["UG","Uganda"],["UA","Ukraine"],["AE","United Arab Emirates"],["GB","United Kingdom"],["US","United States"],["UY","Uruguay"],["UZ","Uzbekistan"],["VU","Vanuatu"],["VA","Vatican City"],["VE","Venezuela"],["VN","Vietnam"],["WF","Wallis & Futuna"],["EH","Western Sahara"],["YE","Yemen"],["ZM","Zambia"],["ZW","Zimbabwe"]];
  const decline = ["prefer_not_to_answer", "Prefer not to answer"];
  const fields = [
    { name: "age_band", label: "What is your age group?", options: [
      ["18_24", "18-24"], ["25_34", "25-34"], ["35_44", "35-44"], ["45_54", "45-54"],
      ["55_64", "55-64"], ["65_plus", "65 or older"], decline
    ] },
    { name: "gender_identity", label: "How do you describe your gender?", options: [
      ["woman", "Woman"], ["man", "Man"], ["non_binary", "Non-binary"],
      ["another_identity", "Another gender identity"], decline
    ] },
    { name: "education_level", label: "What is the highest level of education you have completed?", options: [
      ["primary_or_less", "Primary education or less"], ["lower_secondary", "Lower secondary (ESO)"],
      ["upper_secondary", "Upper secondary / FP Medio"],
      ["short_cycle_tertiary", "Short-cycle tertiary / FP Superior"],
      ["bachelor", "Bachelor's degree"], ["master", "Master's degree"],
      ["doctorate", "Doctoral degree"], ["other", "Another qualification"], decline
    ] },
    { name: "design_expertise", label: "Do you have formal training or professional experience in architecture, urban design, urban planning or landscape architecture?", options: [
      ["none", "Neither training nor experience"],
      ["training_only", "Formal training only"],
      ["experience_only", "Professional experience only"],
      ["training_and_experience", "Training and experience"], decline
    ] },
    { name: "professional_field", label: "What is your main current or most recent field of work?", options: [
      ["architecture", "Architecture"], ["urban_design_planning", "Urban design or urban planning"],
      ["landscape_architecture", "Landscape architecture"], ["building_engineering", "Building engineering, construction or surveying"],
      ["other_design", "Other design fields"], ["other_field", "Another field of work"],
      ["no_work_experience", "No work experience yet"], decline
    ] },
    { name: "built_environment_training", label: "What is your education status in architecture, urban design, urban planning or landscape architecture?", options: [
      ["none", "No education in these fields"], ["current_student", "Currently studying, no qualification completed in these fields"],
      ["completed_qualification", "Completed a qualification in one of these fields"],
      ["other_training", "Other courses or training in these fields"], decline
    ] },
    { name: "built_environment_experience", label: "How many years of professional experience do you have in architecture, urban design, urban planning or landscape architecture?", options: [
      ["none", "No professional experience in these fields"], ["under_1", "Less than one year"],
      ["1_2", "1-2 years"], ["3_5", "3-5 years"], ["6_10", "6-10 years"], ["over_10", "More than 10 years"], decline
    ] },
    { name: "growing_up_country", label: "In which country did you mainly live during childhood and adolescence (ages 0-18)?", options: [
      ...GROWING_UP_COUNTRIES,
      ["multiple_countries", "Multiple countries, with no single main country"],
      ["not_listed", "My country is not listed"], decline
    ] },
    { name: "barcelona_residence_duration", label: "In total, how long have you lived in Barcelona city?", options: [
      ["less_than_1_year", "Less than 1 year"], ["1_to_under_3_years", "1 to less than 3 years"],
      ["3_to_under_5_years", "3 to less than 5 years"], ["5_to_under_10_years", "5 to less than 10 years"],
      ["10_years_or_more", "10 years or more"], decline
    ] }
  ];
  const forSource = () => fields;
  function metadata(source, response) {
    const complete = Boolean(response);
    return {
      demographics_version: response ? response.demographics_version || "facade_demographics_v1" : "facade_demographics_v3",
      demographics_status: complete ? "completed_optional_page" : "not_reached",
      age_data_source: "questionnaire",
      education_data_source: "questionnaire",
      age_band: response?.age_band || "not_collected",
      education_level: response?.education_level || "not_collected",
      gender_identity: response?.gender_identity || "not_collected",
      design_expertise: response?.design_expertise || "not_collected",
      professional_field: response?.professional_field || "not_collected",
      built_environment_training: response?.built_environment_training || "not_collected",
      built_environment_experience: response?.built_environment_experience || "not_collected",
      growing_up_country: response?.growing_up_country || "not_collected",
      barcelona_residence_duration: response?.barcelona_residence_duration || "not_collected"
    };
  }
  class DemographicsPlugin {
    constructor(jsPsych) { this.jsPsych = jsPsych; }
    trial(displayElement, trial) {
      const start = performance.now();
      const questions = forSource(trial.source);
      displayElement.innerHTML = `<div class="wrap"><section class="panel demographics-panel">
        <h1>About you</h1><p>These questions are optional. You may leave any question unanswered or choose Prefer not to answer.</p>
        <form id="demographics-form" class="demographics-form">
          ${questions.map(field => `<div class="demographic-field">
            <label for="demo-${field.name}">${escapeHtml(field.label)}</label>
            ${field.name === "education_level" ? '<p class="demographic-note">Select the closest equivalent for qualifications obtained outside Spain.</p>' : ""}
            ${field.name === "design_expertise" ? '<p class="demographic-note">Formal training includes current studies.</p>' : ""}
            <select id="demo-${field.name}" name="${field.name}">
              <option value="">Select an option (optional)</option>
              ${field.options.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("")}
            </select></div>`).join("")}
          <div class="actions"><button class="primary-button" type="submit">Continue</button></div>
        </form></section></div>`;
      displayElement.querySelector("form").addEventListener("submit", event => {
        event.preventDefault();
        const values = Object.fromEntries(questions.map(field => {
          const value = displayElement.querySelector(`[name="${field.name}"]`).value;
          return [field.name, field.options.some(([code]) => code === value) ? value : "not_answered"];
        }));
        this.jsPsych.finishTrial({ ...trial.data, ...values, demographics_version: "facade_demographics_v3", rt: Math.round(performance.now() - start) });
      });
    }
  }
  DemographicsPlugin.info = { name: "demographics", parameters: {
    source: { type: jsPsychModule.ParameterType.STRING, default: "prolific" },
    data: { type: jsPsychModule.ParameterType.OBJECT, default: {} }
  } };
  return { forSource, metadata, plugin: DemographicsPlugin };
})();
