module.exports = {
  storeFaqs: async (req, res) => {
    const valSchema = {
      'title': 'required|string',
      'description': 'required|string',
    };

    return valSchema;
  },
  storeHelpVideos: async (req, res) => {
    const valSchema = {
      'title': 'required|string',
      'description': 'required|string',
    };

    return valSchema;
  },
  howToDocs: async (req, res) => {
    const valSchema = {
      'title': 'required|string',
      'description': 'required|string',
    };

    return valSchema;
  },
  contactSupport: async (req, res) => {
    const valSchema = {
      'first_name': 'required|string',
      'last_name': 'required|string',
      'email': 'required|email',
      'mobile': 'required|phoneNumber',
      'message': 'required|string',
    };

    return valSchema;
  },
}