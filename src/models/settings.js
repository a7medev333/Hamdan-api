const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  supportLinks: {
    whatsapp: {
      type: String,
      trim: true,
      default: ''
    },
    telegram: {
      type: String,
      trim: true,
      default: ''
    },
    snapchat: {
      type: String,
      trim: true,
      default: ''
    }
  },
  welcomeMessage: {
    type: String,
    trim: true,
    default: 'Welcome to our platform!'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one settings document exists
settingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
