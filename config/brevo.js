const SibApiV3Sdk = require('@getbrevo/brevo');

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Configure API key authorization: api-key
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

module.exports = {
    apiInstance,
    SibApiV3Sdk
};