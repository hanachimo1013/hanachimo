import { google } from 'googleapis';

const FOLDER_ID = '1Zcrof3s192GU49Lu8AXjtyWS33eBSrJW';

export default async function handler(req, res) {
  // Check if credentials are provided in env vars
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return res.status(500).json({ error: 'Google Credentials not set on server.' });
  }

  let credentials;
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to parse Google Credentials.' });
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const { fileId } = req.query;

  try {
    // If no fileId, list the contents of the folder
    if (!fileId) {
      const response = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and mimeType = 'application/pdf' and trashed = false`,
        fields: 'files(id, name, thumbnailLink)',
        orderBy: 'name',
      });
      return res.status(200).json(response.data.files);
    }

    // If fileId exists, stream the PDF media
    const file = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', 'application/pdf');
    file.data.pipe(res);
  } catch (err) {
    console.error('Drive API Error:', err);
    res.status(500).json({ error: err.message });
  }
}
