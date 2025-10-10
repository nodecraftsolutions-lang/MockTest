const mongoose = require('mongoose');
const Company = require('./Backend/src/models/Company');

// Connect to MongoDB (adjust the connection string as needed)
mongoose.connect('mongodb://localhost:27017/mocktest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkCompanies = async () => {
  try {
    const companies = await Company.find({}, 'name defaultPattern');
    console.log('Companies and their defaultPattern data:');
    companies.forEach(company => {
      console.log(`\nCompany: ${company.name}`);
      console.log('Default Pattern:', company.defaultPattern);
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkCompanies();