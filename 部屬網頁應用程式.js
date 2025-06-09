const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

async function main() {
    const clientId = '974933195533-eb0ontecgqb7ru73akg51ipg3ao73sd0.apps.googleusercontent.com';
    const clientSecret = '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';
    const redirectUri = 'YOUR_REDIRECT_URI';
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // Set up the auth tokens, etc.
    // You can generate these by following the Google Apps Script API documentation:
    // https://developers.google.com/apps-script/api/how-tos/execute
    const tokens = {
        access_token: 'YOUR_ACCESS_TOKEN',
        refresh_token: 'YOUR_REFRESH_TOKEN',
    };
    oauth2Client.setCredentials(tokens);

    const scriptId = 'YOUR_SCRIPT_ID';

    const script = google.script('v1');

    const version = await script.projects.versions.create({
        auth: oauth2Client,
        scriptId,
        requestBody: {
            description: 'A new version',
        },
    });

    const deployment = await script.projects.deployments.create({
        auth: oauth2Client,
        scriptId,
        requestBody: {
            versionNumber: version.data.versionNumber,
            manifestFileName: 'appsscript',  // The default manifest file name
            description: 'A new deployment',
        },
    });

    console.log('Deployed as web app: ', deployment.data);
}

main().catch(console.error);
